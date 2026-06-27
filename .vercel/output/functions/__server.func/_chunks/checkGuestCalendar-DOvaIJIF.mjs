import { i as TSS_SERVER_FUNCTION, l as createServerFn } from "../_ssr/esm-Dova13aH.mjs";
import { t as snakeCase } from "../_libs/scule.mjs";
//#region #nitro/virtual/runtime-config
var runtimeConfig = {
	"app": { "baseURL": "/" },
	"nitro": { "routeRules": { "/assets/**": { "headers": { "cache-control": "public, max-age=31536000, immutable" } } } },
	"googleCalendarIcalUrl": ""
};
//#endregion
//#region node_modules/nitro/dist/runtime/internal/runtime-config.mjs
function useRuntimeConfig() {
	return useRuntimeConfig._cached ||= getRuntimeConfig();
}
function getRuntimeConfig() {
	const env = globalThis.process?.env || {};
	applyEnv(runtimeConfig, {
		prefix: "NITRO_",
		altPrefix: runtimeConfig.nitro?.envPrefix ?? env?.NITRO_ENV_PREFIX ?? "_",
		envExpansion: Boolean(runtimeConfig.nitro?.envExpansion ?? env?.NITRO_ENV_EXPANSION ?? false)
	});
	return runtimeConfig;
}
function applyEnv(obj, opts, parentKey = "") {
	for (const key in obj) {
		const subKey = parentKey ? `${parentKey}_${key}` : key;
		const envValue = getEnv(subKey, opts);
		if (_isObject(obj[key])) if (_isObject(envValue)) {
			obj[key] = {
				...obj[key],
				...envValue
			};
			applyEnv(obj[key], opts, subKey);
		} else if (envValue === void 0) applyEnv(obj[key], opts, subKey);
		else obj[key] = envValue ?? obj[key];
		else obj[key] = envValue ?? obj[key];
		if (opts.envExpansion && typeof obj[key] === "string") obj[key] = _expandFromEnv(obj[key]);
	}
	return obj;
}
var envExpandRx = /\{\{([^{}]*)\}\}/g;
function _expandFromEnv(value) {
	return value.replace(envExpandRx, (match, key) => {
		return process.env[key] || match;
	});
}
function getEnv(key, opts) {
	const envKey = snakeCase(key).toUpperCase();
	return process.env[opts.prefix + envKey] ?? process.env[opts.altPrefix + envKey];
}
function _isObject(input) {
	return input !== null && typeof input === "object" && !Array.isArray(input);
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/checkGuestCalendar-DOvaIJIF.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
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
* Ustaw w `.env`:
* GOOGLE_CALENDAR_ICAL_URL=https://calendar.google.com/calendar/ical/.../private-.../basic.ics
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
function normalize(value) {
	return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}
function isGuestEvent(summary, location) {
	const title = normalize(summary);
	const loc = normalize(location);
	if (GUEST_TITLE_KEYWORDS.some((k) => title.includes(normalize(k)))) return true;
	const hasAndersa = loc.includes("andersa");
	const hasCzestochowa = loc.includes("czestochowa");
	return hasAndersa && hasCzestochowa;
}
function isGuestWindowActive(start, end, now) {
	const leadMs = 1440 * 60 * 1e3;
	const tailMs = 10800 * 1e3;
	const startMs = start.getTime();
	const endMs = (end ?? new Date(startMs + 7200 * 1e3)).getTime();
	return now >= startMs - leadMs && now <= endMs + tailMs;
}
function resolveIcalUrl() {
	const direct = process.env.GOOGLE_CALENDAR_ICAL_URL?.trim();
	if (direct) return direct;
	try {
		return useRuntimeConfig().googleCalendarIcalUrl?.trim() ?? "";
	} catch {
		return "";
	}
}
var checkGuestCalendar_createServerFn_handler = createServerRpc({
	id: "73d61eab497ade0575f45a2623c1ae1954ba3019d69988096d65e4569ab3f488",
	name: "checkGuestCalendar",
	filename: "src/lib/checkGuestCalendar.ts"
}, (opts) => checkGuestCalendar.__executeServer(opts));
var checkGuestCalendar = createServerFn({ method: "GET" }).handler(checkGuestCalendar_createServerFn_handler, async () => {
	const icalUrl = resolveIcalUrl();
	if (!icalUrl) return {
		active: false,
		eventTitle: null,
		eventStart: null,
		configured: false
	};
	const res = await fetch(icalUrl, { headers: { Accept: "text/calendar" } });
	if (!res.ok) throw new Error("calendar fetch failed");
	const ical = await res.text();
	const now = Date.now();
	const next = parseIcalEvents(ical).filter((e) => isGuestEvent(e.summary, e.location)).filter((e) => isGuestWindowActive(e.start, e.end, now)).sort((a, b) => a.start.getTime() - b.start.getTime())[0];
	return {
		active: Boolean(next),
		eventTitle: next?.summary ?? null,
		eventStart: next?.start.toISOString() ?? null,
		configured: true
	};
});
//#endregion
export { checkGuestCalendar_createServerFn_handler };
