import { DEFAULT_MEMBERS, MEMBER_EMAIL_LINKS } from "@/config/household";
import {
  verifyFirebaseIdToken,
  type VerifiedViewer,
} from "@/lib/firebaseToken.server";
import { viewerMemberIds } from "@/lib/memberCalendars.server";
import { memberIdFromEmail } from "@/lib/memberLink";
import type { CalendarConnectionsStore } from "@/lib/calendarConnectionsStore.server";
import {
  publicMemberConnection,
  hasPersistentCalendarStore,
  readCalendarConnectionsStore,
  updateMemberConnection,
  upsertMemberConnection,
  type StoredCalendar,
} from "@/lib/calendarConnectionsStore.server";
import { classifyGoogleCalendar } from "@/lib/calendarRules";
import {
  fetchGoogleCalendarList,
  fetchGoogleUserEmail,
  getGoogleOAuthConfig,
} from "@/lib/googleOAuth.server";

/**
 * Czy ten adres Google może być właścicielem kalendarza domownika `memberId`:
 * zgodny z przypisaniem e-maili (src/config/household.ts) i nie zajęty przez
 * inne konto.
 */
export function canClaimMember(
  email: string | null,
  memberId: string,
  store: CalendarConnectionsStore,
): boolean {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return false;
  const mapped = memberIdFromEmail(normalized);
  if (mapped) return mapped === memberId;
  const claimedByOther = Object.entries(MEMBER_EMAIL_LINKS).some(
    ([linkEmail, id]) => id === memberId && linkEmail !== normalized,
  );
  if (claimedByOther) return false;
  const existing = store.members[memberId];
  return !existing || existing.googleEmail?.toLowerCase() === normalized;
}

function isTrustedViewer(
  viewer: VerifiedViewer | null,
): viewer is VerifiedViewer {
  return Boolean(
    viewer && !viewer.anonymous && viewer.emailVerified && viewer.email,
  );
}

/** Domownicy, których kalendarzem zarządza ten viewer */
async function ownedMemberIds(idToken: string | null | undefined) {
  const viewer = await verifyFirebaseIdToken(idToken);
  const store = await readCalendarConnectionsStore();
  const owned = isTrustedViewer(viewer)
    ? viewerMemberIds(viewer, Object.values(store.members))
    : new Set<string>();
  owned.delete("household");
  return { viewer, store, owned };
}

async function requireOwner(
  idToken: string | null | undefined,
  memberId: string,
) {
  const { owned } = await ownedMemberIds(idToken);
  if (!owned.has(memberId)) throw new Error("calendar_forbidden");
}

export async function getCalendarConnectionStatusImpl(
  data: { idToken?: string | null } = {},
) {
  const { store, owned } = await ownedMemberIds(data.idToken);
  const oauthServerConfigured = Boolean(getGoogleOAuthConfig());

  return {
    oauthReady: true,
    oauthServerConfigured,
    persistentStore: hasPersistentCalendarStore(),
    members: DEFAULT_MEMBERS.map((member) => {
      const connection = store.members[member.id];
      return {
        memberId: member.id,
        memberName: member.name,
        connected: Boolean(connection),
        /** Szczegóły (e-mail, lista kalendarzy) tylko dla właściciela */
        mine: owned.has(member.id),
        connection:
          connection && owned.has(member.id)
            ? publicMemberConnection(connection)
            : null,
      };
    }),
  };
}

export async function setMemberCalendarEnabledImpl(data: {
  memberId: string;
  googleCalendarId: string;
  enabled: boolean;
  idToken?: string | null;
}) {
  await requireOwner(data.idToken, data.memberId);
  await updateMemberConnection(data.memberId, (current) => {
    if (!current) return current;
    return {
      ...current,
      calendars: current.calendars.map((c) =>
        c.googleCalendarId === data.googleCalendarId
          ? { ...c, enabled: data.enabled }
          : c,
      ),
    };
  });
  return { ok: true as const };
}

export async function setMemberCalendarDisplayImpl(data: {
  memberId: string;
  googleCalendarId: string;
  display: "full" | "busy";
  idToken?: string | null;
}) {
  await requireOwner(data.idToken, data.memberId);
  await updateMemberConnection(data.memberId, (current) => {
    if (!current) return current;
    return {
      ...current,
      calendars: current.calendars.map((c) =>
        c.googleCalendarId === data.googleCalendarId
          ? { ...c, display: data.display }
          : c,
      ),
    };
  });
  return { ok: true as const };
}

export async function disconnectMemberGoogleImpl(data: {
  memberId: string;
  idToken?: string | null;
}) {
  await requireOwner(data.idToken, data.memberId);
  await updateMemberConnection(data.memberId, () => undefined);
  return { ok: true as const };
}

export async function saveOAuthMemberConnection(input: {
  memberId: string;
  refreshToken: string;
  accessToken: string;
  expiresIn: number;
}) {
  const accessTokenExpiresAt = new Date(
    Date.now() + input.expiresIn * 1000,
  ).toISOString();
  const googleEmail = await fetchGoogleUserEmail(input.accessToken);
  // Konto Google samo potwierdza tożsamość — nie podłączy się pod cudzy profil
  if (
    !canClaimMember(
      googleEmail,
      input.memberId,
      await readCalendarConnectionsStore(),
    )
  ) {
    throw new Error("calendar_forbidden");
  }
  const list = await fetchGoogleCalendarList(input.accessToken);

  const calendars: StoredCalendar[] = list.map((item) => {
    const classified = classifyGoogleCalendar(input.memberId, item.summary);
    return {
      googleCalendarId: item.id,
      summary: item.summary,
      enabled: true,
      display: classified.display,
      color: classified.color,
      label: classified.label,
    };
  });

  await upsertMemberConnection({
    memberId: input.memberId,
    googleEmail,
    refreshToken: input.refreshToken,
    accessToken: input.accessToken,
    accessTokenExpiresAt,
    connectedAt: new Date().toISOString(),
    calendars,
  });
}

export async function saveFirebaseCalendarConnection(input: {
  memberId: string;
  accessToken: string;
  expiresIn?: number;
  idToken?: string | null;
}) {
  const expiresIn = input.expiresIn ?? 3600;
  const accessTokenExpiresAt = new Date(
    Date.now() + expiresIn * 1000,
  ).toISOString();
  const viewer = await verifyFirebaseIdToken(input.idToken);
  const googleEmail = await fetchGoogleUserEmail(input.accessToken);
  if (
    !isTrustedViewer(viewer) ||
    viewer.email !== googleEmail.toLowerCase() ||
    !canClaimMember(
      googleEmail,
      input.memberId,
      await readCalendarConnectionsStore(),
    )
  ) {
    throw new Error("calendar_forbidden");
  }
  const list = await fetchGoogleCalendarList(input.accessToken);

  const calendars: StoredCalendar[] = list.map((item) => {
    const classified = classifyGoogleCalendar(input.memberId, item.summary);
    return {
      googleCalendarId: item.id,
      summary: item.summary,
      enabled: true,
      display: classified.display,
      color: classified.color,
      label: classified.label,
    };
  });

  await upsertMemberConnection({
    memberId: input.memberId,
    googleEmail,
    refreshToken: "",
    accessToken: input.accessToken,
    accessTokenExpiresAt,
    connectedAt: new Date().toISOString(),
    calendars,
  });
}
