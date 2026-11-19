import type { User as FirebaseUser } from "firebase/auth";
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { buildPresetItems } from "@/config/presets";
import { loadHomeZones } from "@/config/homeZones";
import { getFirestoreDb } from "@/lib/firebase";
import {
  commitWrites,
  guardWriteBudget,
  diffCollection,
  itemWrites,
  ITEM_COLLECTIONS,
  type ItemCollection,
  type PlannedWrite,
} from "@/lib/householdSync";
import {
  buildLegacyMigration,
  LEGACY_HOUSEHOLD_ID,
} from "@/lib/legacyHousehold";
import { guessMemberId } from "@/lib/memberLink";
import { resolveChoreWeights } from "@/config/choreWeight";
import type {
  BillSettings,
  ChoreWeightSettings,
  FloorPlanRef,
  HomeZone,
  HouseholdMember,
  HouseholdMeta,
  HouseholdPresetId,
  HouseholdRole,
  ItemMeta,
  Membership,
  PanicState,
  ReminderSettings,
  SharedCalendarSettings,
  StatsVisibility,
  User,
  WeatherLocation,
} from "@/types";

const USER_COLORS = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"];

/** Bez 0/O, 1/I/L — kod łatwo przepisać z ekranu tabletu */
const INVITE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function generateInviteCode(length = 8): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(
    bytes,
    (b) => INVITE_ALPHABET[b % INVITE_ALPHABET.length],
  ).join("");
}

export function normalizeInviteCode(code: string): string {
  return code.toUpperCase().replace(/[^0-9A-Z]/g, "");
}

function requireDb() {
  const db = getFirestoreDb();
  if (!db) throw new Error("Firestore niedostępny");
  return db;
}

/** Jak zalogowane jest to konto — tak samo jak sign_in_provider w tokenie */
export function providerOf(user: FirebaseUser): string | null {
  if (user.isAnonymous) return "anonymous";
  return user.providerData[0]?.providerId ?? null;
}

/**
 * Provider z tokenu (sign_in_provider) — przy kilku połączonych kontach
 * `providerData[0]` bywa innym niż to, którym się zalogowano, a reguła
 * members porównuje z tokenem. Link z maila zapisujemy jako „password”
 * (to samo konto e-mail), żeby nie przepisywać wpisu przy każdym logowaniu.
 */
export async function tokenProviderOf(
  user: FirebaseUser,
): Promise<string | null> {
  if (user.isAnonymous) return "anonymous";
  try {
    const provider = (await user.getIdTokenResult()).signInProvider;
    if (provider === "emailLink") return "password";
    return provider ?? providerOf(user);
  } catch {
    return providerOf(user);
  }
}

/** Dane konta w dokumencie członkostwa — odświeżane, gdy się zmienią */
export function memberAccountFields(
  user: FirebaseUser,
  provider: string | null = providerOf(user),
) {
  return {
    anonymous: user.isAnonymous,
    displayName: user.displayName ?? null,
    email: user.email ?? null,
    provider,
  };
}

function memberFor(
  user: FirebaseUser,
  role: HouseholdRole,
  profileId: string | null,
  now: string,
  inviteCode?: string,
): HouseholdMember {
  return {
    uid: user.uid,
    role,
    profileId,
    ...memberAccountFields(user),
    joinedAt: now,
    ...(inviteCode ? { inviteCode } : {}),
  };
}

function writeMembership(uid: string, membership: Membership) {
  guardWriteBudget();
  const db = requireDb();
  return setDoc(
    doc(db, "users", uid, "memberships", membership.householdId),
    membership,
  );
}

export function buildProfiles(
  names: string[],
  createdBy: string,
  now = new Date(),
): User[] {
  return names
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name, index) => ({
      id: crypto.randomUUID(),
      name,
      avatar: name.charAt(0).toUpperCase(),
      color: USER_COLORS[index % USER_COLORS.length]!,
      active: true,
      heavyDay: false,
      createdBy,
      createdAt: new Date(now.getTime() + index).toISOString(),
    }));
}

export type FloorPlanUpload = {
  dataUrl: string;
  width: number;
  height: number;
};

export type CreateHouseholdInput = {
  name: string;
  presetId: HouseholdPresetId;
  /** Imiona domowników (z kontem lub bez) */
  profileNames: string[];
  /** Który z nich to twórca — null: nikt */
  myProfileIndex: number | null;
  /** Preset z opcjami (studenckie): wybrane obowiązki */
  choreIds?: string[];
  floorPlan: FloorPlanUpload | null;
  weatherLocation?: WeatherLocation | null;
};

