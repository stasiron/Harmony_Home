import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  connectAuthEmulator,
  getAuth,
  getRedirectResult,
  initializeAuth,
  indexedDBLocalPersistence,
  type Auth,
  type UserCredential,
} from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

/** Web app harmony-home-95c3b — Firebase Console → Project settings → Your apps */
export const firebaseConfig = {
  apiKey: "AIzaSyDx6h_kp8gWfY3CSHbWYuO75X94m0c7GH8",
  authDomain: "harmony-home-95c3b.firebaseapp.com",
  projectId: "harmony-home-95c3b",
  storageBucket: "harmony-home-95c3b.firebasestorage.app",
  messagingSenderId: "519262340053",
  appId: "1:519262340053:web:899694e8cc03b85243335c",
} as const;

export const firebaseProjectId = firebaseConfig.projectId;

export function getFirebaseConfig() {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? firebaseConfig.apiKey,
    authDomain:
      import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? firebaseConfig.authDomain,
    projectId:
      import.meta.env.VITE_FIREBASE_PROJECT_ID ?? firebaseConfig.projectId,
    storageBucket:
      import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ??
      firebaseConfig.storageBucket,
    messagingSenderId:
      import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ??
      firebaseConfig.messagingSenderId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID ?? firebaseConfig.appId,
  };
}

/**
 * `VITE_FIREBASE_EMULATOR=1 npm run dev` + `npm run emulators` — lokalna baza
 * zamiast produkcyjnej (testy w przeglądarce nie ruszają danych domu).
 */
export const firebaseEmulatorEnabled =
  import.meta.env.VITE_FIREBASE_EMULATOR === "1";

export function isFirebaseConfigured(): boolean {
  const { apiKey, appId } = getFirebaseConfig();
  return Boolean(apiKey && appId);
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let redirectResultPromise: Promise<UserCredential | null> | null = null;

function createAuth(firebaseApp: FirebaseApp): Auth {
  try {
    return initializeAuth(firebaseApp, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence],
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code: string }).code)
        : "";
    if (code === "auth/already-initialized") {
      return getAuth(firebaseApp);
    }
    throw err;
  }
}

function createFirestore(firebaseApp: FirebaseApp): Firestore {
  try {
    return initializeFirestore(firebaseApp, {
      // Cache w IndexedDB zamiast localStorage — działa offline i per mieszkanie.
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
      ignoreUndefinedProperties: true,
    });
  } catch {
    // HMR: Firestore już zainicjalizowany dla tej aplikacji
    return getFirestore(firebaseApp);
  }
}

function ensureFirebase(): boolean {
  if (typeof window === "undefined" || !isFirebaseConfigured()) return false;
  if (!app) {
    app = getApps().length ? getApps()[0]! : initializeApp(getFirebaseConfig());
    auth = createAuth(app);
    db = createFirestore(app);
    if (firebaseEmulatorEnabled) {
      connectAuthEmulator(auth, "http://127.0.0.1:9099", {
        disableWarnings: true,
      });
      connectFirestoreEmulator(db, "127.0.0.1", 8080);
    }
  }
  return true;
}

export function getFirebaseAuth(): Auth | null {
  return ensureFirebase() ? auth : null;
}

export function getFirestoreDb(): Firestore | null {
  ensureFirebase();
  return db;
}

/** Must run once per page load before relying on redirect sign-in state. */
export function waitForRedirectResult(
  authInstance: Auth,
): Promise<UserCredential | null> {
  if (!redirectResultPromise) {
    redirectResultPromise = getRedirectResult(authInstance);
  }
  return redirectResultPromise;
}
