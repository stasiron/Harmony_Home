import {
  hasPersistentCalendarStore,
  publicMemberConnection,
  readCalendarConnectionsStore,
  updateMemberConnection,
  upsertMemberConnection,
  type StoredCalendar,
} from "@/lib/calendarConnectionsStore.server";
import { classifyGoogleCalendar } from "@/lib/calendarRules";
import { verifyFirebaseIdToken } from "@/lib/firebaseToken.server";
import {
  buildGoogleAuthUrl,
  fetchGoogleCalendarList,
  fetchGoogleUserEmail,
  getAppOrigin,
  getGoogleOAuthConfig,
} from "@/lib/googleOAuth.server";
import { canHavePersonalCalendar } from "@/lib/memberCalendars.server";

/**
 * Połączenie Google Calendar (OAuth) należy do konta — klucz w Redis to uid
 * z zweryfikowanego tokenu. `MemberConnection.memberId` = uid konta.
 */

async function requireAccountUid(idToken: string | null | undefined) {
  const viewer = await verifyFirebaseIdToken(idToken);
  if (!canHavePersonalCalendar(viewer)) throw new Error("calendar_forbidden");
  return viewer.uid;
}

export async function getCalendarConnectionStatusImpl(
  data: { idToken?: string | null } = {},
) {
  const viewer = await verifyFirebaseIdToken(data.idToken);
  const oauthServerConfigured = Boolean(getGoogleOAuthConfig());
  const persistentStore = hasPersistentCalendarStore();
  let connection = null;
  if (canHavePersonalCalendar(viewer)) {
    const store = await readCalendarConnectionsStore();
    const own = store.members[viewer.uid];
    connection = own ? publicMemberConnection(own) : null;
  }
  return {
    oauthReady: true,
    oauthServerConfigured,
    persistentStore,
    /** Tylko połączenie pytającego — cudzych nikt nie widzi */
    connection,
  };
}

/** Adres zgody Google — state podpisany AUTH_SECRET niesie uid konta */
export async function createGoogleCalendarAuthUrlImpl(data: {
  idToken?: string | null;
  origin?: string;
}) {
  const uid = await requireAccountUid(data.idToken);
  const origin = getAppOrigin(data.origin);
  const url = buildGoogleAuthUrl(origin, uid);
  if (!url) throw new Error("oauth_not_configured");
  return { url };
}

function patchOwnCalendar(
  uid: string,
  googleCalendarId: string,
  patch: Partial<StoredCalendar>,
) {
  return updateMemberConnection(uid, (current) => {
    if (!current) return current;
    return {
      ...current,
      calendars: current.calendars.map((c) =>
        c.googleCalendarId === googleCalendarId ? { ...c, ...patch } : c,
      ),
    };
  });
}

export async function setMemberCalendarEnabledImpl(data: {
  googleCalendarId: string;
  enabled: boolean;
  idToken?: string | null;
}) {
  const uid = await requireAccountUid(data.idToken);
  await patchOwnCalendar(uid, data.googleCalendarId, {
    enabled: data.enabled,
  });
  return { ok: true as const };
}

export async function setMemberCalendarDisplayImpl(data: {
  googleCalendarId: string;
  display: "full" | "busy";
  idToken?: string | null;
}) {
  const uid = await requireAccountUid(data.idToken);
  await patchOwnCalendar(uid, data.googleCalendarId, {
    display: data.display,
  });
  return { ok: true as const };
}

export async function disconnectMemberGoogleImpl(data: {
  idToken?: string | null;
}) {
  const uid = await requireAccountUid(data.idToken);
  await updateMemberConnection(uid, () => undefined);
  return { ok: true as const };
}

/** Po powrocie z Google (api-routes callback) — uid z podpisanego state */
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
  const list = await fetchGoogleCalendarList(input.accessToken);

  const calendars: StoredCalendar[] = list.map((item, index) => {
    const classified = classifyGoogleCalendar(item.summary, index);
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