function upserts<T extends ItemMeta & { id: string }>(
  householdId: string,
  name: ItemCollection | "profiles",
  items: T[],
) {
  return itemWrites(householdId, name, diffCollection(new Map(), items));
}

export async function createHousehold(
  user: FirebaseUser,
  input: CreateHouseholdInput,
): Promise<string> {
  const db = requireDb();
  const now = new Date();
  const nowIso = now.toISOString();
  const householdId = doc(collection(db, "households")).id;
  const profiles = buildProfiles(input.profileNames, user.uid, now);
  const preset = buildPresetItems(input.presetId, user.uid, now, {
    choreIds: input.choreIds,
    profileIds: profiles.map((p) => p.id),
  });
  const myProfile =
    input.myProfileIndex === null ? null : profiles[input.myProfileIndex];

  const floorPlan: FloorPlanRef = input.floorPlan
    ? {
        kind: "upload",
        width: input.floorPlan.width,
        height: input.floorPlan.height,
        updatedAt: nowIso,
      }
    : { kind: "none" };

  const meta: Omit<HouseholdMeta, "id"> = {
    name: input.name.trim(),
    preset: input.presetId,
    ownerId: user.uid,
    createdAt: nowIso,
    zones: preset.zones,
    floorPlan,
    ...(input.weatherLocation
      ? { weatherLocation: input.weatherLocation }
      : {}),
  };

  // Mieszkanie + admin w jednym batchu — reguły sprawdzają ownerId (getAfter)
  const first = writeBatch(db);
  first.set(doc(db, "households", householdId), meta);
  first.set(
    doc(db, "households", householdId, "members", user.uid),
    memberFor(user, "admin", myProfile?.id ?? null, nowIso),
  );
  await first.commit();

  await commitWrites(db, [
    ...upserts(householdId, "profiles", profiles),
    ...upserts(householdId, "chores", preset.chores),
    ...upserts(householdId, "zadania", preset.zadania),
  ]);
  if (input.floorPlan) {
    await setDoc(doc(db, "households", householdId, "assets", "floorPlan"), {
      ...input.floorPlan,
      updatedAt: nowIso,
    });
  }
  await writeMembership(user.uid, {
    householdId,
    name: meta.name,
    role: "admin",
    joinedAt: nowIso,
  });
  // Kod zaproszenia od razu — inaczej admin musi go szukać w Ustawieniach
  await regenerateInvite(householdId, user.uid).catch((err) =>
    console.error("Invite create failed:", err),
  );
  return householdId;
}

/** Konto z e-mailem musi najpierw potwierdzić adres (reguła members) */
export class EmailNotVerifiedError extends Error {
  constructor() {
    super("Potwierdź najpierw swój adres e-mail.");
    this.name = "EmailNotVerifiedError";
  }
}

export async function joinHousehold(
  user: FirebaseUser,
  rawCode: string,
): Promise<string> {
  const db = requireDb();
  const code = normalizeInviteCode(rawCode);
  if (!user.isAnonymous && !user.emailVerified) {
    throw new EmailNotVerifiedError();
  }
  const invite = await getDoc(doc(db, "invites", code));
  const householdId = invite.data()?.householdId;
  if (typeof householdId !== "string") {
    throw new Error("Nie ma takiego kodu zaproszenia.");
  }

  const nowIso = new Date().toISOString();
  const memberRef = doc(db, "households", householdId, "members", user.uid);
  const existing = await getDoc(memberRef).catch(() => null);
  // Konto dołącza jako domownik, urządzenie bez konta jako „urządzenie”
  const joinRole: HouseholdRole = user.isAnonymous ? "device" : "member";
  if (!existing?.exists()) {
    await setDoc(memberRef, memberFor(user, joinRole, null, nowIso, code));
  }
  const meta = await getDoc(doc(db, "households", householdId));
  await writeMembership(user.uid, {
    householdId,
    name: String(meta.data()?.name ?? "Mieszkanie"),
    role: existing?.exists()
      ? ((existing.data().role as HouseholdRole) ?? "member")
      : joinRole,
    joinedAt: nowIso,
  });
  return householdId;
}

/**
 * Kod zaproszenia mieszkania — `households/{id}/admin/invite`, czytają go
 * tylko administratorzy (goście i urządzenia nie dołączą nim ponownie jako
 * domownicy). Listować zaproszeń nie wolno, stąd kopia kodu.
 */
function inviteRef(householdId: string) {
  return doc(requireDb(), "households", householdId, "admin", "invite");
}

