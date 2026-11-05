import { getFirebaseAuth } from "@/lib/firebase";

/** ID token bieżącej sesji — serwer sprawdza nim, kto pyta (kalendarz) */
export async function currentIdToken(): Promise<string | null> {
  try {
    return (await getFirebaseAuth()?.currentUser?.getIdToken()) ?? null;
  } catch {
    return null;
  }
}
