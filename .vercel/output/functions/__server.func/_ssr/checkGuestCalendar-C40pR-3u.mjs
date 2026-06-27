import { l as createServerFn } from "./esm-Dova13aH.mjs";
import { t as createServerRpc } from "./createServerRpc-WJgk8O8C.mjs";
import { a as parseGoogleCalendarEvents, i as isGuestCalendarEvent, r as fetchGoogleCalendarIcal } from "./googleCalendar-BePu4nOy.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/checkGuestCalendar-C40pR-3u.js
function isGuestWindowActive(start, end, now) {
	const leadMs = 1440 * 60 * 1e3;
	const tailMs = 10800 * 1e3;
	const startMs = start.getTime();
	const endMs = (end ?? new Date(startMs + 7200 * 1e3)).getTime();
	return now >= startMs - leadMs && now <= endMs + tailMs;
}
var checkGuestCalendar_createServerFn_handler = createServerRpc({
	id: "73d61eab497ade0575f45a2623c1ae1954ba3019d69988096d65e4569ab3f488",
	name: "checkGuestCalendar",
	filename: "src/lib/checkGuestCalendar.ts"
}, (opts) => checkGuestCalendar.__executeServer(opts));
var checkGuestCalendar = createServerFn({ method: "GET" }).handler(checkGuestCalendar_createServerFn_handler, async () => {
	const ical = await fetchGoogleCalendarIcal();
	if (!ical) return {
		active: false,
		eventTitle: null,
		eventStart: null,
		configured: false
	};
	const now = Date.now();
	const next = parseGoogleCalendarEvents(ical).filter((e) => isGuestCalendarEvent(e.summary, e.location)).filter((e) => isGuestWindowActive(e.start, e.end, now)).sort((a, b) => a.start.getTime() - b.start.getTime())[0];
	return {
		active: Boolean(next),
		eventTitle: next?.summary ?? null,
		eventStart: next?.start.toISOString() ?? null,
		configured: true
	};
});
//#endregion
export { checkGuestCalendar_createServerFn_handler };
