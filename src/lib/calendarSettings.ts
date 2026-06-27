import { createServerFn } from "@tanstack/react-start";
import { DEFAULT_MEMBERS } from "@/config/household";
import {
  publicMemberConnection,
  readCalendarConnectionsStore,
  updateMemberConnection,
  upsertMemberConnection,
  type StoredCalendar,
} from "@/lib/calendarConnectionsStore";
import { classifyGoogleCalendar } from "@/lib/calendarRules";
import {
  fetchGoogleCalendarList,
  fetchGoogleUserEmail,
  getGoogleOAuthConfig,
} from "@/lib/googleOAuth";

export const getCalendarConnectionStatus = createServerFn({ method: "GET" }).handler(
  async () => {
    const store = await readCalendarConnectionsStore();
    const oauthReady = Boolean(getGoogleOAuthConfig());

    return {
      oauthReady,
      members: DEFAULT_MEMBERS.map((member) => {
        const connection = store.members[member.id];
        return {
          memberId: member.id,
          memberName: member.name,
          connected: Boolean(connection),
          connection: connection ? publicMemberConnection(connection) : null,
        };
      }),
    };
  },
);

export const setMemberCalendarEnabled = createServerFn({ method: "POST" })
  .validator((data: { memberId: string; googleCalendarId: string; enabled: boolean }) => data)
  .handler(async ({ data }) => {
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
    return { ok: true };
  });

export const setMemberCalendarDisplay = createServerFn({ method: "POST" })
  .validator(
    (data: {
      memberId: string;
      googleCalendarId: string;
      display: "full" | "busy";
    }) => data,
  )
  .handler(async ({ data }) => {
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
    return { ok: true };
  });

export const disconnectMemberGoogle = createServerFn({ method: "POST" })
  .validator((data: { memberId: string }) => data)
  .handler(async ({ data }) => {
    await updateMemberConnection(data.memberId, () => undefined);
    return { ok: true };
  });

export async function saveOAuthMemberConnection(input: {
  memberId: string;
  refreshToken: string;
  accessToken: string;
  expiresIn: number;
}) {
  const accessTokenExpiresAt = new Date(Date.now() + input.expiresIn * 1000).toISOString();
  const googleEmail = await fetchGoogleUserEmail(input.accessToken);
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
