import {
  deleteUser,
  GoogleAuthProvider,
  reauthenticateWithPopup,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import { commitWrites, type PlannedWrite } from "@/lib/householdSync";
import { deleteHousehold, removeMember } from "@/lib/householdSetup";
import { disconnectMemberGoogle } from "@/lib/calendar/api";

/** Prywatne listy w mieszkaniu (firestore.rules → private/{ownerUid}) */
const PRIVATE_COLLECTIONS = [
  "chores",
  "zadania",
  "todos",
  "shopping",
  "fridge",
  "guides",
  "guideEntries",
  "products",
  "laundry",
  "recipePlans",
];

/** Firebase usuwa konto tylko po świeżym logowaniu (ok. 5 minut) */
const RECENT_LOGIN_MS = 4 * 60 * 1000;

export class AccountDeletionBlockedError extends Error {
  constructor(public readonly households: string[]) {
    super(
      `Najpierw przekaż albo usuń mieszkania, które założyłeś(-aś) i w których mieszkają inni: ${households.join(", ")}.`,
    );
    this.name = "AccountDeletionBlockedError";
  }
}

async function ensureRecentLogin(user: FirebaseUser) {
  const last = Date.parse(user.metadata.lastSignInTime ?? "");
  if (Number.isFinite(last) && Date.now() - last < RECENT_LOGIN_MS) return;
  if (user.providerData.some((p) => p.providerId === "google.com")) {
    await reauthenticateWithPopup(user, new GoogleAuthProvider());
    return;
  }
  throw new Error(
    "Ze względów bezpieczeństwa wyloguj się, zaloguj ponownie i od razu usuń konto.",
  );
}

/**
 * Usuwa konto i dane osoby (RODO): prywatne listy i przepisy w każdym
 * mieszkaniu, członkostwa, powiadomienia, kalendarz, dokument konta, a na
 * końcu samo konto Firebase. Mieszkania, które osoba założyła sama, znikają
 * w całości; założone z innymi — blokują usunięcie (najpierw przekazanie).
 * Wspólne wpisy (obowiązki, rachunki…) zostają w mieszkaniu — należą do
 * wszystkich domowników.
 */
export async function deleteAccount(user: FirebaseUser): Promise<void> {
  if (user.isAnonymous) throw new Error("To urządzenie nie ma konta.");
  const db = getFirestoreDb();
  if (!db) throw new Error("Firestore niedostępny");
  const uid = user.uid;

  const memberships = await getDocs(
    collection(db, "users", uid, "memberships"),
  );
  const owned: { id: string; name: string; alone: boolean }[] = [];
  const joined: string[] = [];
  for (const m of memberships.docs) {
    const meta = await getDoc(doc(db, "households", m.id)).catch(() => null);
    if (!meta?.exists()) continue;
    if (meta.data().ownerId === uid) {
      const members = await getDocs(
        collection(db, "households", m.id, "members"),
      );
      owned.push({
        id: m.id,
        name: String(meta.data().name ?? m.id),
        alone: members.docs.every((d) => d.id === uid),
      });
    } else {
      joined.push(m.id);
    }
  }
  const blocked = owned.filter((h) => !h.alone).map((h) => h.name);
  if (blocked.length > 0) throw new AccountDeletionBlockedError(blocked);

  await ensureRecentLogin(user);

  for (const h of owned) await deleteHousehold(h.id, uid, null);

  for (const hid of joined) {
    const writes: PlannedWrite[] = [];
    for (const name of PRIVATE_COLLECTIONS) {
      const snap = await getDocs(
        collection(db, "households", hid, "private", uid, name),
      ).catch(() => null);
      for (const d of snap?.docs ?? []) {
        writes.push({
          kind: "delete",
          path: ["households", hid, "private", uid, name, d.id],
        });
      }
    }
    const recipes = await getDocs(
      query(
        collection(db, "households", hid, "recipes"),
        where("createdBy", "==", uid),
      ),
    ).catch(() => null);
    for (const d of recipes?.docs ?? []) {
      writes.push({
        kind: "delete",
        path: ["households", hid, "recipes", d.id],
      });
    }
    await commitWrites(db, writes);
    await removeMember(hid, uid).catch(() => undefined);
  }

  // Kalendarz Google zapisany na serwerze
  try {
    await disconnectMemberGoogle({
      data: { idToken: await user.getIdToken() },
    });
  } catch {
    // brak połączenia albo serwer bez kalendarzy — nic do usunięcia
  }

  const own: PlannedWrite[] = [];
  for (const name of ["memberships", "pushSubscriptions", "private"]) {
    const snap = await getDocs(collection(db, "users", uid, name)).catch(
      () => null,
    );
    for (const d of snap?.docs ?? []) {
      own.push({ kind: "delete", path: ["users", uid, name, d.id] });
    }
  }
  await commitWrites(db, own);
  await deleteDoc(doc(db, "users", uid));
  await deleteUser(user);
}
