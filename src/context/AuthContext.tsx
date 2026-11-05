import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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
import { guardWriteBudget } from "@/lib/householdSync";
import { isProfileFresh } from "@/lib/profileSync";
import { clearCachedFeeds } from "@/lib/calendar/feedCache";
import {
  clearSeeAsMemberId,
  readSeeAsMemberId,
  writeSeeAsMemberId,
} from "@/lib/memberStorage";
import {
  getFirebaseAuth,
  getFirestoreDb,
  isFirebaseConfigured,
  waitForRedirectResult,
} from "@/lib/firebase";

/**
 * Sesja i logowanie. „Kim jestem w mieszkaniu” to profil z HouseholdContext
 * (myProfileId), a kalendarz należy do konta (Ustawienia → Mój kalendarz).
 */
type AuthContextValue = {
  user: User | null;
  /** Każda sesja Firebase (Google lub anonimowa) — sync obowiązków w Firestore. */
  syncUser: User | null;
  /** Podgląd home jako domownik bez logowania Google. */
  seeAsMemberId: string | null;
  loading: boolean;
  error: string | null;
  configured: boolean;
  signInWithGoogle: () => Promise<void>;
  /** Logowanie linkiem na e-mail — bez ekranów Google, bez kalendarza */
  sendEmailLink: (email: string) => Promise<void>;
  /** Otwarto link z maila na innym urządzeniu — trzeba podać adres */
  emailLinkPending: boolean;
  completeEmailLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
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

/** users/{uid} — e-mail i imię konta; zapis tylko przy zmianie / raz na 12 h */
async function syncUserProfile(user: User): Promise<void> {
  if (user.isAnonymous) return;
  const db = getFirestoreDb();
  if (!db) return;
  try {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    const profile = {
      uid: user.uid,
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      photoURL: user.photoURL ?? null,
    };
    if (!isProfileFresh(snap.data(), profile, Date.now())) {
      guardWriteBudget();
      await setDoc(
        ref,
        { ...profile, lastLoginAt: serverTimestamp() },
        { merge: true },
      );
    }
  } catch (err) {
    console.error("Firestore profile sync failed:", err);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured();

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const user = firebaseUser?.isAnonymous ? null : firebaseUser;
  const syncUser = firebaseUser;
  const [seeAsMemberId, setSeeAsMemberIdState] = useState<string | null>(() =>
    readSeeAsMemberId(),
  );
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState<string | null>(null);
  const [emailLinkPending, setEmailLinkPending] = useState(false);
  // linkWithCredential zmienia ten sam obiekt User — wymuś przerysowanie
  const [, setUserTick] = useState(0);

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
        await waitForRedirectResult(auth);
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
        setLoading(false);
        if (!nextUser.isAnonymous) {
          clearSeeAsMemberId();
          setSeeAsMemberIdState(null);
          void syncUserProfile(nextUser);
        }
      });
    })();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [configured]);

  /**
   * Popup zamiast samego redirectu: aplikacja działa na innej domenie niż
   * authDomain (localhost, vercel.app), a przeglądarki blokujące storage
   * stron trzecich gubią wtedy wynik redirectu — getRedirectResult zwraca
   * null i po powrocie z Google nikt nie jest zalogowany.
   */
  const signInWithGoogle = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setError(
        "Firebase nie skonfigurowany — uzupełnij VITE_FIREBASE_* w .env",
      );
      return;
    }

    setError(null);
    const provider = googleProvider();
    try {
      await signInWithPopup(auth, provider);
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
        return;
      }
      setError(authErrorMessage(err));
    }
  }, []);

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

  const signOut = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    setError(null);
    // Prywatne wydarzenia nie zostają na (być może wspólnym) urządzeniu
    clearCachedFeeds();
    await firebaseSignOut(auth);
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
      seeAsMemberId,
      loading,
      error,
      configured,
      signInWithGoogle,
      sendEmailLink,
      emailLinkPending,
      completeEmailLink,
      signOut,
      setSeeAsMember,
      clearSeeAs,
      clearError,
    }),
    [
      user,
      syncUser,
      seeAsMemberId,
      loading,
      error,
      configured,
      signInWithGoogle,
      sendEmailLink,
      emailLinkPending,
      completeEmailLink,
      signOut,
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
