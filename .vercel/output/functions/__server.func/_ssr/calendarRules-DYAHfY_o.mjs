import { t as DEFAULT_MEMBERS } from "./googleOAuth-CljKW4qe.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/calendarRules-DYAHfY_o.js
var aniaCalendars = {
	memberId: "member-2",
	matchRules: [],
	calendars: []
};
/**
* Wspólny kalendarz domu (goście, wydarzenia rodzinne).
* Używany też przez automatyczny tryb gości (`checkGuestCalendar`).
*/
var householdCalendar = {
	id: "household",
	label: "Kalendarz domu",
	display: "full",
	color: "primary",
	envKey: "GOOGLE_CALENDAR_ICAL_URL"
};
var MEMBER_CALENDAR_CONFIGS = [
	{
		memberId: "member-1",
		matchRules: [],
		calendars: []
	},
	aniaCalendars,
	{
		memberId: "member-3",
		matchRules: [
			{
				matchPattern: "zajęcia|zajecia|extra",
				label: "Zajęcia dodatkowe",
				display: "full",
				color: "chart-3"
			},
			{
				matchPattern: "wydarzenia|events?",
				label: "Wydarzenia",
				display: "full",
				color: "chart-5"
			},
			{
				matchPattern: "znajom|friends?|wyjścia|wyjscia",
				label: "Wyjścia ze znajomymi",
				display: "busy",
				color: "muted-foreground"
			}
		],
		calendars: [
			{
				id: "extra-classes",
				label: "Zajęcia dodatkowe",
				display: "full",
				color: "chart-3",
				envKey: "STAS_CAL_ZAJECIA_ICAL_URL"
			},
			{
				id: "events",
				label: "Wydarzenia",
				display: "full",
				color: "chart-5",
				envKey: "STAS_CAL_WYDARZENIA_ICAL_URL"
			},
			{
				id: "friends",
				label: "Wyjścia ze znajomymi",
				display: "busy",
				color: "muted-foreground",
				envKey: "STAS_CAL_ZNAJOMI_ICAL_URL"
			}
		]
	},
	{
		memberId: "member-4",
		matchRules: [],
		calendars: []
	}
];
/** Fallback iCal — tylko wpisy z env + kalendarz domu. */
function getIcalFallbackSources() {
	return [...MEMBER_CALENDAR_CONFIGS.flatMap((member) => {
		const memberName = DEFAULT_MEMBERS.find((u) => u.id === member.memberId)?.name ?? member.memberId;
		return (member.calendars ?? []).map((calendar) => ({
			...calendar,
			memberId: member.memberId,
			memberName
		}));
	}), {
		...householdCalendar,
		memberId: "household",
		memberName: "Dom"
	}];
}
var RULES_BY_MEMBER = new Map(MEMBER_CALENDAR_CONFIGS.map((member) => [member.memberId, member.matchRules ?? []]));
function memberName(memberId) {
	return DEFAULT_MEMBERS.find((m) => m.id === memberId)?.name ?? memberId;
}
function classifyGoogleCalendar(memberId, summary) {
	const rules = RULES_BY_MEMBER.get(memberId) ?? [];
	for (const rule of rules) if (new RegExp(rule.matchPattern, "i").test(summary)) return {
		label: rule.label,
		display: rule.display,
		color: rule.color
	};
	return {
		label: summary,
		display: "full",
		color: DEFAULT_MEMBERS.find((m) => m.id === memberId)?.color ?? "chart-1"
	};
}
//#endregion
export { getIcalFallbackSources as n, memberName as r, classifyGoogleCalendar as t };
