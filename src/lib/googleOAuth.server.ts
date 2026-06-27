import { createHmac, timingSafeEqual } from "node:crypto";
import type { CalendarDisplayMode } from "@/config/calendars/types";
import type { MemberConnection } from "@/lib/calendarConnectionsStore.server";
import { updateMemberConnection } from "@/lib/calendarConnectionsStore.server";

export const GOOGLE_CALENDAR_SCOPE =
  "https://www.googleapis.com/auth/calendar.readonly";
export const GOOGLE_EMAIL_SCOPE = "email";

type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
};

type GoogleCalendarListItem = {
  id: string;
  summary: string;
  primary?: boolean;
};

type GoogleCalendarListResponse = {
  items?: GoogleCalendarListItem[];
};

type GoogleEventItem = {
  id: string;
  summary?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

type GoogleEventsResponse = {
  items?: GoogleEventItem[];
};

export function getGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const authSecret = process.env.AUTH_SECRET?.trim();
  if (!clientId || !clientSecret || !authSecret) {
    return null;
  }
  return { clientId, clientSecret, authSecret };
}

export function getAppOrigin(requestUrl?: string): string {
  const fromEnv =
    process.env.APP_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    process.env.NITRO_APP_BASE_URL?.trim();
  if (fromEnv) {
    return fromEnv.startsWith("http")
      ? fromEnv.replace(/\/$/, "")
      : `https://${fromEnv}`;
  }
  if (requestUrl) {
    const url = new URL(requestUrl);
    return url.origin;
  }
  return "http://localhost:3000";
}

function authSecret(): string {
  const secret = getGoogleOAuthConfig()?.authSecret;
  if (!secret) throw new Error("AUTH_SECRET missing");
  return secret;
}

export function signOAuthState(payload: {
  memberId: string;
  nonce: string;
}): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", authSecret())
    .update(data)
    .digest("base64url");
  return `${data}.${sig}`;
}

export function verifyOAuthState(
  state: string,
): { memberId: string; nonce: string } | null {
  const [data, sig] = state.split(".");
  if (!data || !sig) return null;
  const expected = createHmac("sha256", authSecret())
    .update(data)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(data, "base64url").toString("utf-8")) as {
      memberId: string;
      nonce: string;
    };
  } catch {
    return null;
  }
}

export function buildGoogleAuthUrl(
  origin: string,
  memberId: string,
): string | null {
  const cfg = getGoogleOAuthConfig();
  if (!cfg) return null;

  const redirectUri = `${origin}/api/auth/google/callback`;
  const state = signOAuthState({ memberId, nonce: crypto.randomUUID() });
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: [GOOGLE_CALENDAR_SCOPE, GOOGLE_EMAIL_SCOPE].join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(
  code: string,
  origin: string,
): Promise<GoogleTokenResponse> {
  const cfg = getGoogleOAuthConfig();
  if (!cfg) throw new Error("Google OAuth not configured");

  const redirectUri = `${origin}/api/auth/google/callback`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    throw new Error("google token exchange failed");
  }
  return (await res.json()) as GoogleTokenResponse;
}

export async function refreshGoogleAccessToken(
  refreshToken: string,
): Promise<GoogleTokenResponse> {
  const cfg = getGoogleOAuthConfig();
  if (!cfg) throw new Error("Google OAuth not configured");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    throw new Error("google token refresh failed");
  }
  return (await res.json()) as GoogleTokenResponse;
}

export async function fetchGoogleUserEmail(
  accessToken: string,
): Promise<string> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("google userinfo failed");
  const data = (await res.json()) as { email?: string };
  return data.email ?? "unknown@gmail.com";
}

export async function fetchGoogleCalendarList(
  accessToken: string,
): Promise<GoogleCalendarListItem[]> {
  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (!res.ok) throw new Error("google calendar list failed");
  const data = (await res.json()) as GoogleCalendarListResponse;
  return data.items ?? [];
}

function parseGoogleEventDate(value?: {
  dateTime?: string;
  date?: string;
}): Date | null {
  if (!value) return null;
  if (value.dateTime) return new Date(value.dateTime);
  if (value.date) return new Date(`${value.date}T00:00:00`);
  return null;
}

export async function fetchGoogleCalendarEvents(
  accessToken: string,
  calendarId: string,
  rangeStart: Date,
  rangeEnd: Date,
): Promise<GoogleEventItem[]> {
  const params = new URLSearchParams({
    timeMin: rangeStart.toISOString(),
    timeMax: rangeEnd.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });
  const encodedId = encodeURIComponent(calendarId);
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodedId}/events?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) return [];
  const data = (await res.json()) as GoogleEventsResponse;
  return data.items ?? [];
}

export async function getMemberAccessToken(
  connection: MemberConnection,
): Promise<string> {
  const stillValid =
    connection.accessToken &&
    connection.accessTokenExpiresAt &&
    new Date(connection.accessTokenExpiresAt).getTime() > Date.now() + 60_000;

  if (stillValid && connection.accessToken) return connection.accessToken;

  if (!connection.refreshToken) {
    throw new Error("calendar_token_expired");
  }

  const refreshed = await refreshGoogleAccessToken(connection.refreshToken);
  const accessToken = refreshed.access_token;
  const expiresAt = new Date(
    Date.now() + refreshed.expires_in * 1000,
  ).toISOString();

  await updateMemberConnection(connection.memberId, (current) => {
    if (!current) return current;
    return {
      ...current,
      accessToken,
      accessTokenExpiresAt: expiresAt,
    };
  });

  return accessToken;
}

export function googleEventToIsoRange(item: GoogleEventItem): {
  start: string;
  end: string | null;
} | null {
  const start = parseGoogleEventDate(item.start);
  if (!start) return null;
  const end = parseGoogleEventDate(item.end);
  return {
    start: start.toISOString(),
    end: end?.toISOString() ?? null,
  };
}

export type { GoogleCalendarListItem, GoogleEventItem, CalendarDisplayMode };
