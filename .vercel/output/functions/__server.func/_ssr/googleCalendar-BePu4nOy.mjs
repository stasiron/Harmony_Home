//#region node_modules/.nitro/vite/services/ssr/assets/googleCalendar-BePu4nOy.js
/** Słowa w tytule wydarzenia (Google Calendar). */
var GUEST_TITLE_KEYWORDS = [
	"spotkanie",
	"meeting",
	"goście",
	"goscie",
	"wizyta",
	"visitors",
	"guest"
];
/**
* Kalendarz domu — env: GOOGLE_CALENDAR_ICAL_URL
* Konfiguracja: src/config/calendars/dom.ts
*/
function unfoldIcal(text) {
	return text.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
}
function extractField(block, name) {
	const re = new RegExp(`^${name}(?:;[^:]*)?:(.*)$`, "im");
	return block.match(re)?.[1]?.trim() ?? "";
}
function parseIcalDate(raw) {
	const value = raw.trim();
	if (/^\d{8}T\d{6}Z$/i.test(value)) {
		const y = value.slice(0, 4);
		const mo = value.slice(4, 6);
		const d = value.slice(6, 8);
		const h = value.slice(9, 11);
		const mi = value.slice(11, 13);
		const s = value.slice(13, 15);
		return /* @__PURE__ */ new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`);
	}
	if (/^\d{8}T\d{6}$/i.test(value)) {
		const y = value.slice(0, 4);
		const mo = value.slice(4, 6);
		const d = value.slice(6, 8);
		const h = value.slice(9, 11);
		const mi = value.slice(11, 13);
		const s = value.slice(13, 15);
		return /* @__PURE__ */ new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}`);
	}
	if (/^\d{8}$/i.test(value)) {
		const y = value.slice(0, 4);
		const mo = value.slice(4, 6);
		const d = value.slice(6, 8);
		return /* @__PURE__ */ new Date(`${y}-${mo}-${d}T00:00:00`);
	}
	return new Date(value);
}
function parseIcalEvents(ical) {
	const chunks = unfoldIcal(ical).split("BEGIN:VEVENT").slice(1);
	const events = [];
	for (const chunk of chunks) {
		const block = chunk.split("END:VEVENT")[0] ?? chunk;
		const startRaw = extractField(block, "DTSTART");
		if (!startRaw) continue;
		const endRaw = extractField(block, "DTEND");
		events.push({
			summary: extractField(block, "SUMMARY"),
			location: extractField(block, "LOCATION"),
			start: parseIcalDate(startRaw),
			end: endRaw ? parseIcalDate(endRaw) : null
		});
	}
	return events;
}
function normalizeCalendarText(value) {
	return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}
function isGuestCalendarEvent(summary, location) {
	const title = normalizeCalendarText(summary);
	const loc = normalizeCalendarText(location);
	if (GUEST_TITLE_KEYWORDS.some((k) => title.includes(normalizeCalendarText(k)))) return true;
	const hasAndersa = loc.includes("andersa");
	const hasCzestochowa = loc.includes("czestochowa");
	return hasAndersa && hasCzestochowa;
}
async function fetchGoogleCalendarIcal() {
	const icalUrl = process.env.GOOGLE_CALENDAR_ICAL_URL?.trim() || process.env.NITRO_GOOGLE_CALENDAR_ICAL_URL?.trim() || "";
	if (!icalUrl) return null;
	const res = await fetch(icalUrl, { headers: { Accept: "text/calendar" } });
	if (!res.ok) throw new Error("calendar fetch failed");
	return res.text();
}
function parseGoogleCalendarEvents(ical) {
	return parseIcalEvents(ical);
}
function eventOverlapsRange(start, end, rangeStart, rangeEnd) {
	const eventEnd = end ?? new Date(start.getTime() + 7200 * 1e3);
	return start.getTime() <= rangeEnd.getTime() && eventEnd.getTime() >= rangeStart.getTime();
}
function calendarEventId(summary, start) {
	return `${start.getTime()}-${summary}`;
}
//#endregion
export { parseGoogleCalendarEvents as a, isGuestCalendarEvent as i, eventOverlapsRange as n, fetchGoogleCalendarIcal as r, calendarEventId as t };
