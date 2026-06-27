import { l as createServerFn } from "./esm-Dova13aH.mjs";
import { f as readCalendarConnectionsStore, i as fetchGoogleCalendarEvents, l as getMemberAccessToken, u as googleEventToIsoRange } from "./googleOAuth-8wiwlTph.mjs";
import { t as createServerRpc } from "./createServerRpc-WJgk8O8C.mjs";
import { a as parseGoogleCalendarEvents, i as isGuestCalendarEvent, n as eventOverlapsRange, t as calendarEventId } from "./googleCalendar-BePu4nOy.mjs";
import { n as getIcalFallbackSources, r as memberName } from "./calendarRules-UOuR3C_E.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/fetchCalendarEvents-DGfSTzO_.js
function resolveEnvCalendarUrl(envKey) {
	return process.env[envKey]?.trim() ?? "";
}
async function fetchIcalText(url) {
	const res = await fetch(url, { headers: { Accept: "text/calendar" } });
	if (!res.ok) throw new Error("calendar fetch failed");
	return res.text();
}
function displaySummary(summary, display) {
	if (display === "busy") return "Zajęty";
	return summary || "Wydarzenie";
}
function feedEventId(memberId, calendarKey, summary, start) {
	return `${memberId}:${calendarKey}:${calendarEventId(summary, start)}`;
}
function mapIcalSourceEvents(source, ical, rangeStart, rangeEnd) {
	return parseGoogleCalendarEvents(ical).filter((e) => eventOverlapsRange(e.start, e.end, rangeStart, rangeEnd)).map((e) => ({
		id: feedEventId(source.memberId, source.id, e.summary, e.start),
		summary: displaySummary(e.summary, source.display),
		location: source.display === "busy" ? "" : e.location,
		start: e.start.toISOString(),
		end: e.end?.toISOString() ?? null,
		isGuest: source.memberId === "household" && isGuestCalendarEvent(e.summary, e.location),
		memberId: source.memberId,
		memberName: source.memberName,
		calendarId: source.id,
		calendarLabel: source.label,
		display: source.display,
		color: source.color
	}));
}
async function fetchIcalSources(rangeStart, rangeEnd, sources) {
	const events = [];
	let anyUrl = false;
	await Promise.all(sources.map(async (source) => {
		const url = resolveEnvCalendarUrl(source.envKey);
		if (!url) return;
		anyUrl = true;
		try {
			const ical = await fetchIcalText(url);
			events.push(...mapIcalSourceEvents(source, ical, rangeStart, rangeEnd));
		} catch {}
	}));
	return anyUrl ? events : [];
}
function mapGoogleApiEvent(connection, calendar, item, start, end) {
	const summary = item.summary ?? "Wydarzenie";
	return {
		id: feedEventId(connection.memberId, calendar.googleCalendarId, summary, new Date(start)),
		summary: displaySummary(summary, calendar.display),
		location: calendar.display === "busy" ? "" : item.location ?? "",
		start,
		end,
		isGuest: false,
		memberId: connection.memberId,
		memberName: memberName(connection.memberId),
		calendarId: calendar.googleCalendarId,
		calendarLabel: calendar.label,
		display: calendar.display,
		color: calendar.color
	};
}
async function fetchOAuthMemberEvents(connection, rangeStart, rangeEnd) {
	const accessToken = await getMemberAccessToken(connection);
	const enabled = connection.calendars.filter((c) => c.enabled);
	const events = [];
	await Promise.all(enabled.map(async (calendar) => {
		const items = await fetchGoogleCalendarEvents(accessToken, calendar.googleCalendarId, rangeStart, rangeEnd);
		for (const item of items) {
			const range = googleEventToIsoRange(item);
			if (!range) continue;
			events.push(mapGoogleApiEvent(connection, calendar, item, range.start, range.end));
		}
	}));
	return events;
}
async function fetchAllMemberCalendarEvents(rangeStart, rangeEnd) {
	const store = await readCalendarConnectionsStore();
	const oauthMembers = Object.values(store.members);
	const events = [];
	for (const connection of oauthMembers) try {
		const memberEvents = await fetchOAuthMemberEvents(connection, rangeStart, rangeEnd);
		events.push(...memberEvents);
	} catch {}
	const icalEvents = await fetchIcalSources(rangeStart, rangeEnd, getIcalFallbackSources());
	events.push(...icalEvents);
	const hasIcalEnv = getIcalFallbackSources().some((s) => resolveEnvCalendarUrl(s.envKey));
	const configured = oauthMembers.length > 0 || hasIcalEnv;
	events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
	return {
		configured,
		events
	};
}
var fetchCalendarEvents_createServerFn_handler = createServerRpc({
	id: "c0212ebf73af9bfdfe0016f16cce82c9cd95f806d5a764ef60794721c5c47680",
	name: "fetchCalendarEvents",
	filename: "src/lib/fetchCalendarEvents.ts"
}, (opts) => fetchCalendarEvents.__executeServer(opts));
var fetchCalendarEvents = createServerFn({ method: "POST" }).validator((data) => data).handler(fetchCalendarEvents_createServerFn_handler, async ({ data }) => {
	return fetchAllMemberCalendarEvents(new Date(data.from), new Date(data.to));
});
//#endregion
export { fetchCalendarEvents_createServerFn_handler };
