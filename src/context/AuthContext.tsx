import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  isSignInWithEmailLink,
  linkWithCredential,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInAnonymously,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type Auth,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  connectCalendarFromFirebase,
  getCalendarConnectionStatus,
} from "@/lib/calendar/api";
import { guessMemberId } from "@/lib/memberLink";
import { guardWriteBudget } from "@/lib/householdSync";
import { isProfileFresh } from "@/lib/profileSync";
import { clearCachedFeeds } from "@/lib/calendar/feedCache";
import { currentIdToken } from "@/lib/idToken";
import {
  clearSeeAsMemberId,
  readSeeAsMemberId,
  readStoredMemberId,
  writeSeeAsMemberId,
  writeStoredMemberId,
} from "@/lib/memberStorage";
import {
  getFirebaseAuth,
  getFirestoreDb,
  isFirebaseConfigured,
  waitForRedirectResult,
} from "@/lib/firebase";

const GOOGLE_CALENDAR_SCOPE =
  "https://www.googleapis.com/auth/calendar.readonly";

type AuthContextValue = {
  user: User | null;
  /** Każda sesja Firebase (Google lub anonimowa) — sync obowiązków w Firestore. */
  syncUser: User | null;
  memberId: string | null;
  /** Podgląd home jako domownik bez logowania Google. */
  seeAsMemberId: string | null;
  loading: boolean;
  syncingCalendar: boolean;
  calendarSyncTick: number;
  error: string | null;
  configured: boolean;
  signInWithGoogle: () => Promise<void>;
  /** Logowanie linkiem na e-mail — bez ekranów Google, bez kalendarza */
  sendEmailLink: (email: string) => Promise<void>;
  /** Otwarto link z maila na innym urządzeniu — trzeba podać adres */
  emailLinkPending: boolean;
  completeEmailLink: (email: string) => Promise<void>;
  syncCalendar: () => Promise<void>;
  connectPersistentCalendar: () => void;
  signOut: () => Promise<void>;
  linkMember: (memberId: string) => Promise<void>;
  setSeeAsMember: (memberId: string) => void;
  clearSeeAs: () => void;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Zwykłe logowanie — tylko e-mail i profil. Bez zakresu kalendarza Google nie
 * pokazuje ekranu zgody ani ostrzeżenia „aplikacja niezweryfikowana”, a sesja
 * Firebase zostaje w przeglądarce (IndexedDB) — kolejne wejście bez logowania.
 */
function googleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

/** Tylko przycisk „Synchronizuj kalendarz” bez OAuth na serwerze (token 1 h) */
function calendarProvider() {
  const provider = new GoogleAuthProvider();
  provider.addScope(GOOGLE_CALENDAR_SCOPE);
  return provider;
}

/** Automatyczne łączenie kalendarza raz na urządzenie, nie przy każdym wejściu */
const CALENDAR_AUTO_CONNECT_KEY = "calendarOAuthAttempted";

function readAutoConnectAttempt(): string | null {
  try {
    return localStorage.getItem(CALENDAR_AUTO_CONNECT_KEY);
  } catch {
    return null;
  }
}

function writeAutoConnectAttempt(value: string | null) {
  try {
    if (value) localStorage.setItem(CALENDAR_AUTO_CONNECT_KEY, value);
    else localStorage.removeItem(CALENDAR_AUTO_CONNECT_KEY);
  } catch {
    // prywatne okno — najwyżej jedna próba na sesję
  }
}

const EMAIL_FOR_LINK_KEY = "emailForSignIn";

function readEmailForLink(): string | null {
  try {
    return localStorage.getItem(EMAIL_FOR_LINK_KEY);
  } catch {
    return null;
  }
}

function writeEmailForLink(email: string | null) {
  try {
    if (email) localStorage.setItem(EMAIL_FOR_LINK_KEY, email);
    else localStorage.removeItem(EMAIL_FOR_LINK_KEY);
  } catch {
    // prywatne okno — przy otwarciu linku zapytamy o adres
  }
}

/**
 * Kończy logowanie linkiem. Urządzenie bez konta (anonimowe) dostaje konto
 * pod tym samym uid — mieszkania, do których dołączyło, zostają.
 */
async function finishEmailLinkSignIn(auth: Auth, email: string, href: string) {
  await auth.authStateReady();
  const current = auth.currentUser;
  if (current?.isAnonymous) {
    try {
      await linkWithCredential(
        current,
        EmailAuthProvider.credentialWithLink(email, href),
      );
      await current.getIdToken(true);
    } catch (err) {
      const code = authErrorCode(err);
      if (
        code !== "auth/credential-already-in-use" &&
        code !== "auth/email-already-in-use" &&
        code !== "auth/provider-already-linked"
      ) {
        throw err;
      }
      // Konto z tym adresem już istnieje — po prostu się na nie loguj
      await signInWithEmailLink(auth, email, href);
    }
  } else {
    await signInWithEmailLink(auth, email, href);
  }
  writeEmailForLink(null);
  window.history.replaceState(null, "", window.location.pathname);
}

function authErrorCode(err: unknown): string {
  return err && typeof err === "object" && "code" in err
    ? String((err as { code: string }).code)
    : "";
}

function authErrorMessage(err: unknown): string {
  const code = authErrorCode(err);

  switch (code) {
    case "auth/unauthorized-domain":
      return "Domena nieautoryzowana — dodaj ją w Firebase Console → Authentication → Authorized domains.";
    case "auth/operation-not-allowed":
      return "Logowanie Google wyłączone w Firebase Console → Authentication → Sign-in method.";
    case "auth/invalid-action-code":
    case "auth/expired-action-code":
      return "Ten link logowania już wygasł albo był użyty — poproś o nowy.";
    case "auth/invalid-email":
      return "To nie wygląda na adres e-mail.";
    case "auth/network-request-failed":
      return "Brak połączenia z Firebase. Sprawdź internet i spróbuj ponownie.";
    default:
      return err instanceof Error ? err.message : "Logowanie nie powiodło się";
  }
}

async function loadAndSyncUserProfile(user: User): Promise<string | null> {
  if (user.isAnonymous) return readStoredMemberId();

  const fromEmail = guessMemberId(user);
  const fromStorage = readStoredMemberId();

  const db = getFirestoreDb();
  if (!db) return fromEmail ?? fromStorage;

  try {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    const existingMemberId =
      typeof snap.data()?.memberId === "string" ? snap.data()!.memberId : null;
    const memberId = fromEmail ?? existingMemberId ?? fromStorage;
    const profile = {
      uid: user.uid,
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      photoURL: user.photoURL ?? null,
      ...(memberId ? { memberId } : {}),
    };

    // Każde wczytanie strony to był zapis — teraz tylko przy zmianie
    // albo raz na PROFILE_REFRESH_MS (lastLoginAt).
    if (!isProfileFresh(snap.data(), profile, Date.now())) {
      guardWriteBudget();
      await setDoc(
        ref,
        { ...profile, lastLoginAt: serverTimestamp() },
        { merge: true },
      );
    }

    if (memberId) writeStoredMemberId(memberId);
    return memberId;
  } catch (err) {
    console.error("Firestore profile sync failed:", err);
    const memberId = fromEmail ?? fromStorage;
    if (memberId) writeStoredMemberId(memberId);
    return memberId;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured();
  const saveCalendarConnection = useServerFn(connectCalendarFromFirebase);
  const loadCalendarStatus = useServerFn(getCalendarConnectionStatus);
  const pendingAccessTokenRef = useRef<string | null>(null);
  const saveCalendarConnectionRef = useRef(saveCalendarConnection);
  const loadCalendarStatusRef = useRef(loadCalendarStatus);

  saveCalendarConnectionRef.current = saveCalendarConnection;
  loadCalendarStatusRef.current = loadCalendarStatus;

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const user = firebaseUser?.isAnonymous ? null : firebaseUser;
  const syncUser = firebaseUser;
  const [memberId, setMemberId] = useState<string | null>(() =>
    readStoredMemberId(),
  );
  const [seeAsMemberId, setSeeAsMemberIdState] = useState<string | null>(() =>
    readSeeAsMemberId(),
  );
  const [loading, setLoading] = useState(configured);
  const [syncingCalendar, setSyncingCalendar] = useState(false);
  const [calendarSyncTick, setCalendarSyncTick] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [emailLinkPending, setEmailLinkPending] = useState(false);
  // linkWithCredential zmienia ten sam obiekt User — wymuś przerysowanie
  const [, setUserTick] = useState(0);

  const connectCalendarIfPending = useCallback(
    async (linkedMemberId: string | null) => {
      const accessToken = pendingAccessTokenRef.current;
      const pendingMemberId = sessionStorage.getItem(
        "pendingCalendarSyncMemberId",
      );
      const targetMemberId = pendingMemberId ?? linkedMemberId;

      if (!accessToken || !targetMemberId) return false;

      setSyncingCalendar(true);
      try {
        await saveCalendarConnectionRef.current({
          data: {
            memberId: targetMemberId,
            accessToken,
            expiresIn: 3600,
            idToken: await currentIdToken(),
          },
        });
        pendingAccessTokenRef.current = null;
        sessionStorage.removeItem("pendingCalendarSyncMemberId");
        setCalendarSyncTick((tick) => tick + 1);
        return true;
      } catch (err) {
        console.error("Calendar sync failed:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Nie udało się połączyć kalendarza. Włącz Google Calendar API w Google Cloud (projekt harmony-home-95c3b).",
        );
        return false;
      } finally {
        setSyncingCalendar(false);
      }
    },
    [],
  );

  const ensurePersistentCalendar = useCallback(
    async (linkedMemberId: string | null) => {
      if (!linkedMemberId) return;

      const status = await loadCalendarStatusRef.current({
        data: { idToken: await currentIdToken() },
      });
      const mine = status.members.find(
        (member) => member.memberId === linkedMemberId,
      );
      if (mine?.connected) return;

      // Bez trwałego zapisu na serwerze łączenie nic nie da — nie wysyłaj
      // nikogo do ekranu zgody Google przy każdym logowaniu
      if (status.oauthServerConfigured && status.persistentStore) {
        if (readAutoConnectAttempt() === linkedMemberId) return;
        writeAutoConnectAttempt(linkedMemberId);
        sessionStorage.setItem("authReturnTo", window.location.pathname);
        window.location.assign(
          `/api/auth/google?memberId=${encodeURIComponent(linkedMemberId)}`,
        );
      }
    },
    [],
  );

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let unsubscribe = () => {};

    void (async () => {
      try {
        const result = await waitForRedirectResult(auth);
        if (result && sessionStorage.getItem("pendingCalendarSyncMemberId")) {
          const credential = GoogleAuthProvider.credentialFromResult(result);
          pendingAccessTokenRef.current = credential?.accessToken ?? null;
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Firebase redirect sign-in failed:", err);
          setError(authErrorMessage(err));
        }
      }

      if (cancelled) return;

      const href = window.location.href;
      if (isSignInWithEmailLink(auth, href)) {
        const email = readEmailForLink();
        if (email) {
          try {
            await finishEmailLinkSignIn(auth, email, href);
            setUserTick((tick) => tick + 1);
          } catch (err) {
            console.error("Email link sign-in failed:", err);
            if (!cancelled) setError(authErrorMessage(err));
          }
        } else if (!cancelled) {
          setEmailLinkPending(true);
        }
      }

      if (cancelled) return;

      unsubscribe = onAuthStateChanged(auth, (nextUser) => {
        if (cancelled) return;

        if (!nextUser) {
          setFirebaseUser(null);
          setLoading(true);
          void signInAnonymously(auth)
            .catch((err) => {
              if (!cancelled) {
                console.error("Anonymous auth failed:", err);
                setError(
                  "Brak sesji Firebase — włącz Anonymous w Firebase Console → Authentication → Sign-in method.",
                );
              }
            })
            .finally(() => {
              if (!cancelled) setLoading(false);
            });
          return;
        }

        setFirebaseUser(nextUser);

        if (nextUser.isAnonymous) {
          setMemberId(readStoredMemberId());
          setLoading(false);
          return;
        }

        void loadAndSyncUserProfile(nextUser)
          .then(async (linkedMemberId) => {
            if (cancelled) return;
            clearSeeAsMemberId();
            setSeeAsMemberIdState(null);
            setMemberId(linkedMemberId);
            const synced = await connectCalendarIfPending(linkedMemberId);
            if (!synced) {
              await ensurePersistentCalendar(linkedMemberId);
            }
          })
          .finally(() => {
            if (!cancelled) setLoading(false);
          });
      });
    })();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [configured, connectCalendarIfPending, ensurePersistentCalendar]);

  /**
   * Popup zamiast samego redirectu: aplikacja działa na innej domenie niż
   * authDomain (localhost, vercel.app), a przeglądarki blokujące storage
   * stron trzecich gubią wtedy wynik redirectu — getRedirectResult zwraca
   * null i po powrocie z Google nikt nie jest zalogowany.
   */
  const startGoogleSignIn = useCallback(
    async (auth: Auth, provider: GoogleAuthProvider = googleProvider()) => {
      try {
        const result = await signInWithPopup(auth, provider);
        const linkedMemberId = await loadAndSyncUserProfile(result.user);
        // Token z dostępem do kalendarza tylko z „Synchronizuj kalendarz”
        if (sessionStorage.getItem("pendingCalendarSyncMemberId")) {
          const credential = GoogleAuthProvider.credentialFromResult(result);
          pendingAccessTokenRef.current = credential?.accessToken ?? null;
          await connectCalendarIfPending(linkedMemberId);
        }
      } catch (err) {
        const code = authErrorCode(err);
        if (
          code === "auth/popup-blocked" ||
          code === "auth/operation-not-supported-in-environment"
        ) {
          await signInWithRedirect(auth, provider);
          return;
        }
        if (
          code === "auth/popup-closed-by-user" ||
          code === "auth/cancelled-popup-request"
        ) {
          sessionStorage.removeItem("pendingCalendarSyncMemberId");
          return;
        }
        throw err;
      }
    },
    [connectCalendarIfPending],
  );

  const signInWithGoogle = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setError(
        "Firebase nie skonfigurowany — uzupełnij VITE_FIREBASE_* w .env",
      );
      return;
    }

    setError(null);
    try {
      sessionStorage.setItem("authReturnTo", window.location.pathname);
      await startGoogleSignIn(auth);
    } catch (err) {
      setError(authErrorMessage(err));
    }
  }, [startGoogleSignIn]);

  const sendEmailLink = useCallback(async (email: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase nie skonfigurowany.");
    const trimmed = email.trim();
    try {
      await sendSignInLinkToEmail(auth, trimmed, {
        url: `${window.location.origin}/?emailLink=1`,
        handleCodeInApp: true,
      });
      writeEmailForLink(trimmed);
    } catch (err) {
      if (authErrorCode(err) === "auth/operation-not-allowed") {
        throw new Error(
          "Logowanie linkiem jest jeszcze wyłączone — administrator włączy je w Firebase (Authentication → E-mail/hasło → link e-mail).",
        );
      }
      throw new Error(authErrorMessage(err));
    }
  }, []);

  const completeEmailLink = useCallback(async (email: string) => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    try {
      await finishEmailLinkSignIn(auth, email.trim(), window.location.href);
      setEmailLinkPending(false);
      setUserTick((tick) => tick + 1);
    } catch (err) {
      throw new Error(authErrorMessage(err));
    }
  }, []);

  const connectPersistentCalendar = useCallback(() => {
    if (!memberId) {
      setError("Wybierz profil domownika przed synchronizacją kalendarza.");
      return;
    }
    writeAutoConnectAttempt(null);
    sessionStorage.setItem("authReturnTo", window.location.pathname);
    window.location.assign(
      `/api/auth/google?memberId=${encodeURIComponent(memberId)}`,
    );
  }, [memberId]);

  const syncCalendar = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setError("Firebase nie skonfigurowany.");
      return;
    }
    if (!memberId) {
      setError("Wybierz profil domownika przed synchronizacją kalendarza.");
      return;
    }

    setError(null);
    try {
      const status = await loadCalendarStatusRef.current({
        data: { idToken: await currentIdToken() },
      });
      if (status.oauthServerConfigured) {
        connectPersistentCalendar();
        return;
      }

      sessionStorage.setItem("pendingCalendarSyncMemberId", memberId);
      sessionStorage.setItem("authReturnTo", window.location.pathname);
      await startGoogleSignIn(auth, calendarProvider());
    } catch (err) {
      setError(authErrorMessage(err));
    }
  }, [memberId, connectPersistentCalendar, startGoogleSignIn]);

  const signOut = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    setError(null);
    // Prywatne wydarzenia nie zostają na (być może wspólnym) urządzeniu
    clearCachedFeeds();
    await firebaseSignOut(auth);
  }, []);

  const linkMember = useCallback(async (nextMemberId: string) => {
    const auth = getFirebaseAuth();
    const currentUser = auth?.currentUser;
    const db = getFirestoreDb();
    writeStoredMemberId(nextMemberId);
    setMemberId(nextMemberId);

    if (!currentUser || !db) return;

    try {
      guardWriteBudget();
      await setDoc(
        doc(db, "users", currentUser.uid),
        { memberId: nextMemberId },
        { merge: true },
      );
    } catch (err) {
      console.error("Firestore member link failed:", err);
    }
  }, []);

  const setSeeAsMember = useCallback((nextMemberId: string) => {
    writeSeeAsMemberId(nextMemberId);
    setSeeAsMemberIdState(nextMemberId);
  }, []);

  const clearSeeAs = useCallback(() => {
    clearSeeAsMemberId();
    setSeeAsMemberIdState(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({
      user,
      syncUser,
      memberId,
      seeAsMemberId,
      loading,
      syncingCalendar,
      calendarSyncTick,
      error,
      configured,
      signInWithGoogle,
      sendEmailLink,
      emailLinkPending,
      completeEmailLink,
      syncCalendar,
      connectPersistentCalendar,
      signOut,
      linkMember,
      setSeeAsMember,
      clearSeeAs,
      clearError,
    }),
    [
      user,
      syncUser,
      memberId,
      seeAsMemberId,
      loading,
      syncingCalendar,
      calendarSyncTick,
      error,
      configured,
      signInWithGoogle,
      sendEmailLink,
      emailLinkPending,
      completeEmailLink,
      syncCalendar,
      connectPersistentCalendar,
      signOut,
      linkMember,
      setSeeAsMember,
      clearSeeAs,
      clearError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