export function subscribeInvite(
  householdId: string,
  onData: (code: string | null) => void,
  onError?: (err: Error) => void,
): Unsubscribe | null {
  const db = getFirestoreDb();
  if (!db) return null;
  return onSnapshot(
    doc(db, "households", householdId, "admin", "invite"),
    (snap) => {
      const code = snap.data()?.code;
      onData(typeof code === "string" ? code : null);
    },
    (err) => onError?.(err),
  );
}

/**
 * Starsze mieszkania trzymały kod w dokumencie mieszkania (widzieli go
 * goście) — admin przenosi go raz do admin/invite.
 */
export async function moveLegacyInviteCode(householdId: string, code: string) {
  guardWriteBudget();
  const db = requireDb();
  const batch = writeBatch(db);
  batch.set(inviteRef(householdId), { code });
  batch.update(doc(db, "households", householdId), {
    inviteCode: deleteField(),
  });
  await batch.commit();
}

/** Nowy kod zaproszenia (stary przestaje działać) */
export async function regenerateInvite(
  householdId: string,
  uid: string,
  previousCode?: string | null,
): Promise<string> {
  guardWriteBudget();
  const db = requireDb();
  const code = generateInviteCode();
  await setDoc(doc(db, "invites", code), {
    householdId,
    createdBy: uid,
    createdAt: new Date().toISOString(),
  });
  await setDoc(inviteRef(householdId), { code });
  if (previousCode) {
    await deleteDoc(doc(db, "invites", previousCode)).catch(() => undefined);
  }
  return code;
}

/**
 * Dezaktywuje kod — kto go zna, już nie dołączy. Domownicy, którzy dołączyli
 * wcześniej, zostają. Nowy kod można utworzyć w każdej chwili.
 */
export async function deactivateInvite(householdId: string, code: string) {
  guardWriteBudget();
  const db = requireDb();
  await deleteDoc(doc(db, "invites", code));
  await deleteDoc(inviteRef(householdId));
}

/** Twórca oddaje mieszkanie innemu administratorowi (potem może wyjść) */
export async function transferOwnership(householdId: string, newOwner: string) {
  guardWriteBudget();
  await updateDoc(doc(requireDb(), "households", householdId), {
    ownerId: newOwner,
  });
}

/**
 * Usuwa mieszkanie z całą wspólną zawartością. Robi to twórca: najpierw
 * elementy (jest jeszcze członkiem), na końcu wpisy domowników i dokument
 * mieszkania w jednym batchu. Domownicy tracą dostęp, ich wpis w
 * `memberships` znika przy następnym wczytaniu (permission-denied).
 * Prywatne elementy i przepisy innych osób zostają niedostępne dla nikogo —
 * reguły nie pozwalają ich usunąć nikomu poza autorem.
 */
export async function deleteHousehold(
  householdId: string,
  uid: string,
  inviteCode: string | null,
) {
  const db = requireDb();
  const base = ["households", householdId] as const;
  const writes: PlannedWrite[] = [];
  const addAll = async (name: string, ownOnly = false) => {
    const ref = collection(db, ...base, name);
    // Przepisy innych osób są niewidoczne — zapytanie tylko o własne
    const snap = await getDocs(
      ownOnly ? query(ref, where("createdBy", "==", uid)) : ref,
    ).catch(() => null);
    for (const d of snap?.docs ?? []) {
      writes.push({ kind: "delete", path: [...base, name, d.id] });
    }
  };
  for (const name of [...ITEM_COLLECTIONS, "profiles", "assets"]) {
    await addAll(name);
  }
  await addAll("recipes", true);
  for (const name of [
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
  ]) {
    await addAll(`private/${uid}/${name}`);
  }
  writes.push({ kind: "delete", path: [...base, "admin", "invite"] });
  await commitWrites(db, writes);
  if (inviteCode) {
    await deleteDoc(doc(db, "invites", inviteCode)).catch(() => undefined);
  }

  const members = await getDocs(collection(db, ...base, "members"));
  const final: PlannedWrite[] = members.docs
    .filter((d) => d.id !== uid)
    .map((d) => ({ kind: "delete", path: [...base, "members", d.id] }));
  await commitWrites(db, final);
  guardWriteBudget();
  const batch = writeBatch(db);
  batch.delete(doc(db, ...base, "members", uid));
  batch.delete(doc(db, ...base));
  batch.delete(doc(db, "users", uid, "memberships", householdId));
  await batch.commit();
}

/** Administrator ogólny — admin każdego mieszkania (też w firestore.rules) */
export const SUPER_ADMIN_EMAIL = "stasiron9102@gmail.com";

