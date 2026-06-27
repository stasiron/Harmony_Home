import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as useApp } from "./AppContext-CsJxkAiS.mjs";
import { S as Check, _ as Clock } from "../_libs/lucide-react.mjs";
import { i as cn } from "./Shell-JV0XcIcI.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ChoreCard-ComAXW2B.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Input = import_react.forwardRef(({ className, type, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type,
		className: cn("flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
		ref,
		...props
	});
});
Input.displayName = "Input";
var ROOM_OPTIONS = [
	{
		value: "living",
		label: "Salon"
	},
	{
		value: "dining",
		label: "Jadalnia"
	},
	{
		value: "kitchen",
		label: "Kuchnia"
	},
	{
		value: "bathroom",
		label: "Łazienka"
	},
	{
		value: "bedroom",
		label: "Sypialnia"
	},
	{
		value: "bedroom2",
		label: "Sypialnia 2"
	},
	{
		value: "hallway",
		label: "Przedpokój"
	},
	{
		value: "whole",
		label: "Cały dom"
	}
];
/** Pozycja pinezki na planie (% od lewego górnego rogu). */
var ROOM_PIN_POSITIONS = {
	living: {
		x: 20,
		y: 24
	},
	dining: {
		x: 20,
		y: 74
	},
	kitchen: {
		x: 44,
		y: 80
	},
	bathroom: {
		x: 44,
		y: 24
	},
	bedroom: {
		x: 82,
		y: 24
	},
	bedroom2: {
		x: 82,
		y: 74
	},
	hallway: {
		x: 52,
		y: 50
	},
	whole: {
		x: 50,
		y: 50
	}
};
function roomLabel(room) {
	return ROOM_OPTIONS.find((r) => r.value === room)?.label ?? room;
}
function pinForRoom(room, index, total) {
	const base = ROOM_PIN_POSITIONS[room];
	if (total <= 1) return base;
	const angle = index / total * Math.PI * 2 - Math.PI / 2;
	const radius = 2.8;
	return {
		x: base.x + Math.cos(angle) * radius,
		y: base.y + Math.sin(angle) * radius
	};
}
var statusStyles = {
	safe: "border-safe/30 bg-safe/5",
	suggested: "border-warn/40 bg-warn/10",
	must: "border-alert/40 bg-alert/10 alert-glow",
	done: "border-border bg-surface opacity-60"
};
var statusLabel = {
	safe: "On track",
	suggested: "Suggested",
	must: "Must do",
	done: "Done"
};
function ChoreCard({ task }) {
	const { users, statusOf, daysSince, completeTask } = useApp();
	const user = users.find((u) => u.id === task.assignedTo);
	const status = statusOf(task);
	const d = daysSince(task.lastCompleted);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex flex-col gap-3 rounded-2xl border p-5 transition-all", statusStyles[status]),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "truncate text-base font-semibold md:text-lg",
						children: task.name
					}),
					task.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 line-clamp-2 text-sm text-muted-foreground",
						children: task.description
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-3" }),
									" ",
									task.estimatedMinutes,
									" min"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								"Last: ",
								d,
								"d ago"
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: roomLabel(task.room) })
						]
					})
				]
			}), user && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: cn("grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold", "bg-background/40 text-foreground"),
				style: { color: `var(--${user.color})` },
				title: user.name,
				children: user.avatar
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn("rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider", status === "must" && "bg-alert/20 text-alert", status === "suggested" && "bg-warn/20 text-warn", status === "safe" && "bg-safe/20 text-safe", status === "done" && "bg-muted text-muted-foreground"),
					children: statusLabel[status]
				}), task.recurrence === "once" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground",
					children: "Jednorazowe"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => completeTask(task.id),
				className: "flex size-9 items-center justify-center rounded-full bg-foreground/10 text-foreground transition-colors hover:bg-primary hover:text-primary-foreground",
				"aria-label": "Mark done",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" })
			})]
		})]
	});
}
//#endregion
export { roomLabel as a, pinForRoom as i, Input as n, ROOM_OPTIONS as r, ChoreCard as t };
