import { i as __toESM } from "../_runtime.mjs";
import { l as createServerFn } from "./esm-Dova13aH.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as useServerFn } from "./useServerFn-CrZF2pjq.mjs";
import { t as createSsrRpc } from "./createSsrRpc-CCoN_rBu.mjs";
import { n as useApp } from "./AppContext-CSDmHffq.mjs";
import { b as ChevronLeft, d as MapPin, r as Users, w as CalendarDays, x as ChevronDown, y as ChevronRight } from "../_libs/lucide-react.mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { i as cn, n as Shell, r as buttonVariants, t as Button } from "./Shell-JV0XcIcI.mjs";
import { F as addDays, h as format, j as startOfDay, n as startOfMonth, s as isToday, t as pl, u as isSameDay, w as endOfMonth } from "../_libs/date-fns.mjs";
import { n as getDefaultClassNames, t as DayPicker } from "../_libs/react-day-picker.mjs";
import { t as Root } from "../_libs/radix-ui__react-toggle.mjs";
import { n as ToggleGroupItem$1, t as ToggleGroup$1 } from "../_libs/radix-ui__react-toggle-group.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/calendar-CQAnO3hn.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Calendar$1({ className, classNames, showOutsideDays = true, captionLayout = "label", buttonVariant = "ghost", formatters, components, ...props }) {
	const defaultClassNames = getDefaultClassNames();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DayPicker, {
		showOutsideDays,
		className: cn("bg-background group/calendar p-3 [--cell-size:2rem] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent", String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`, String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`, className),
		captionLayout,
		formatters: {
			formatMonthDropdown: (date) => date.toLocaleString("default", { month: "short" }),
			...formatters
		},
		classNames: {
			root: cn("w-fit", defaultClassNames.root),
			months: cn("relative flex flex-col gap-4 md:flex-row", defaultClassNames.months),
			month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
			nav: cn("absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1", defaultClassNames.nav),
			button_previous: cn(buttonVariants({ variant: buttonVariant }), "h-(--cell-size) w-(--cell-size) select-none p-0 aria-disabled:opacity-50", defaultClassNames.button_previous),
			button_next: cn(buttonVariants({ variant: buttonVariant }), "h-(--cell-size) w-(--cell-size) select-none p-0 aria-disabled:opacity-50", defaultClassNames.button_next),
			month_caption: cn("flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)", defaultClassNames.month_caption),
			dropdowns: cn("flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium", defaultClassNames.dropdowns),
			dropdown_root: cn("has-focus:border-ring border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] relative rounded-md border", defaultClassNames.dropdown_root),
			dropdown: cn("bg-popover absolute inset-0 opacity-0", defaultClassNames.dropdown),
			caption_label: cn("select-none font-medium", captionLayout === "label" ? "text-sm" : "[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md pl-2 pr-1 text-sm [&>svg]:size-3.5", defaultClassNames.caption_label),
			table: "w-full border-collapse",
			weekdays: cn("flex", defaultClassNames.weekdays),
			weekday: cn("text-muted-foreground flex-1 select-none rounded-md text-[0.8rem] font-normal", defaultClassNames.weekday),
			week: cn("mt-2 flex w-full", defaultClassNames.week),
			week_number_header: cn("w-(--cell-size) select-none", defaultClassNames.week_number_header),
			week_number: cn("text-muted-foreground select-none text-[0.8rem]", defaultClassNames.week_number),
			day: cn("group/day relative aspect-square h-full w-full select-none p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md", defaultClassNames.day),
			range_start: cn("bg-accent rounded-l-md", defaultClassNames.range_start),
			range_middle: cn("rounded-none", defaultClassNames.range_middle),
			range_end: cn("bg-accent rounded-r-md", defaultClassNames.range_end),
			today: cn("bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none", defaultClassNames.today),
			outside: cn("text-muted-foreground aria-selected:text-muted-foreground", defaultClassNames.outside),
			disabled: cn("text-muted-foreground opacity-50", defaultClassNames.disabled),
			hidden: cn("invisible", defaultClassNames.hidden),
			...classNames
		},
		components: {
			Root: ({ className, rootRef, ...props }) => {
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					"data-slot": "calendar",
					ref: rootRef,
					className: cn(className),
					...props
				});
			},
			Chevron: ({ className, orientation, ...props }) => {
				if (orientation === "left") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
					className: cn("size-4", className),
					...props
				});
				if (orientation === "right") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
					className: cn("size-4", className),
					...props
				});
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
					className: cn("size-4", className),
					...props
				});
			},
			DayButton: CalendarDayButton,
			WeekNumber: ({ children, ...props }) => {
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					...props,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex size-(--cell-size) items-center justify-center text-center",
						children
					})
				});
			},
			...components
		},
		...props
	});
}
function CalendarDayButton({ className, day, modifiers, ...props }) {
	const defaultClassNames = getDefaultClassNames();
	const ref = import_react.useRef(null);
	import_react.useEffect(() => {
		if (modifiers.focused) ref.current?.focus();
	}, [modifiers.focused]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		ref,
		variant: "ghost",
		size: "icon",
		"data-day": day.date.toLocaleDateString(),
		"data-selected-single": modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle,
		"data-range-start": modifiers.range_start,
		"data-range-end": modifiers.range_end,
		"data-range-middle": modifiers.range_middle,
		className: cn("data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 flex aspect-square h-auto w-full min-w-(--cell-size) flex-col gap-1 font-normal leading-none data-[range-end=true]:rounded-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] [&>span]:text-xs [&>span]:opacity-70", defaultClassNames.day, className),
		...props
	});
}
function daysSinceOnDate(task, date) {
	const day = startOfDay(date).getTime();
	const completed = startOfDay(new Date(task.lastCompleted)).getTime();
	return Math.floor((day - completed) / (1e3 * 60 * 60 * 24));
}
function statusOfTaskOnDate(task, date, guestsMode = false) {
	const d = daysSinceOnDate(task, date);
	if (guestsMode && task.isGuestPriority) return "must";
	if (d < task.tMin) return "done";
	if (d >= task.tMax) return "must";
	if (d >= task.tSuggested) return "suggested";
	return "safe";
}
function choresDueOnDate(tasks, date, guestsMode = false) {
	return tasks.filter((task) => {
		const status = statusOfTaskOnDate(task, date, guestsMode);
		return status === "must" || status === "suggested";
	});
}
function dateHasChoreDue(tasks, date, guestsMode = false) {
	return choresDueOnDate(tasks, date, guestsMode).length > 0;
}
function guestPlansOnDate(plans, date) {
	return plans.filter((plan) => isSameDay(new Date(plan.when), date));
}
var DAY_HOUR_LABELS = Array.from({ length: 18 }, (_, i) => 6 + i);
function dayWindowStart(day) {
	const start = startOfDay(day);
	start.setHours(6, 0, 0, 0);
	return start;
}
function minutesInDayWindow(date, day) {
	return (date.getTime() - dayWindowStart(day).getTime()) / 6e4;
}
function topPxForDate(date, day) {
	const mins = minutesInDayWindow(date, day);
	return Math.max(0, Math.min(mins, 1079)) / 60 * 52;
}
function heightPxForMinutes(minutes, minPx = 28) {
	return Math.max(minutes / 60 * 52, minPx);
}
function formatHourLabel(hour) {
	return `${String(hour).padStart(2, "0")}:00`;
}
function isAllDayEvent(startIso, endIso, day) {
	const start = new Date(startIso);
	if (!endIso) return start.getHours() < 6;
	return (new Date(endIso).getTime() - start.getTime()) / 6e4 >= 720 || start.getHours() < 6;
}
function eventDurationMinutes(startIso, endIso) {
	const start = new Date(startIso);
	if (!endIso) return 60;
	const end = new Date(endIso);
	return Math.max(15, (end.getTime() - start.getTime()) / 6e4);
}
function currentTimeTopPx(day, now) {
	if (startOfDay(day).getTime() !== startOfDay(now).getTime()) return null;
	const mins = minutesInDayWindow(now, day);
	if (mins < 0 || mins > 1080) return null;
	return mins / 60 * 52;
}
function DayColumn({ day, events, chores, guestPlans, guestsMode, users }) {
	const today = isToday(day);
	const [now, setNow] = (0, import_react.useState)(() => /* @__PURE__ */ new Date());
	(0, import_react.useEffect)(() => {
		if (!today) return;
		const id = setInterval(() => setNow(/* @__PURE__ */ new Date()), 6e4);
		return () => clearInterval(id);
	}, [today]);
	const { allDayEvents, timedEvents, timedPlans } = (0, import_react.useMemo)(() => {
		const allDay = [];
		const timed = [];
		for (const event of events) if (isAllDayEvent(event.start, event.end, day)) allDay.push(event);
		else timed.push(event);
		return {
			allDayEvents: allDay,
			timedEvents: timed,
			timedPlans: guestPlans.filter((p) => !isAllDayEvent(p.when, null, day))
		};
	}, [
		events,
		guestPlans,
		day
	]);
	const allDayPlans = guestPlans.filter((p) => isAllDayEvent(p.when, null, day));
	const hasAllDay = allDayEvents.length > 0 || chores.length > 0 || allDayPlans.length > 0;
	const nowLineTop = currentTimeTopPx(day, now);
	const hasAnything = events.length > 0 || chores.length > 0 || guestPlans.length > 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: cn("flex flex-col overflow-hidden rounded-3xl border bg-gradient-to-br from-surface-elevated via-surface to-card shadow-elevated", today ? "border-primary/40 ring-2 ring-primary/15" : "border-border"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "shrink-0 border-b border-border px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground",
					children: format(day, "EEE", { locale: pl })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: cn("text-2xl font-semibold tabular-nums", today && "text-primary"),
					children: format(day, "d MMM", { locale: pl })
				})]
			}),
			hasAllDay && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "shrink-0 space-y-1.5 border-b border-border bg-surface/60 px-3 py-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
					children: "Cały dzień"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-1",
					children: [
						allDayEvents.map((event) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AllDayChip, { event }, event.id)),
						chores.map((task) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AllDayChoreChip, {
							label: task.name,
							urgent: statusOfTaskOnDate(task, day, guestsMode) === "must",
							sub: users.find((u) => u.id === task.assignedTo)?.name
						}, task.id)),
						allDayPlans.map((plan) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AllDayChoreChip, {
							label: plan.notes || "Plan gości",
							tone: "guest"
						}, plan.id))
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex min-h-0 flex-1 overflow-y-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex w-full min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "relative w-11 shrink-0 border-r border-border/60 bg-surface/40",
						style: { height: 936 },
						children: DAY_HOUR_LABELS.map((hour) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "absolute right-2 -translate-y-1/2 text-[10px] tabular-nums text-muted-foreground",
							style: { top: (hour - 6) * (936 / DAY_HOUR_LABELS.length) },
							children: formatHourLabel(hour)
						}, hour))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative min-w-0 flex-1",
						style: { height: 936 },
						children: [
							DAY_HOUR_LABELS.map((hour) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "absolute inset-x-0 border-t border-border/40",
								style: { top: (hour - 6) * (936 / DAY_HOUR_LABELS.length) }
							}, hour)),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "absolute inset-x-0 border-t border-border/60",
								style: { top: 936 }
							}),
							nowLineTop !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "pointer-events-none absolute inset-x-0 z-20 flex items-center",
								style: { top: nowLineTop },
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "size-2 -translate-x-1/2 rounded-full bg-alert" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-px flex-1 bg-alert/80" })]
							}),
							!hasAnything && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "absolute inset-0 flex items-center justify-center p-4 text-center text-xs text-muted-foreground",
								children: "Brak zaplanowanych rzeczy"
							}),
							timedEvents.map((event) => {
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TimedBlock, {
									event,
									top: topPxForDate(new Date(event.start), day),
									height: heightPxForMinutes(eventDurationMinutes(event.start, event.end)),
									time: format(new Date(event.start), "HH:mm", { locale: pl })
								}, event.id);
							}),
							timedPlans.map((plan) => {
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TimedBlock, {
									top: topPxForDate(new Date(plan.when), day),
									height: heightPxForMinutes(60),
									title: plan.notes || "Plan gości",
									time: format(new Date(plan.when), "HH:mm", { locale: pl }),
									tone: "guest"
								}, plan.id);
							})
						]
					})]
				})
			})
		]
	});
}
function AllDayChoreChip({ label, sub, urgent, tone }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("rounded-lg px-2 py-1 text-[11px] leading-snug", tone === "guest" && "bg-accent/15 text-foreground", tone !== "guest" && urgent && "bg-alert/15 text-foreground", tone !== "guest" && !urgent && "bg-warn/15 text-foreground"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-medium",
			children: label
		}), sub && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "ml-1 text-muted-foreground",
			children: ["· ", sub]
		})]
	});
}
function AllDayChip({ event }) {
	const isBusy = event.display === "busy";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("rounded-lg px-2 py-1 text-[11px] leading-snug", isBusy && "border border-dashed border-border bg-muted/40", !isBusy && event.isGuest && "bg-accent/15 ring-1 ring-accent/40", !isBusy && !event.isGuest && "bg-primary/15"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-medium",
			children: event.summary
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "ml-1 text-muted-foreground",
			children: [
				"· ",
				event.calendarLabel,
				!isBusy && event.memberName !== "Dom" ? ` · ${event.memberName}` : ""
			]
		})]
	});
}
function TimedBlock({ event, top, height, time }) {
	const isBusy = event.display === "busy";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("absolute right-1 left-1 z-10 overflow-hidden rounded-lg border px-2 py-1 text-[11px] leading-tight shadow-sm", isBusy && "border-border/70 bg-muted/35", !isBusy && event.isGuest && "border-accent/40 bg-accent/20", !isBusy && !event.isGuest && "border-primary/30 bg-primary/20"),
		style: {
			top,
			height,
			...isBusy ? { backgroundImage: "repeating-linear-gradient(-45deg, transparent, transparent 4px, color-mix(in oklch, var(--muted) 35%, transparent) 4px, color-mix(in oklch, var(--muted) 35%, transparent) 8px)" } : {}
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", {
				className: "text-[10px] tabular-nums text-muted-foreground",
				children: time
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-medium",
				children: event.summary
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "truncate text-[10px] text-muted-foreground",
				children: [event.calendarLabel, !isBusy && event.memberName !== "Dom" ? ` · ${event.memberName}` : ""]
			})
		]
	});
}
var toggleVariants = cva("inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-transparent",
			outline: "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground"
		},
		size: {
			default: "h-9 px-2 min-w-9",
			sm: "h-8 px-1.5 min-w-8",
			lg: "h-10 px-2.5 min-w-10"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Toggle = import_react.forwardRef(({ className, variant, size, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Root, {
	ref,
	className: cn(toggleVariants({
		variant,
		size,
		className
	})),
	...props
}));
Toggle.displayName = Root.displayName;
var ToggleGroupContext = import_react.createContext({
	size: "default",
	variant: "default"
});
var ToggleGroup = import_react.forwardRef(({ className, variant, size, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleGroup$1, {
	ref,
	className: cn("flex items-center justify-center gap-1", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleGroupContext.Provider, {
		value: {
			variant,
			size
		},
		children
	})
}));
ToggleGroup.displayName = ToggleGroup$1.displayName;
var ToggleGroupItem = import_react.forwardRef(({ className, children, variant, size, ...props }, ref) => {
	const context = import_react.useContext(ToggleGroupContext);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleGroupItem$1, {
		ref,
		className: cn(toggleVariants({
			variant: context.variant || variant,
			size: context.size || size
		}), className),
		...props,
		children
	});
});
ToggleGroupItem.displayName = ToggleGroupItem$1.displayName;
var CALENDAR_VIEW_OPTIONS = [
	{
		value: "3",
		label: "3 dni"
	},
	{
		value: "7",
		label: "7 dni"
	},
	{
		value: "14",
		label: "14 dni"
	},
	{
		value: "month",
		label: "Miesiąc"
	}
];
function getViewRange(mode, anchor) {
	if (mode === "month") {
		const from = startOfMonth(anchor);
		from.setDate(from.getDate() - 7);
		const to = endOfMonth(anchor);
		to.setHours(23, 59, 59, 999);
		to.setDate(to.getDate() + 7);
		return {
			from,
			to
		};
	}
	const from = startOfDay(anchor);
	const to = addDays(from, Number(mode) - 1);
	to.setHours(23, 59, 59, 999);
	return {
		from,
		to
	};
}
function getDaysInView(mode, anchor) {
	if (mode === "month") return [];
	const from = startOfDay(anchor);
	return Array.from({ length: Number(mode) }, (_, i) => addDays(from, i));
}
function shiftAnchor(mode, anchor, direction) {
	if (mode === "month") {
		const next = new Date(anchor);
		next.setMonth(next.getMonth() + direction);
		return next;
	}
	return addDays(anchor, Number(mode) * direction);
}
function formatRangeLabel(mode, anchor) {
	if (mode === "month") return format(anchor, "LLLL yyyy", { locale: pl });
	const { from, to } = getViewRange(mode, anchor);
	if (from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear()) return `${format(from, "d", { locale: pl })}–${format(to, "d MMMM yyyy", { locale: pl })}`;
	return `${format(from, "d MMM", { locale: pl })} – ${format(to, "d MMM yyyy", { locale: pl })}`;
}
var fetchCalendarEvents = createServerFn({ method: "POST" }).validator((data) => data).handler(createSsrRpc("c0212ebf73af9bfdfe0016f16cce82c9cd95f806d5a764ef60794721c5c47680"));
function eventsOnDay(events, day) {
	return events.filter((e) => isSameDay(new Date(e.start), day));
}
function formatEventTime(iso) {
	return format(new Date(iso), "HH:mm", { locale: pl });
}
function HouseholdCalendar() {
	const { tasks, guestPlans, guestsMode, users } = useApp();
	const loadEvents = useServerFn(fetchCalendarEvents);
	const [viewMode, setViewMode] = (0, import_react.useState)("3");
	const [anchor, setAnchor] = (0, import_react.useState)(() => {
		const d = /* @__PURE__ */ new Date();
		d.setHours(0, 0, 0, 0);
		return d;
	});
	const [selected, setSelected] = (0, import_react.useState)(() => /* @__PURE__ */ new Date());
	const [events, setEvents] = (0, import_react.useState)([]);
	const [configured, setConfigured] = (0, import_react.useState)(false);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [error, setError] = (0, import_react.useState)(false);
	const range = (0, import_react.useMemo)(() => getViewRange(viewMode, anchor), [viewMode, anchor]);
	const daysInView = (0, import_react.useMemo)(() => getDaysInView(viewMode, anchor), [viewMode, anchor]);
	const rangeLabel = (0, import_react.useMemo)(() => formatRangeLabel(viewMode, anchor), [viewMode, anchor]);
	const refresh = (0, import_react.useCallback)(async () => {
		setLoading(true);
		setError(false);
		try {
			const result = await loadEvents({ data: {
				from: range.from.toISOString(),
				to: range.to.toISOString()
			} });
			setEvents(result.events);
			setConfigured(result.configured);
		} catch {
			setError(true);
		} finally {
			setLoading(false);
		}
	}, [
		loadEvents,
		range.from,
		range.to
	]);
	(0, import_react.useEffect)(() => {
		refresh();
	}, [refresh]);
	const handleViewChange = (value) => {
		if (!value) return;
		const mode = value;
		setViewMode(mode);
		if (mode === "month") setAnchor(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
		else {
			const today = /* @__PURE__ */ new Date();
			today.setHours(0, 0, 0, 0);
			setAnchor(today);
			setSelected(today);
		}
	};
	const selectedDay = selected ?? /* @__PURE__ */ new Date();
	const dayEvents = (0, import_react.useMemo)(() => eventsOnDay(events, selectedDay), [events, selectedDay]);
	const dayChores = (0, import_react.useMemo)(() => choresDueOnDate(tasks, selectedDay, guestsMode), [
		tasks,
		selectedDay,
		guestsMode
	]);
	const dayGuestPlans = (0, import_react.useMemo)(() => guestPlansOnDate(guestPlans, selectedDay), [guestPlans, selectedDay]);
	const modifiers = (0, import_react.useMemo)(() => ({
		google: (day) => eventsOnDay(events, day).length > 0,
		guest: (day) => eventsOnDay(events, day).some((e) => e.isGuest),
		chore: (day) => dateHasChoreDue(tasks, day, guestsMode),
		plan: (day) => guestPlansOnDate(guestPlans, day).length > 0
	}), [
		events,
		tasks,
		guestPlans,
		guestsMode
	]);
	const modifiersClassNames = {
		google: "[&_button]:relative [&_button]:after:absolute [&_button]:after:bottom-1 [&_button]:after:left-1/2 [&_button]:after:size-1.5 [&_button]:after:-translate-x-1/2 [&_button]:after:rounded-full [&_button]:after:bg-primary",
		guest: "[&_button]:ring-1 [&_button]:ring-accent/50 [&_button]:after:bg-accent",
		chore: "[&_button]:before:absolute [&_button]:before:bottom-1 [&_button]:before:right-1/2 [&_button]:before:mr-2 [&_button]:before:size-1.5 [&_button]:before:rounded-full [&_button]:before:bg-warn [&_button]:before:content-['']",
		plan: "[&_button]:bg-accent/10"
	};
	const isMonthView = viewMode === "month";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							size: "icon",
							className: "shrink-0 rounded-xl",
							onClick: () => setAnchor((prev) => shiftAnchor(viewMode, prev, -1)),
							"aria-label": "Poprzedni okres",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "min-w-[10rem] text-center text-lg font-semibold capitalize tracking-tight",
							children: rangeLabel
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							size: "icon",
							className: "shrink-0 rounded-xl",
							onClick: () => setAnchor((prev) => shiftAnchor(viewMode, prev, 1)),
							"aria-label": "Następny okres",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleGroup, {
					type: "single",
					value: viewMode,
					onValueChange: handleViewChange,
					className: "rounded-2xl border border-border bg-surface p-1",
					children: CALENDAR_VIEW_OPTIONS.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleGroupItem, {
						value: opt.value,
						className: "rounded-xl px-3 text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
						children: opt.label
					}, opt.value))
				})]
			}),
			isMonthView ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarPanel, {
					configured,
					loading,
					error,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar$1, {
						mode: "single",
						selected,
						onSelect: setSelected,
						month: anchor,
						onMonthChange: setAnchor,
						locale: pl,
						modifiers,
						modifiersClassNames,
						className: "mx-auto w-full [--cell-size:2.75rem] sm:[--cell-size:3rem]"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DayDetailPanel, {
					day: selectedDay,
					events: dayEvents,
					chores: dayChores,
					guestPlans: dayGuestPlans,
					guestsMode,
					users
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: cn("grid items-start gap-3", viewMode === "3" && "grid-cols-1 md:grid-cols-3", viewMode === "7" && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7", viewMode === "14" && "grid-flow-col auto-cols-[minmax(220px,1fr)] grid-cols-none overflow-x-auto pb-2"),
				children: daysInView.map((day) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DayColumn, {
					day,
					events: eventsOnDay(events, day),
					chores: choresDueOnDate(tasks, day, guestsMode),
					guestPlans: guestPlansOnDate(guestPlans, day),
					guestsMode,
					users
				}, day.toISOString()))
			}),
			!isMonthView && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarFooter, {
				configured,
				loading,
				error
			})
		]
	});
}
function CalendarPanel({ children, configured, loading, error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-3xl border border-border bg-gradient-to-br from-surface-elevated via-surface to-card p-4 shadow-elevated sm:p-6",
		children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarFooter, {
			configured,
			loading,
			error
		})]
	});
}
function CalendarFooter({ configured, loading, error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex flex-wrap gap-4 border-t border-border pt-4 text-xs text-muted-foreground",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LegendDot, {
					className: "bg-primary",
					label: "Google Calendar"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LegendDot, {
					className: "bg-accent ring-1 ring-accent/40",
					label: "Goście (auto)"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LegendDot, {
					className: "bg-warn",
					label: "Obowiązki"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LegendDot, {
					className: "bg-accent/30 ring-1 ring-accent/30",
					label: "Plan gości"
				})
			]
		}),
		!configured && !loading && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 space-y-2 rounded-2xl border border-dashed border-border bg-surface/50 px-4 py-3 text-sm text-muted-foreground",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-medium text-foreground",
				children: "Brak połączeń kalendarza"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
				"Idź do ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Ustawienia" }),
				" → Połącz Google dla każdego domownika. Albo ustaw iCal w ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
					className: "text-foreground",
					children: ".env"
				}),
				" (fallback)."
			] })]
		}),
		error && configured && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 rounded-2xl border border-alert/30 bg-alert/10 px-4 py-3 text-sm text-alert",
			children: "Nie udało się pobrać kalendarza. Sprawdź URL iCal."
		}),
		loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 text-center text-xs text-muted-foreground",
			children: "Ładowanie wydarzeń…"
		})
	] });
}
function DayDetailPanel({ day, events, chores, guestPlans, guestsMode, users }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "rounded-2xl border border-border bg-surface px-5 py-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "size-4" }), "Wybrany dzień"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-1 text-xl font-semibold capitalize tracking-tight",
					children: format(day, "EEEE, d MMMM yyyy", { locale: pl })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DaySection, {
				title: "Wydarzenia",
				count: events.length,
				empty: "Brak wydarzeń w kalendarzu.",
				children: events.map((event) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: cn("rounded-2xl border border-border bg-surface-elevated px-4 py-3", event.isGuest && "border-accent/40 bg-accent/10"),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-semibold leading-snug",
								children: event.summary
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", {
								className: "shrink-0 text-xs tabular-nums text-muted-foreground",
								children: formatEventTime(event.start)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-xs text-muted-foreground",
							children: [event.calendarLabel, event.memberName !== "Dom" ? ` · ${event.memberName}` : ""]
						}),
						event.location && event.display === "full" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 flex items-center gap-1.5 text-xs text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-3 shrink-0" }), event.location]
						}),
						event.isGuest && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 flex items-center gap-1 text-xs font-medium text-accent",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-3" }), "Tryb gości"]
						})
					]
				}, event.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DaySection, {
				title: "Obowiązki",
				count: chores.length,
				empty: "Na ten dzień nic pilnego.",
				children: chores.map((task) => {
					const status = statusOfTaskOnDate(task, day, guestsMode);
					const assignee = users.find((u) => u.id === task.assignedTo);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: cn("rounded-2xl border border-border bg-surface-elevated px-4 py-3", status === "must" && "border-alert/30 bg-alert/5"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-semibold",
								children: task.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", status === "must" ? "bg-alert/15 text-alert" : "bg-warn/15 text-warn"),
								children: status === "must" ? "pilne" : "sugerowane"
							})]
						}), assignee && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-muted-foreground",
							children: assignee.name
						})]
					}, task.id);
				})
			}),
			guestPlans.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DaySection, {
				title: "Plany gości",
				count: guestPlans.length,
				children: guestPlans.map((plan) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", {
						className: "text-xs text-muted-foreground",
						children: format(new Date(plan.when), "HH:mm", { locale: pl })
					}), plan.notes && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm",
						children: plan.notes
					})]
				}, plan.id))
			})
		]
	});
}
function LegendDot({ className, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "inline-flex items-center gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-2.5 rounded-full", className) }), label]
	});
}
function DaySection({ title, count, empty, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "space-y-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
			className: "text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground",
			children: [
				title,
				" · ",
				count
			]
		}), count === 0 && empty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "rounded-2xl border border-dashed border-border bg-surface/50 px-4 py-6 text-center text-sm text-muted-foreground",
			children: empty
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-2",
			children
		})]
	});
}
function CalendarPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-3xl font-semibold tracking-tight md:text-4xl",
			children: "Kalendarz"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-muted-foreground",
			children: "Domyślnie 3 dni — przełącz na 7, 14 lub cały miesiąc. Google Calendar, obowiązki i plany gości."
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HouseholdCalendar, {})]
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarPage, {}) });
//#endregion
export { SplitComponent as component };