export function isSuperAdmin(user: FirebaseUser | null): boolean {
  return Boolean(
    user &&
    !user.isAnonymous &&
    user.emailVerified &&
    user.email?.toLowerCase() === SUPER_ADMIN_EMAIL,
  );
}

/**
 * Przepisuje `households/homeharmony` do nowego modelu i robi z właściciela
 * admina. Bezpieczne do powtórzenia: elementy zapisuje tylko raz (`migratedAt`).
 */
export async function migrateLegacyHousehold(
  user: FirebaseUser,
): Promise<string> {
  const db = requireDb();
  const householdId = LEGACY_HOUSEHOLD_ID;
  const ref = doc(db, "households", householdId);
  const snap = await getDoc(ref);
  const data = snap.data();
  const nowIso = new Date().toISOString();
  const name = typeof data?.name === "string" ? data.name : "HomeHarmony";

  // Najpierw członkostwo — kolejne zapisy przechodzą już jako admin
  await setDoc(
    doc(db, "households", householdId, "members", user.uid),
    memberFor(user, "admin", guessMemberId(user), nowIso),
    { merge: true },
  );

  if (!data?.migratedAt) {
    const items = buildLegacyMigration(data, user.uid);
    await commitWrites(db, [
      ...upserts(householdId, "profiles", items.profiles),
      ...upserts(householdId, "chores", items.chores),
      ...upserts(householdId, "zadania", items.zadania),
      ...upserts(householdId, "todos", items.todos),
      ...upserts(householdId, "todoFolders", items.todoFolders),
      ...upserts(householdId, "shopping", items.shopping),
      ...upserts(householdId, "laundry", items.laundry),
      ...upserts(householdId, "guestPlans", items.guestPlans),
    ]);

    const meta: Omit<HouseholdMeta, "id"> & { migratedAt: string } = {
      name,
      preset: null,
      ownerId: user.uid,
      createdAt: nowIso,
      zones: loadHomeZones(),
      floorPlan: { kind: "bundled" },
      features: { legacyCalendar: true },
      migratedAt: nowIso,
    };
    await setDoc(ref, meta, { merge: true });
  }

  await writeMembership(user.uid, {
    householdId,
    name,
    role: "admin",
    joinedAt: nowIso,
  });
  return householdId;
}

