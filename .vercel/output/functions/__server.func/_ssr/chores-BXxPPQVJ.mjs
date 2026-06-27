import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as useApp } from "./AppContext-CsJxkAiS.mjs";
import { S as Check, p as Download, r as Users, t as X, u as Plus, v as ChevronUp, x as ChevronDown } from "../_libs/lucide-react.mjs";
import { i as cn, n as Shell, t as Button } from "./Shell-JV0XcIcI.mjs";
import { a as DialogHeader, n as DialogContent, o as DialogTitle, s as DialogTrigger, t as Dialog } from "./dialog-CKbASXWm.mjs";
import { a as roomLabel, i as pinForRoom, n as Input, r as ROOM_OPTIONS, t as ChoreCard } from "./ChoreCard-ComAXW2B.mjs";
import { t as Label } from "./label-BuAXkWMP.mjs";
import { a as SelectItemIndicator, c as SelectPortal, d as SelectSeparator$1, f as SelectTrigger$1, i as SelectItem$1, l as SelectScrollDownButton$1, m as SelectViewport, n as SelectContent$1, o as SelectItemText, p as SelectValue$1, r as SelectIcon, s as SelectLabel$1, t as Select$1, u as SelectScrollUpButton$1 } from "../_libs/@radix-ui/react-select+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/chores-BXxPPQVJ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var FLOOR_PLAN_SRC = "/images/apartment-floor-plan.png";
function MapPinPicker({ pins, onChange, className }) {
	const addPin = (e) => {
		if (e.target.closest("[data-pin-remove]")) return;
		const rect = e.currentTarget.getBoundingClientRect();
		const x = Math.round((e.clientX - rect.left) / rect.width * 1e3) / 10;
		const y = Math.round((e.clientY - rect.top) / rect.height * 1e3) / 10;
		onChange([...pins, {
			x,
			y
		}]);
	};
	const removePin = (index) => {
		onChange(pins.filter((_, i) => i !== index));
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("space-y-2", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: "Kliknij plan — dodaj pinezkę. Możesz dodać kilka."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				role: "button",
				tabIndex: 0,
				onClick: addPin,
				onKeyDown: () => {},
				className: "relative cursor-crosshair overflow-hidden rounded-2xl border border-dashed border-primary/40 bg-surface",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: FLOOR_PLAN_SRC,
					alt: "",
					className: "pointer-events-none block h-auto w-full select-none"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "pointer-events-none absolute inset-0",
					children: pins.map((pin, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2",
						style: {
							left: `${pin.x}%`,
							top: `${pin.y}%`
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative grid size-7 place-items-center rounded-full border-2 border-primary bg-primary text-[10px] font-bold text-primary-foreground shadow-md",
							children: [index + 1, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"data-pin-remove": true,
								onClick: (e) => {
									e.stopPropagation();
									removePin(index);
								},
								className: "absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-destructive text-destructive-foreground",
								"aria-label": "Usuń pinezkę",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-2.5" })
							})]
						})
					}, `${pin.x}-${pin.y}-${index}`))
				})]
			}),
			pins.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => onChange([]),
				className: "text-xs text-muted-foreground underline-offset-2 hover:underline",
				children: [
					"Wyczyść pinezki (",
					pins.length,
					")"
				]
			})
		]
	});
}
var Select = Select$1;
var SelectValue = SelectValue$1;
var SelectTrigger = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectTrigger$1, {
	ref,
	className: cn("flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background cursor-pointer data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectIcon, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-4 w-4 opacity-50" })
	})]
}));
SelectTrigger.displayName = SelectTrigger$1.displayName;
var SelectScrollUpButton = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollUpButton$1, {
	ref,
	className: cn("flex cursor-default items-center justify-center py-1", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { className: "h-4 w-4" })
}));
SelectScrollUpButton.displayName = SelectScrollUpButton$1.displayName;
var SelectScrollDownButton = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollDownButton$1, {
	ref,
	className: cn("flex cursor-default items-center justify-center py-1", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-4 w-4" })
}));
SelectScrollDownButton.displayName = SelectScrollDownButton$1.displayName;
var SelectContent = import_react.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectPortal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent$1, {
	ref,
	className: cn("relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-select-content-transform-origin)", position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1", className),
	position,
	...props,
	children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollUpButton, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectViewport, {
			className: cn("p-1", position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"),
			children
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollDownButton, {})
	]
}) }));
SelectContent.displayName = SelectContent$1.displayName;
var SelectLabel = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectLabel$1, {
	ref,
	className: cn("px-2 py-1.5 text-sm font-semibold", className),
	...props
}));
SelectLabel.displayName = SelectLabel$1.displayName;
var SelectItem = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem$1, {
	ref,
	className: cn("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "absolute right-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItemIndicator, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }) })
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItemText, { children })]
}));
SelectItem.displayName = SelectItem$1.displayName;
var SelectSeparator = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectSeparator$1, {
	ref,
	className: cn("-mx-1 my-1 h-px bg-muted", className),
	...props
}));
SelectSeparator.displayName = SelectSeparator$1.displayName;
var Textarea = import_react.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		className: cn("flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
		ref,
		...props
	});
});
Textarea.displayName = "Textarea";
var UNASSIGNED = "__none__";
var emptyForm = {
	name: "",
	description: "",
	room: "kitchen",
	estimatedMinutes: "15",
	assignedTo: UNASSIGNED,
	mapPins: [],
	recurrence: "recurring"
};
function AddChoreDialog() {
	const { users, addTask } = useApp();
	const [open, setOpen] = (0, import_react.useState)(false);
	const [form, setForm] = (0, import_react.useState)(emptyForm);
	const reset = () => setForm(emptyForm);
	const handleSubmit = () => {
		const minutes = Number.parseInt(form.estimatedMinutes, 10);
		if (!form.name.trim() || Number.isNaN(minutes) || minutes < 1) return;
		addTask({
			name: form.name,
			description: form.description.trim() || void 0,
			room: form.room,
			estimatedMinutes: minutes,
			assignedTo: form.assignedTo === UNASSIGNED ? "" : form.assignedTo,
			mapPins: form.mapPins.length > 0 ? form.mapPins : void 0,
			recurrence: form.recurrence
		});
		setOpen(false);
		reset();
	};
	const minutes = Number.parseInt(form.estimatedMinutes, 10);
	const canSubmit = form.name.trim().length > 0 && !Number.isNaN(minutes) && minutes >= 1;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
		open,
		onOpenChange: (next) => {
			setOpen(next);
			if (!next) reset();
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "secondary",
				className: "shrink-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "Dodaj obowiązek"]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-h-[90vh] max-w-2xl overflow-y-auto",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Dodaj obowiązek" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "chore-name",
							children: "Nazwa"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "chore-name",
							placeholder: "np. Odkurz salon",
							value: form.name,
							onChange: (e) => setForm((f) => ({
								...f,
								name: e.target.value
							}))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "chore-desc",
							children: "Opis"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							id: "chore-desc",
							placeholder: "Szczegóły, co dokładnie zrobić…",
							rows: 2,
							value: form.description,
							onChange: (e) => setForm((f) => ({
								...f,
								description: e.target.value
							}))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-1 gap-3 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Pokój" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: form.room,
								onValueChange: (v) => setForm((f) => ({
									...f,
									room: v
								})),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: ROOM_OPTIONS.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: opt.value,
									children: opt.label
								}, opt.value)) })]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "chore-minutes",
								children: "Czas (min)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "chore-minutes",
								type: "number",
								min: 1,
								max: 480,
								value: form.estimatedMinutes,
								onChange: (e) => setForm((f) => ({
									...f,
									estimatedMinutes: e.target.value
								}))
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Powtarzalność" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: form.recurrence,
							onValueChange: (v) => setForm((f) => ({
								...f,
								recurrence: v
							})),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "recurring",
								children: "Powtarzalne"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "once",
								children: "Jednorazowe"
							})] })]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Osoba (opcjonalnie)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: form.assignedTo,
							onValueChange: (v) => setForm((f) => ({
								...f,
								assignedTo: v
							})),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Kto robi?" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: UNASSIGNED,
								children: "— Nikt —"
							}), users.map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: u.id,
								children: u.name
							}, u.id))] })]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPinPicker, {
						pins: form.mapPins,
						onChange: (mapPins) => setForm((f) => ({
							...f,
							mapPins
						}))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "w-full",
						onClick: handleSubmit,
						disabled: !canSubmit,
						children: "Dodaj"
					})
				]
			})]
		})]
	});
}
function buildChoreExport(tasks) {
	return {
		version: 1,
		exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
		tasks
	};
}
function downloadChoreExport(tasks) {
	const payload = buildChoreExport(tasks);
	const json = JSON.stringify(payload, null, 2);
	const blob = new Blob([json], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const stamp = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = `homeharmony-chores-${stamp}.json`;
	anchor.click();
	URL.revokeObjectURL(url);
}
function ExportChoresButton() {
	const { tasks } = useApp();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
		type: "button",
		variant: "outline",
		className: "shrink-0",
		onClick: () => downloadChoreExport(tasks),
		disabled: tasks.length === 0,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), "Eksportuj JSON"]
	});
}
var PIN_COLORS = {
	must: "bg-alert border-alert/60 text-alert-foreground",
	suggested: "bg-warn border-warn/60 text-warn-foreground",
	safe: "bg-safe border-safe/60 text-safe-foreground",
	done: "bg-muted border-border text-muted-foreground"
};
function resolvePins(tasks, statusOf) {
	const byRoom = /* @__PURE__ */ new Map();
	for (const task of tasks) {
		if (task.mapPins?.length) continue;
		const list = byRoom.get(task.room) ?? [];
		list.push(task);
		byRoom.set(task.room, list);
	}
	const result = [];
	for (const task of tasks) if (task.mapPins?.length) task.mapPins.forEach((pin, index) => {
		result.push({
			key: `${task.id}-pin-${index}`,
			task,
			x: pin.x,
			y: pin.y,
			status: statusOf(task)
		});
	});
	for (const [, roomTasks] of byRoom) roomTasks.forEach((task, index) => {
		const pos = pinForRoom(task.room, index, roomTasks.length);
		result.push({
			key: task.id,
			task,
			x: pos.x,
			y: pos.y,
			status: statusOf(task)
		});
	});
	return result;
}
function ApartmentMap({ tasks, statusOf }) {
	const pins = (0, import_react.useMemo)(() => resolvePins(tasks, statusOf), [tasks, statusOf]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "overflow-hidden rounded-3xl border border-border bg-surface shadow-elevated",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative w-full",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: FLOOR_PLAN_SRC,
				alt: "Plan mieszkania",
				className: "block h-auto w-full"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0",
				children: pins.map(({ key, task, x, y, status }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "group absolute -translate-x-1/2 -translate-y-full",
					style: {
						left: `${x}%`,
						top: `${y}%`
					},
					title: `${task.name} · ${roomLabel(task.room)}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: cn("grid size-8 place-items-center rounded-full border-2 text-[10px] font-bold shadow-lg transition-transform group-hover:scale-110", PIN_COLORS[status], status === "must" && "animate-pulse"),
						children: "!"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "pointer-events-none absolute left-1/2 top-full z-10 mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md group-hover:block",
						children: task.name
					})]
				}, key))
			})]
		})
	});
}
var STATUS_RANK = {
	must: 4,
	suggested: 3,
	safe: 2,
	done: 1
};
function taskImportance(task, status, guestsMode) {
	let score = STATUS_RANK[status] * 1e3;
	if (guestsMode && task.isGuestPriority) score += 5e3;
	if (status === "must" || status === "suggested") score += task.estimatedMinutes;
	return score;
}
function sortTasksByImportance(tasks, statusOf, guestsMode) {
	return [...tasks].sort((a, b) => {
		const diff = taskImportance(b, statusOf(b), guestsMode) - taskImportance(a, statusOf(a), guestsMode);
		return diff !== 0 ? diff : a.name.localeCompare(b.name, "pl");
	});
}
function ChoresPage() {
	const { visibleTasks, statusOf, guestsMode, guestCalendarHint, panic, users } = useApp();
	const heavyDayNames = users.filter((u) => u.heavyDay).map((u) => u.name);
	const sortedGuestTasks = sortTasksByImportance(visibleTasks, statusOf, true);
	const groups = [
		{
			key: "must",
			label: "Must do today",
			tasks: visibleTasks.filter((t) => statusOf(t) === "must")
		},
		{
			key: "suggested",
			label: "Suggested",
			tasks: visibleTasks.filter((t) => statusOf(t) === "suggested")
		},
		{
			key: "safe",
			label: "On track",
			tasks: visibleTasks.filter((t) => statusOf(t) === "safe")
		},
		{
			key: "done",
			label: "Recently done",
			tasks: visibleTasks.filter((t) => statusOf(t) === "done")
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ApartmentMap, {
				tasks: visibleTasks,
				statusOf
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-3xl font-semibold tracking-tight md:text-4xl",
							children: "Chores"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-sm text-muted-foreground",
							children: [
								"Dynamic intervals based on last completed.",
								heavyDayNames.length > 0 && ` · Heavy Day: ${heavyDayNames.join(", ")}`,
								panic?.active && " · Express blitz mode"
							]
						}),
						guestsMode && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 flex items-center gap-2 text-sm text-primary",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-4 shrink-0" }),
								"Tryb gości aktywny",
								guestCalendarHint ? ` · ${guestCalendarHint}` : ""
							]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex shrink-0 flex-wrap justify-end gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExportChoresButton, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AddChoreDialog, {})]
				})]
			}),
			visibleTasks.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyPanel, {
				title: "Brak obowiązków",
				description: "Dodaj pierwszy obowiązek przyciskiem powyżej."
			}) : guestsMode ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
				className: "mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground",
				children: ["Goście — od najważniejszych · ", sortedGuestTasks.length]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3",
				children: sortedGuestTasks.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChoreCard, { task: t }, t.id))
			})] }) : groups.map((g) => g.tasks.length === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
				className: "mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground",
				children: [
					g.label,
					" · ",
					g.tasks.length
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3",
				children: g.tasks.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChoreCard, { task: t }, t.id))
			})] }, g.key))
		]
	});
}
function EmptyPanel({ title, description }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-lg font-semibold",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm text-muted-foreground",
			children: description
		})]
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChoresPage, {}) });
//#endregion
export { SplitComponent as component };
