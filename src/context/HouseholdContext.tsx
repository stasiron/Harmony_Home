import { statsAccess } from "@/config/roles";
import type { StatsVisibility } from "@/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { subscribeFloorPlanImage, type FloorPlanImage } from "@/lib/floorPlan";
import {
  createHousehold as createHouseholdDocs,
  isSuperAdmin as isSuperAdminUser,
  memberAccountFields,
  subscribeAllHouseholds,
  joinHousehold as joinHouseholdDocs,
  migrateLegacyHousehold,
  deactivateInvite as deactivateInviteDoc,
  deleteHousehold as deleteHouseholdDocs,
  moveLegacyInviteCode,
  regenerateInvite as regenerateInviteDoc,
  subscribeInvite,
  tokenProviderOf,
  transferOwnership as transferOwnershipDoc,
  removeMember as removeMemberDoc,
  removeMembership,
  subscribeHouseholdMeta,
  subscribeMembers,
  subscribeMemberships,
  updateHouseholdMeta,
  updateMember,
  type CreateHouseholdInput,
} from "@/lib/householdSetup";
import { LEGACY_HOUSEHOLD_ID } from "@/lib/legacyHousehold";
import type {
  HomeZone,
  HouseholdMember,
  HouseholdMeta,
  HouseholdRole,
  ItemMeta,
  Membership,
  BillSettings,
  LandlordContact,
  ReminderSettings,
  ChoreWeightSettings,
  SharedCalendarSettings,
  WeatherLocation,
} from "@/types";

const ACTIVE_HOUSEHOLD_KEY = "homeharmony-active-household";
/** Ekran wejścia: po wyborze mieszkania nie pytamy ponownie w tej karcie */
const ENTERED_KEY = "homeharmony-entered";

