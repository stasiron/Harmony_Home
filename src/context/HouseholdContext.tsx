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
  regenerateInvite as regenerateInviteDoc,
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
  WeatherLocation,
} from "@/types";

const ACTIVE_HOUSEHOLD_KEY = "homeharmony-active-household";

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
  memberships: Membership[];
  householdId: string | null;
  household: HouseholdMeta | null;
  members: HouseholdMember[];
  me: HouseholdMember | null;
  isAdmin: boolean;
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
  setZones: (zones: HomeZone[]) => Promise<void>;
  regenerateInvite: () => Promise<string>;
  linkProfile: (profileId: string | null) => Promise<void>;
  setMemberRole: (uid: string, role: HouseholdRole) => Promise<void>;
  setMemberProfile: (uid: string, profileId: string | null) => Promise<void>;
  removeMember: (uid: string) => Promise<void>;
  leaveHousehold: () => Promise<void>;
  canEditItem: (item: ItemMeta) => boolean;
  canLockItem: (item: ItemMeta) => boolean;
};

const HouseholdContext = createContext<HouseholdContextValue | null>(null);

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { syncUser } = useAuth();
  const uid = syncUser?.uid ?? null;
  const hasAccount = Boolean(syncUser && !syncUser.isAnonymous);

  const superAdmin = isSuperAdminUser(syncUser);
  const [ownMemberships, setMemberships] = useState<Membership[] | null>(null);
  const [allHouseholds, setAllHouseholds] = useState<Membership[]>([]);
  const [preferredId, setPreferredId] = useState<string | null>(null);
  const [household, setHousehold] = useState<HouseholdMeta | null>(null);
  const [householdLoaded, setHouseholdLoaded] = useState(false);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [floorPlan, setFloorPlan] = useState<FloorPlanImage | null>(null);

  useEffect(() => {
    setPreferredId(readActiveHousehold());
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
    if (!householdId || !uid) return;

    const unsubMeta = subscribeHouseholdMeta(
      householdId,
      (meta) => {
        setHousehold(meta);
        setHouseholdLoaded(true);
      },
      (err) => {
        console.error("Household load failed:", err);
        // Usunięty z mieszkania — wpis w memberships jest nieaktualny
        if ((err as { code?: string }).code === "permission-denied") {
          void removeMembership(uid, householdId);
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

  // Własny wpis członkostwa pokazuje aktualne konto (np. po zalogowaniu
  // linkiem urządzenie przestaje być „bez konta”) — zapis tylko przy zmianie
  useEffect(() => {
    if (!me || !syncUser || !householdId) return;
    const fields = memberAccountFields(syncUser);
    const stale = (Object.keys(fields) as (keyof typeof fields)[]).some(
      (key) => (me[key] ?? null) !== fields[key],
    );
    if (!stale) return;
    void updateMember(householdId, syncUser.uid, fields).catch((err) =>
      console.error("Member account sync failed:", err),
    );
  }, [me, syncUser, householdId]);

  const canMigrateLegacy =
    superAdmin &&
    memberships !== null &&
    !memberships.some((m) => m.householdId === LEGACY_HOUSEHOLD_ID);

  const switchHousehold = useCallback((id: string) => {
    writeActiveHousehold(id);
    setPreferredId(id);
  }, []);

  const requireUser = useCallback(() => {
    if (!syncUser) throw new Error("Brak sesji Firebase.");
    return syncUser;
  }, [syncUser]);

  const createHousehold = useCallback(
    async (input: CreateHouseholdInput) => {
      const id = await createHouseholdDocs(requireUser(), input);
      switchHousehold(id);
    },
    [requireUser, switchHousehold],
  );

  const joinHousehold = useCallback(
    async (code: string) => {
      const id = await joinHouseholdDocs(requireUser(), code);
      switchHousehold(id);
    },
    [requireUser, switchHousehold],
  );

  const migrateLegacy = useCallback(async () => {
    const id = await migrateLegacyHousehold(requireUser());
    switchHousehold(id);
  }, [requireUser, switchHousehold]);

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

  const setZones = useCallback(
    async (zones: HomeZone[]) => {
      await updateHouseholdMeta(requireHousehold(), { zones });
    },
    [requireHousehold],
  );

  const regenerateInvite = useCallback(
    () =>
      regenerateInviteDoc(
        requireHousehold(),
        requireUser().uid,
        household?.inviteCode,
      ),
    [requireHousehold, requireUser, household?.inviteCode],
  );

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
      await removeMemberDoc(requireHousehold(), memberUid);
    },
    [requireHousehold],
  );

  const leaveHousehold = useCallback(async () => {
    const id = requireHousehold();
    const user = requireUser();
    await removeMemberDoc(id, user.uid);
    await removeMembership(user.uid, id);
  }, [requireHousehold, requireUser]);

  const canEditItem = useCallback(
    (item: ItemMeta) => !item.locked || item.createdBy === uid || isAdmin,
    [uid, isAdmin],
  );

  const canLockItem = useCallback(
    (item: ItemMeta) =>
      hasAccount && (!item.createdBy || item.createdBy === uid || isAdmin),
    [hasAccount, uid, isAdmin],
  );

  const value: HouseholdContextValue = {
    status,
    memberships: memberships ?? [],
    householdId: status === "ready" ? householdId : null,
    household,
    members,
    me,
    isAdmin,
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
    setZones,
    regenerateInvite,
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

export function useHousehold() {
  const ctx = useContext(HouseholdContext);
  if (!ctx)
    throw new Error("useHousehold must be used within HouseholdProvider");
  return ctx;
}
