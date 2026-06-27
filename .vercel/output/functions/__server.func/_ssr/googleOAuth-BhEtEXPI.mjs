import { createHmac, timingSafeEqual } from "node:crypto";
import { join } from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
//#region node_modules/.nitro/vite/services/ssr/assets/googleOAuth-BhEtEXPI.js
/**
* Domyślni domownicy — edytuj ten plik pod swoją rodzinę.
*
* Wyzeruj listę (`[]`) żeby startować bez nikogo i dodawać tylko z UI.
* Usuń pojedynczy wpis albo zmień pola (name, avatar, color, active).
* id zostaw stabilne jeśli później przypiszesz obowiązki w plikach.
*/
var DEFAULT_MEMBERS = [
	{
		id: "member-1",
		name: "Maciek",
		avatar: "M",
		color: "chart-1",
		active: true,
		heavyDay: false
	},
	{
		id: "member-2",
		name: "Ania",
		avatar: "A",
		color: "chart-2",
		active: true,
		heavyDay: false
	},
	{
		id: "member-3",
		name: "Stas",
		avatar: "S",
		color: "chart-3",
		active: true,
		heavyDay: false
	},
	{
		id: "member-4",
		name: "Tymek",
		avatar: "T",
		color: "chart-4",
		active: true,
		heavyDay: false
	}
];
var STORE_KEY = "homeharmony:calendar-connections";
var DATA_DIR = process.env.CALENDAR_DATA_DIR ?? join(process.cwd(), ".data");
var DATA_FILE = join(DATA_DIR, "calendar-connections.json");
function emptyStore() {
	return { members: {} };
}
async function readFromFile() {
	try {
		const raw = await readFile(DATA_FILE, "utf-8");
		return { members: JSON.parse(raw).members ?? {} };
	} catch {
		return emptyStore();
	}
}
async function writeToFile(store) {
	if (process.env.VERCEL) return;
	try {
		await mkdir(DATA_DIR, { recursive: true });
		await writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
	} catch {}
}
async function readFromKv() {
	if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
	try {
		const { kv } = await import("../_libs/vercel__kv.mjs").then((n) => n.t);
		return await kv.get(STORE_KEY) ?? emptyStore();
	} catch {
		return null;
	}
}
async function writeToKv(store) {
	if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return;
	const { kv } = await import("../_libs/vercel__kv.mjs").then((n) => n.t);
	await kv.set(STORE_KEY, store);
}
async function readCalendarConnectionsStore() {
	const fromKv = await readFromKv();
	if (fromKv) return fromKv;
	return readFromFile();
}
async function writeCalendarConnectionsStore(store) {
	await writeToFile(store);
	await writeToKv(store);
}
async function upsertMemberConnection(connection) {
	const store = await readCalendarConnectionsStore();
	store.members[connection.memberId] = connection;
	await writeCalendarConnectionsStore(store);
}
async function updateMemberConnection(memberId, updater) {
	const store = await readCalendarConnectionsStore();
	const next = updater(store.members[memberId]);
	if (!next) delete store.members[memberId];
	else store.members[memberId] = next;
	await writeCalendarConnectionsStore(store);
}
function publicMemberConnection(connection) {
	return {
		memberId: connection.memberId,
		googleEmail: connection.googleEmail,
		connectedAt: connection.connectedAt,
		calendars: connection.calendars.map((c) => ({
			googleCalendarId: c.googleCalendarId,
			summary: c.summary,
			enabled: c.enabled,
			display: c.display,
			color: c.color,
			label: c.label
		}))
	};
}
var GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
var GOOGLE_EMAIL_SCOPE = "email";
function getGoogleOAuthConfig() {
	const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
	const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
	const authSecret = process.env.AUTH_SECRET?.trim();
	if (!clientId || !clientSecret || !authSecret) return null;
	return {
		clientId,
		clientSecret,
		authSecret
	};
}
function getAppOrigin(requestUrl) {
	const fromEnv = process.env.APP_URL?.trim() || process.env.VERCEL_URL?.trim() || process.env.NITRO_APP_BASE_URL?.trim();
	if (fromEnv) return fromEnv.startsWith("http") ? fromEnv.replace(/\/$/, "") : `https://${fromEnv}`;
	if (requestUrl) return new URL(requestUrl).origin;
	return "http://localhost:3000";
}
function authSecret() {
	const secret = getGoogleOAuthConfig()?.authSecret;
	if (!secret) throw new Error("AUTH_SECRET missing");
	return secret;
}
function signOAuthState(payload) {
	const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
	return `${data}.${createHmac("sha256", authSecret()).update(data).digest("base64url")}`;
}
function verifyOAuthState(state) {
	const [data, sig] = state.split(".");
	if (!data || !sig) return null;
	const expected = createHmac("sha256", authSecret()).update(data).digest("base64url");
	const a = Buffer.from(sig);
	const b = Buffer.from(expected);
	if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
	try {
		return JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
	} catch {
		return null;
	}
}
function buildGoogleAuthUrl(origin, memberId) {
	const cfg = getGoogleOAuthConfig();
	if (!cfg) return null;
	const redirectUri = `${origin}/api/auth/google/callback`;
	const state = signOAuthState({
		memberId,
		nonce: crypto.randomUUID()
	});
	return `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
		client_id: cfg.clientId,
		redirect_uri: redirectUri,
		response_type: "code",
		scope: [GOOGLE_CALENDAR_SCOPE, GOOGLE_EMAIL_SCOPE].join(" "),
		access_type: "offline",
		prompt: "consent",
		include_granted_scopes: "true",
		state
	}).toString()}`;
}
async function exchangeGoogleCode(code, origin) {
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
			grant_type: "authorization_code"
		})
	});
	if (!res.ok) throw new Error("google token exchange failed");
	return await res.json();
}
async function refreshGoogleAccessToken(refreshToken) {
	const cfg = getGoogleOAuthConfig();
	if (!cfg) throw new Error("Google OAuth not configured");
	const res = await fetch("https://oauth2.googleapis.com/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			client_id: cfg.clientId,
			client_secret: cfg.clientSecret,
			refresh_token: refreshToken,
			grant_type: "refresh_token"
		})
	});
	if (!res.ok) throw new Error("google token refresh failed");
	return await res.json();
}
async function fetchGoogleUserEmail(accessToken) {
	const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", { headers: { Authorization: `Bearer ${accessToken}` } });
	if (!res.ok) throw new Error("google userinfo failed");
	return (await res.json()).email ?? "unknown@gmail.com";
}
async function fetchGoogleCalendarList(accessToken) {
	const res = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", { headers: { Authorization: `Bearer ${accessToken}` } });
	if (!res.ok) throw new Error("google calendar list failed");
	return (await res.json()).items ?? [];
}
function parseGoogleEventDate(value) {
	if (!value) return null;
	if (value.dateTime) return new Date(value.dateTime);
	if (value.date) return /* @__PURE__ */ new Date(`${value.date}T00:00:00`);
	return null;
}
async function fetchGoogleCalendarEvents(accessToken, calendarId, rangeStart, rangeEnd) {
	const params = new URLSearchParams({
		timeMin: rangeStart.toISOString(),
		timeMax: rangeEnd.toISOString(),
		singleEvents: "true",
		orderBy: "startTime",
		maxResults: "250"
	});
	const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`, { headers: { Authorization: `Bearer ${accessToken}` } });
	if (!res.ok) return [];
	return (await res.json()).items ?? [];
}
async function getMemberAccessToken(connection) {
	if (connection.accessToken && connection.accessTokenExpiresAt && new Date(connection.accessTokenExpiresAt).getTime() > Date.now() + 6e4 && connection.accessToken) return connection.accessToken;
	const refreshed = await refreshGoogleAccessToken(connection.refreshToken);
	const accessToken = refreshed.access_token;
	const expiresAt = new Date(Date.now() + refreshed.expires_in * 1e3).toISOString();
	await updateMemberConnection(connection.memberId, (current) => {
		if (!current) return current;
		return {
			...current,
			accessToken,
			accessTokenExpiresAt: expiresAt
		};
	});
	return accessToken;
}
function googleEventToIsoRange(item) {
	const start = parseGoogleEventDate(item.start);
	if (!start) return null;
	const end = parseGoogleEventDate(item.end);
	return {
		start: start.toISOString(),
		end: end?.toISOString() ?? null
	};
}
//#endregion
export { fetchGoogleCalendarList as a, getGoogleOAuthConfig as c, publicMemberConnection as d, readCalendarConnectionsStore as f, verifyOAuthState as h, fetchGoogleCalendarEvents as i, getMemberAccessToken as l, upsertMemberConnection as m, buildGoogleAuthUrl as n, fetchGoogleUserEmail as o, updateMemberConnection as p, exchangeGoogleCode as r, getAppOrigin as s, DEFAULT_MEMBERS as t, googleEventToIsoRange as u };