function readEntered(): boolean {
  try {
    return sessionStorage.getItem(ENTERED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeEntered() {
  try {
    sessionStorage.setItem(ENTERED_KEY, "1");
  } catch {
    // ignore private mode
  }
}

function readActiveHousehold(): string | null {
  try {
    return localStorage.getItem(ACTIVE_HOUSEHOLD_KEY);
  } catch {
    return null;
  }
}

function writeActiveHousehold(id: string) {
  try {
    localStorage.setItem(ACTIVE_HOUSEHOLD_KEY, id);
  } catch {
    // ignore quota / private mode
  }
}

/**
 * - loading: konto / lista mieszkań jeszcze się wczytuje (też SSR)
 * - none: użytkownik nie należy do żadnego mieszkania → ekran startowy
 * - ready: aktywne mieszkanie wczytane
 */
export type HouseholdStatus = "loading" | "none" | "ready";

type HouseholdContextValue = {
  status: HouseholdStatus;
  /** Lista mieszkań wczytana (status może być jeszcze "loading") */
  membershipsLoaded: boolean;
  /**
   * Ekran wejścia już przeszedł w tej karcie (null = jeszcze nie wiadomo —
   * SSR i pierwszy render w przeglądarce)
   */
  entered: boolean | null;
  /** Wybór mieszkania na ekranie wejścia */
  enterHousehold: (id: string) => void;
  memberships: Membership[];
  householdId: string | null;
  household: HouseholdMeta | null;
  members: HouseholdMember[];
  me: HouseholdMember | null;
  /** Rola w tym mieszkaniu (administrator ogólny = admin) */
  role: HouseholdRole | null;
  isAdmin: boolean;
  /** Każdy poza gościem */
  canWrite: boolean;
  /** Co pokazują statystyki tej osobie (statsVisibility + rola) */
  stats: "all" | "own" | "none";
  setStatsVisibility: (mode: StatsVisibility) => Promise<void>;
  /** Administrator ogólny — admin każdego mieszkania */
  isSuperAdmin: boolean;
  /** Konto Google — prywatne miejsca i blokowanie elementów (decyzja 1) */
  hasAccount: boolean;
  /** Domownik (User.id) połączony z tym kontem / urządzeniem */
  myProfileId: string | null;
  zones: HomeZone[];
  floorPlan: FloorPlanImage | null;
  /** Właściciel pierwszego mieszkania, które czeka na migrację */
  canMigrateLegacy: boolean;
  switchHousehold: (id: string) => void;
  createHousehold: (input: CreateHouseholdInput) => Promise<void>;
  joinHousehold: (code: string) => Promise<void>;
  migrateLegacy: () => Promise<void>;
  renameHousehold: (name: string) => Promise<void>;
  setWeatherLocation: (location: WeatherLocation) => Promise<void>;
  setSharedCalendar: (settings: SharedCalendarSettings | null) => Promise<void>;
  setChoreWeights: (settings: ChoreWeightSettings) => Promise<void>;
  setBillSettings: (settings: BillSettings) => Promise<void>;
  setLandlord: (contact: LandlordContact | null) => Promise<void>;
  setReminders: (settings: ReminderSettings) => Promise<void>;
  setZones: (zones: HomeZone[]) => Promise<void>;
  /** Błąd wczytywania mieszkania (np. limit bazy) — zamiast wiecznego „Wczytuję…” */
  loadError: string | null;
  /** Aktywny kod zaproszenia — tylko dla administratora */
  inviteCode: string | null;
  /** To konto założyło mieszkanie (twórca) */
  isOwner: boolean;
  transferOwnership: (uid: string) => Promise<void>;
  deleteHousehold: () => Promise<void>;
  regenerateInvite: () => Promise<string>;
  deactivateInvite: () => Promise<void>;
  linkProfile: (profileId: string | null) => Promise<void>;
  setMemberRole: (uid: string, role: HouseholdRole) => Promise<void>;
  setMemberProfile: (uid: string, profileId: string | null) => Promise<void>;
  removeMember: (uid: string) => Promise<void>;
  leaveHousehold: () => Promise<void>;
  canEditItem: (item: ItemMeta) => boolean;
  canLockItem: (item: ItemMeta) => boolean;
};

function loadErrorMessage(code: string | undefined): string {
  switch (code) {
    case "resource-exhausted":
      return "Baza danych osiągnęła dzienny limit. Spróbuj ponownie za kilka godzin.";
    case "unavailable":
      return "Brak połączenia z bazą danych. Sprawdź internet i odśwież stronę.";
    default:
      return "Nie udało się wczytać mieszkania. Odśwież stronę.";
  }
}

const HouseholdContext = createContext<HouseholdContextValue | null>(null);

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { syncUser } = useAuth();
  const uid = syncUser?.uid ?? null;
  const hasAccount = Boolean(syncUser && !syncUser.isAnonymous);

  const superAdmin = isSuperAdminUser(syncUser);
  const [ownMemberships, setMemberships] = useState<Membership[] | null>(null);
  const [allHouseholds, setAllHouseholds] = useState<Membership[]>([]);
  const [preferredId, setPreferredId] = useState<string | null>(null);
  const [entered, setEntered] = useState<boolean | null>(null);
  const [household, setHousehold] = useState<HouseholdMeta | null>(null);
  const [householdLoaded, setHouseholdLoaded] = useState(false);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [inviteDocCode, setInviteDocCode] = useState<string | null>(null);
  const [floorPlan, setFloorPlan] = useState<FloorPlanImage | null>(null);

  useEffect(() => {
    setPreferredId(readActiveHousehold());
    setEntered(readEntered());
  }, []);

  useEffect(() => {
    setMemberships(null);
    if (!uid) return;
    const unsubscribe = subscribeMemberships(uid, setMemberships, (err) => {
      console.error("Memberships load failed:", err);
      setMemberships([]);
    });
    return () => unsubscribe?.();
  }, [uid]);

  // Administrator ogólny widzi też mieszkania, do których nie dołączył
  useEffect(() => {
    setAllHouseholds([]);
    if (!uid || !superAdmin) return;
    const unsubscribe = subscribeAllHouseholds(setAllHouseholds, (err) =>
      console.error("All households load failed:", err),
    );
    return () => unsubscribe?.();
  }, [uid, superAdmin]);

  const memberships = useMemo(() => {
    if (!ownMemberships) return null;
    const joined = new Set(ownMemberships.map((m) => m.householdId));
    return [
      ...ownMemberships,
      ...allHouseholds.filter((h) => !joined.has(h.householdId)),
    ];
  }, [ownMemberships, allHouseholds]);

  const householdId = useMemo(() => {
    if (!memberships || memberships.length === 0) return null;
    return memberships.some((m) => m.householdId === preferredId)
      ? preferredId
      : memberships[0]!.householdId;
  }, [memberships, preferredId]);

  useEffect(() => {
    setHousehold(null);
    setHouseholdLoaded(false);
    setMembers([]);
    setLoadError(null);
    if (!householdId || !uid) return;

    const unsubMeta = subscribeHouseholdMeta(
      householdId,
      (meta) => {
        // Mieszkanie usunięte — wpis w memberships jest nieaktualny
        if (!meta) void removeMembership(uid, householdId).catch(() => {});
        setHousehold(meta);
        setHouseholdLoaded(true);
        setLoadError(null);
      },
      (err) => {
        console.error("Household load failed:", err);
        const code = (err as { code?: string }).code;
        // Usunięty z mieszkania — wpis w memberships jest nieaktualny
        if (code === "permission-denied") {
          void removeMembership(uid, householdId).catch(() => {});
        } else {
          setLoadError(loadErrorMessage(code));
        }
        setHouseholdLoaded(true);
      },
    );
    const unsubMembers = subscribeMembers(householdId, setMembers, (err) =>
      console.error("Members load failed:", err),
    );
    return () => {
      unsubMeta?.();
      unsubMembers?.();
    };
  }, [householdId, uid]);

  const floorPlanKey = household
    ? `${household.id}:${JSON.stringify(household.floorPlan)}`
    : null;
  useEffect(() => {
    setFloorPlan(null);
    if (!household) return;
    const unsubscribe = subscribeFloorPlanImage(
      household.id,
      household.floorPlan,
      setFloorPlan,
    );
    return () => unsubscribe?.();
    // floorPlanKey zmienia się razem z planem — nie przy każdej zmianie stref
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floorPlanKey]);

  const status: HouseholdStatus =
    !uid || memberships === null
      ? "loading"
      : memberships.length === 0
        ? "none"
        : householdLoaded && household
          ? "ready"
          : "loading";

  const me = useMemo(
    () => members.find((m) => m.uid === uid) ?? null,
    [members, uid],
  );
  const isAdmin = superAdmin || me?.role === "admin";
  const isOwner = Boolean(uid && household?.ownerId === uid);

  // Kod zaproszenia czyta tylko administrator (admin/invite)
  useEffect(() => {
    setInviteDocCode(null);
    if (!householdId || !isAdmin) return;
    const unsubscribe = subscribeInvite(householdId, setInviteDocCode, (err) =>
      console.error("Invite load failed:", err),
    );
    return () => unsubscribe?.();
  }, [householdId, isAdmin]);

  // Stare mieszkania: kod w dokumencie mieszkania (widzą go goście) — przenieś
  const legacyInviteCode = household?.inviteCode ?? null;
  useEffect(() => {
    if (!householdId || !isAdmin || !legacyInviteCode) return;
    void moveLegacyInviteCode(householdId, legacyInviteCode).catch((err) =>
      console.error("Invite move failed:", err),
    );
  }, [householdId, isAdmin, legacyInviteCode]);
  const inviteCode = isAdmin ? (inviteDocCode ?? legacyInviteCode) : null;
  const role: HouseholdRole | null = superAdmin ? "admin" : (me?.role ?? null);
  const canWrite = role !== "guest";
  const stats = statsAccess(household?.statsVisibility, role);

  // Własny wpis członkostwa pokazuje aktualne konto (np. po zalogowaniu
  // linkiem urządzenie przestaje być „bez konta”) — zapis tylko przy zmianie.
  // Połączenie konta zmienia ten sam obiekt User, stąd klucz z jego pól.
  const accountKey = syncUser
    ? JSON.stringify(memberAccountFields(syncUser))
    : null;
  useEffect(() => {
    if (!me || !syncUser || !householdId) return;
    let cancelled = false;
    // Provider z tokenu — reguła members porównuje właśnie z nim
    void tokenProviderOf(syncUser).then((provider) => {
      if (cancelled) return;
      const fields = memberAccountFields(syncUser, provider);
      const stale = (Object.keys(fields) as (keyof typeof fields)[]).some(
        (key) => (me[key] ?? null) !== fields[key],
      );
      if (!stale) return;
      void updateMember(householdId, syncUser.uid, fields).catch((err) =>
        console.error("Member account sync failed:", err),
      );
    });
    return () => {
      cancelled = true;
    };
    // accountKey — zmiana pól tego samego obiektu User
  }, [me, syncUser, householdId, accountKey]);

  const canMigrateLegacy =
    superAdmin &&
    memberships !== null &&
    !memberships.some((m) => m.householdId === LEGACY_HOUSEHOLD_ID);

  const switchHousehold = useCallback((id: string) => {
    writeActiveHousehold(id);
    setPreferredId(id);
  }, []);

  const enterHousehold = useCallback(
    (id: string) => {
      switchHousehold(id);
      writeEntered();
      setEntered(true);
    },
    [switchHousehold],
  );

  const requireUser = useCallback(() => {
    if (!syncUser) throw new Error("Brak sesji Firebase.");
    return syncUser;
  }, [syncUser]);

  const createHousehold = useCallback(
    async (input: CreateHouseholdInput) => {
      const id = await createHouseholdDocs(requireUser(), input);
      enterHousehold(id);
    },
    [requireUser, enterHousehold],
  );

  const joinHousehold = useCallback(
    async (code: string) => {
      const id = await joinHouseholdDocs(requireUser(), code);
      enterHousehold(id);
    },
    [requireUser, enterHousehold],
  );

  const migrateLegacy = useCallback(async () => {
    const id = await migrateLegacyHousehold(requireUser());
    enterHousehold(id);
  }, [requireUser, enterHousehold]);

  const requireHousehold = useCallback(() => {
    if (!householdId) throw new Error("Brak aktywnego mieszkania.");
    return householdId;
  }, [householdId]);

  const renameHousehold = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      await updateHouseholdMeta(requireHousehold(), { name: trimmed });
    },
    [requireHousehold],
  );

  const setWeatherLocation = useCallback(
    async (location: WeatherLocation) => {
      await updateHouseholdMeta(requireHousehold(), {
        weatherLocation: location,
      });
    },
    [requireHousehold],
  );

  const setSharedCalendar = useCallback(
    async (settings: SharedCalendarSettings | null) => {
      await updateHouseholdMeta(requireHousehold(), {
        sharedCalendar: settings,
      });
    },
    [requireHousehold],
  );

  const setChoreWeights = useCallback(
    async (settings: ChoreWeightSettings) => {
      await updateHouseholdMeta(requireHousehold(), { choreWeights: settings });
    },
    [requireHousehold],
  );

  const setStatsVisibility = useCallback(
    async (mode: StatsVisibility) => {
      await updateHouseholdMeta(requireHousehold(), { statsVisibility: mode });
    },
    [requireHousehold],
  );

  const setBillSettings = useCallback(
    async (settings: BillSettings) => {
      await updateHouseholdMeta(requireHousehold(), { billSettings: settings });
    },
    [requireHousehold],
  );

  const setLandlord = useCallback(
    async (contact: LandlordContact | null) => {
      await updateHouseholdMeta(requireHousehold(), { landlord: contact });
    },
    [requireHousehold],
  );

  const setReminders = useCallback(
    async (settings: ReminderSettings) => {
      await updateHouseholdMeta(requireHousehold(), { reminders: settings });
    },
    [requireHousehold],
  );

  const setZones = useCallback(
    async (zones: HomeZone[]) => {
      await updateHouseholdMeta(requireHousehold(), { zones });
    },
    [requireHousehold],
  );

  const regenerateInvite = useCallback(
    () =>
      regenerateInviteDoc(requireHousehold(), requireUser().uid, inviteCode),
    [requireHousehold, requireUser, inviteCode],
  );

  const deactivateInvite = useCallback(async () => {
    if (!inviteCode) return;
    await deactivateInviteDoc(requireHousehold(), inviteCode);
  }, [requireHousehold, inviteCode]);

  const transferOwnership = useCallback(
    async (newOwner: string) => {
      await transferOwnershipDoc(requireHousehold(), newOwner);
    },
    [requireHousehold],
  );

  const deleteHousehold = useCallback(async () => {
    await deleteHouseholdDocs(
      requireHousehold(),
      requireUser().uid,
      inviteCode,
    );
  }, [requireHousehold, requireUser, inviteCode]);

  const linkProfile = useCallback(
    async (profileId: string | null) => {
      await updateMember(requireHousehold(), requireUser().uid, { profileId });
    },
    [requireHousehold, requireUser],
  );

  const setMemberRole = useCallback(
    async (memberUid: string, role: HouseholdRole) => {
      await updateMember(requireHousehold(), memberUid, { role });
    },
    [requireHousehold],
  );

  const setMemberProfile = useCallback(
    async (memberUid: string, profileId: string | null) => {
      await updateMember(requireHousehold(), memberUid, { profileId });
    },
    [requireHousehold],
  );

  const removeMember = useCallback(
    async (memberUid: string) => {
      const id = requireHousehold();
      await removeMemberDoc(id, memberUid);
      // Usunięty zna kod — nowy, żeby nie wrócił nim sam
      if (inviteCode) {
        await regenerateInviteDoc(id, requireUser().uid, inviteCode).catch(
          (err) => console.error("Invite rotate failed:", err),
        );
      }
    },
    [requireHousehold, requireUser, inviteCode],
  );

  const leaveHousehold = useCallback(async () => {
    const id = requireHousehold();
    const user = requireUser();
    await removeMemberDoc(id, user.uid);
    await removeMembership(user.uid, id);
  }, [requireHousehold, requireUser]);

  const canEditItem = useCallback(
    (item: ItemMeta) =>
      // Gość nic nie zmienia, urządzenie tylko odhacza (reguły pilnują reszty)
      role !== "guest" &&
      role !== "device" &&
      (!item.locked || item.createdBy === uid || isAdmin),
    [uid, isAdmin, role],
  );

  const canLockItem = useCallback(
    (item: ItemMeta) =>
      hasAccount &&
      role !== "guest" &&
      (!item.createdBy || item.createdBy === uid || isAdmin),
    [hasAccount, uid, isAdmin, role],
  );

  const value: HouseholdContextValue = {
    status,
    membershipsLoaded: Boolean(uid) && memberships !== null,
    entered,
    enterHousehold,
    memberships: memberships ?? [],
    householdId: status === "ready" ? householdId : null,
    household,
    members,
    me,
    role,
    isAdmin,
    canWrite,
    stats,
    setStatsVisibility,
    isSuperAdmin: superAdmin,
    hasAccount,
    myProfileId: me?.profileId ?? null,
    zones: household?.zones ?? [],
    floorPlan,
    canMigrateLegacy,
    switchHousehold,
    createHousehold,
    joinHousehold,
    migrateLegacy,
    renameHousehold,
    setWeatherLocation,
    setSharedCalendar,
    setChoreWeights,
    setBillSettings,
    setLandlord,
    setReminders,
    setZones,
    loadError,
    inviteCode,
    isOwner,
    transferOwnership,
    deleteHousehold,
    regenerateInvite,
    deactivateInvite,
    linkProfile,
    setMemberRole,
    setMemberProfile,
    removeMember,
    leaveHousehold,
    canEditItem,
    canLockItem,
  };

  return (
    <HouseholdContext.Provider value={value}>
      {children}
    </HouseholdContext.Provider>
  );
}

/** Rola bez wymogu providera — dla hooków list (null poza mieszkaniem) */
export function useHouseholdRole(): HouseholdRole | null {
  return useContext(HouseholdContext)?.role ?? null;
}

export function useHousehold() {
  const ctx = useContext(HouseholdContext);
  if (!ctx)
    throw new Error("useHousehold must be used within HouseholdProvider");
  return ctx;
}