export function subscribeMemberships(
  uid: string,
  onData: (memberships: Membership[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe | null {
  const db = getFirestoreDb();
  if (!db) return null;
  return onSnapshot(
    collection(db, "users", uid, "memberships"),
    (snap) =>
      onData(
        snap.docs
          .map((d) => ({ ...(d.data() as Membership), householdId: d.id }))
          .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt)),
      ),
    (err) => onError?.(err),
  );
}

/**
 * Wszystkie mieszkania — tylko dla administratora ogólnego (reguły wpuszczają
 * listę tylko jemu). Mieszkania bez członkostwa mają `superAdmin: true`.
 */
export function subscribeAllHouseholds(
  onData: (households: Membership[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe | null {
  const db = getFirestoreDb();
  if (!db) return null;
  return onSnapshot(
    collection(db, "households"),
    (snap) =>
      onData(
        snap.docs
          // Stary dokument sprzed migracji nie ma ownerId — to nie mieszkanie
          .filter((d) => typeof d.data().ownerId === "string")
          .map((d) => {
            const data = d.data();
            return {
              householdId: d.id,
              name: typeof data.name === "string" ? data.name : d.id,
              role: "admin" as const,
              joinedAt:
                typeof data.createdAt === "string" ? data.createdAt : "",
              superAdmin: true,
            };
          }),
      ),
    (err) => onError?.(err),
  );
}

export async function removeMembership(uid: string, householdId: string) {
  guardWriteBudget();
  await deleteDoc(doc(requireDb(), "users", uid, "memberships", householdId));
}

function isWeatherLocation(value: unknown): value is WeatherLocation {
  const v = value as WeatherLocation | null;
  return Boolean(
    v &&
    typeof v.name === "string" &&
    typeof v.latitude === "number" &&
    typeof v.longitude === "number",
  );
}

export function subscribeHouseholdMeta(
  householdId: string,
  onData: (meta: HouseholdMeta | null) => void,
  onError?: (err: Error) => void,
): Unsubscribe | null {
  const db = getFirestoreDb();
  if (!db) return null;
  return onSnapshot(
    doc(db, "households", householdId),
    (snap) => {
      const data = snap.data();
      if (!data || typeof data.ownerId !== "string") {
        onData(null);
        return;
      }
      onData({
        id: snap.id,
        name: String(data.name ?? "Mieszkanie"),
        preset: (data.preset as HouseholdPresetId | null) ?? null,
        ownerId: data.ownerId,
        createdAt: String(data.createdAt ?? ""),
        zones: Array.isArray(data.zones) ? (data.zones as HomeZone[]) : [],
        floorPlan: (data.floorPlan as FloorPlanRef) ?? { kind: "none" },
        features: data.features as HouseholdMeta["features"],
        ...(data.statsVisibility === "own" || data.statsVisibility === "admins"
          ? { statsVisibility: data.statsVisibility as StatsVisibility }
          : {}),
        ...(isWeatherLocation(data.weatherLocation)
          ? { weatherLocation: data.weatherLocation }
          : {}),
        panic:
          data.panic && typeof data.panic === "object"
            ? (data.panic as PanicState)
            : null,
        ...(data.choreWeights && typeof data.choreWeights === "object"
          ? {
              choreWeights: resolveChoreWeights(
                data.choreWeights as Partial<ChoreWeightSettings>,
              ),
            }
          : {}),
        sharedCalendar:
          data.sharedCalendar &&
          typeof (data.sharedCalendar as SharedCalendarSettings).icalUrl ===
            "string"
            ? (data.sharedCalendar as SharedCalendarSettings)
            : null,
        ...(typeof data.inviteCode === "string"
          ? { inviteCode: data.inviteCode }
          : {}),
        // Kształt sprawdza resolveBillSettings przy użyciu
        ...(data.billSettings &&
        typeof data.billSettings === "object" &&
        Array.isArray((data.billSettings as BillSettings).types)
          ? { billSettings: data.billSettings as BillSettings }
          : {}),
        ...(data.reminders && typeof data.reminders === "object"
          ? { reminders: data.reminders as ReminderSettings }
          : {}),
        landlord:
          data.landlord && typeof data.landlord === "object"
            ? {
                name: String(data.landlord.name ?? ""),
                phone: String(data.landlord.phone ?? ""),
                email: String(data.landlord.email ?? ""),
                notes: String(data.landlord.notes ?? ""),
              }
            : null,
        cover:
          data.cover && typeof data.cover.updatedAt === "string"
            ? { updatedAt: data.cover.updatedAt }
            : null,
      });
    },
    (err) => onError?.(err),
  );
}

export function subscribeMembers(
  householdId: string,
  onData: (members: HouseholdMember[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe | null {
  const db = getFirestoreDb();
  if (!db) return null;
  return onSnapshot(
    collection(db, "households", householdId, "members"),
    (snap) =>
      onData(
        snap.docs.map((d) => ({ ...(d.data() as HouseholdMember), uid: d.id })),
      ),
    (err) => onError?.(err),
  );
}

export async function updateHouseholdMeta(
  householdId: string,
  patch: Partial<
    Pick<
      HouseholdMeta,
      | "name"
      | "zones"
      | "floorPlan"
      | "cover"
      | "weatherLocation"
      | "sharedCalendar"
      | "choreWeights"
      | "statsVisibility"
      | "billSettings"
      | "landlord"
      | "reminders"
    >
  >,
) {
  guardWriteBudget();
  await updateDoc(doc(requireDb(), "households", householdId), patch);
}

/** Zablokowane / ukryte funkcje mieszkania — tylko to pole, `legacyCalendar` zostaje */
export async function setHouseholdFeatureFlags(
  householdId: string,
  flags: Partial<Record<string, "on" | "locked" | "hidden">>,
) {
  guardWriteBudget();
  await updateDoc(doc(requireDb(), "households", householdId), {
    "features.flags": flags,
  });
}

/** PANIC (goście) — każdy domownik, także tablet bez konta */
export async function setHouseholdPanic(
  householdId: string,
  panic: PanicState | null,
) {
  guardWriteBudget();
  await updateDoc(doc(requireDb(), "households", householdId), { panic });
}

export async function updateMember(
  householdId: string,
  uid: string,
  patch: Partial<
    Pick<
      HouseholdMember,
      "role" | "profileId" | "displayName" | "email" | "anonymous" | "provider"
    >
  >,
) {
  guardWriteBudget();
  await updateDoc(
    doc(requireDb(), "households", householdId, "members", uid),
    patch,
  );
}

export async function removeMember(householdId: string, uid: string) {
  guardWriteBudget();
  await deleteDoc(doc(requireDb(), "households", householdId, "members", uid));
}
