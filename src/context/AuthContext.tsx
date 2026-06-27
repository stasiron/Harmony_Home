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
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  connectCalendarFromFirebase,
  getCalendarConnectionStatus,
} from "@/lib/calendar/api";
import { guessMemberId } from "@/lib/memberLink";
import {
  clearStoredMemberId,
  readStoredMemberId,
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
  memberId: string | null;
  loading: boolean;
  syncingCalendar: boolean;
  calendarSyncTick: number;
  error: string | null;
  configured: boolean;
  signInWithGoogle: () => Promise<void>;
  syncCalendar: () => Promise<void>;
  connectPersistentCalendar: () => void;
  signOut: () => Promise<void>;
  linkMember: (memberId: string) => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function googleProvider() {
  const provider = new GoogleAuthProvider();
  provider.addScope(GOOGLE_CALENDAR_SCOPE);
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

function authErrorMessage(err: unknown): string {
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code: string }).code)
      : "";

  switch (code) {
    case "auth/unauthorized-domain":
      return "Domena nieautoryzowana — dodaj ją w Firebase Console → Authentication → Authorized domains.";
    case "auth/operation-not-allowed":
      return "Logowanie Google wyłączone w Firebase Console → Authentication → Sign-in method.";
    case "auth/network-request-failed":
      return "Brak połączenia z Firebase. Sprawdź internet i spróbuj ponownie.";
    default:
      return err instanceof Error ? err.message : "Logowanie nie powiodło się";
  }
}

async function loadAndSyncUserProfile(user: User): Promise<string | null> {
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

    await setDoc(
      ref,
      {
        uid: user.uid,
        email: user.email ?? null,
        displayName: user.displayName ?? null,
        photoURL: user.photoURL ?? null,
        lastLoginAt: serverTimestamp(),
        ...(memberId ? { memberId } : {}),
      },
      { merge: true },
    );

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

  const [user, setUser] = useState<User | null>(null);
  const [memberId, setMemberId] = useState<string | null>(() =>
    readStoredMemberId(),
  );
  const [loading, setLoading] = useState(configured);
  const [syncingCalendar, setSyncingCalendar] = useState(false);
  const [calendarSyncTick, setCalendarSyncTick] = useState(0);
  const [error, setError] = useState<string | null>(null);

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

      const status = await loadCalendarStatusRef.current();
      const mine = status.members.find(
        (member) => member.memberId === linkedMemberId,
      );
      if (mine?.connected) {
        sessionStorage.removeItem("calendarOAuthAttempted");
        return;
      }

      if (status.oauthServerConfigured) {
        const attempted = sessionStorage.getItem("calendarOAuthAttempted");
        if (attempted === linkedMemberId) return;
        sessionStorage.setItem("calendarOAuthAttempted", linkedMemberId);
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
        if (result) {
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

      unsubscribe = onAuthStateChanged(auth, (nextUser) => {
        if (cancelled) return;

        setUser(nextUser);

        if (!nextUser) {
          setMemberId(null);
          clearStoredMemberId();
          setLoading(false);
          return;
        }

        void loadAndSyncUserProfile(nextUser)
          .then(async (linkedMemberId) => {
            if (cancelled) return;
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
      await signInWithRedirect(auth, googleProvider());
    } catch (err) {
      setError(authErrorMessage(err));
    }
  }, []);

  const connectPersistentCalendar = useCallback(() => {
    if (!memberId) {
      setError("Wybierz profil domownika przed synchronizacją kalendarza.");
      return;
    }
    sessionStorage.removeItem("calendarOAuthAttempted");
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
      const status = await loadCalendarStatusRef.current();
      if (status.oauthServerConfigured) {
        connectPersistentCalendar();
        return;
      }

      sessionStorage.setItem("pendingCalendarSyncMemberId", memberId);
      sessionStorage.setItem("authReturnTo", window.location.pathname);
      await signInWithRedirect(auth, googleProvider());
    } catch (err) {
      setError(authErrorMessage(err));
    }
  }, [memberId, connectPersistentCalendar]);

  const signOut = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    setError(null);
    sessionStorage.removeItem("calendarOAuthAttempted");
    clearStoredMemberId();
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
      await setDoc(
        doc(db, "users", currentUser.uid),
        { memberId: nextMemberId },
        { merge: true },
      );
    } catch (err) {
      console.error("Firestore member link failed:", err);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({
      user,
      memberId,
      loading,
      syncingCalendar,
      calendarSyncTick,
      error,
      configured,
      signInWithGoogle,
      syncCalendar,
      connectPersistentCalendar,
      signOut,
      linkMember,
      clearError,
    }),
    [
      user,
      memberId,
      loading,
      syncingCalendar,
      calendarSyncTick,
      error,
      configured,
      signInWithGoogle,
      syncCalendar,
      connectPersistentCalendar,
      signOut,
      linkMember,
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
