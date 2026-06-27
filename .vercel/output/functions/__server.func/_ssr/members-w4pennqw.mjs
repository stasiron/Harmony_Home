import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as useApp } from "./AppContext-CsJxkAiS.mjs";
import { f as Flame, i as UserPlus } from "../_libs/lucide-react.mjs";
import { i as cn, n as Shell, t as Button } from "./Shell-JV0XcIcI.mjs";
import { a as DialogHeader, n as DialogContent, o as DialogTitle, s as DialogTrigger, t as Dialog } from "./dialog-CKbASXWm.mjs";
import { n as Input, t as ChoreCard } from "./ChoreCard-ComAXW2B.mjs";
import { t as Label } from "./label-BuAXkWMP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/members-w4pennqw.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function MembersPage() {
	const { users, tasks, addUser, toggleUserHeavyDay, statusOf } = useApp();
	const [selectedId, setSelectedId] = (0, import_react.useState)(null);
	const [dialogOpen, setDialogOpen] = (0, import_react.useState)(false);
	const [name, setName] = (0, import_react.useState)("");
	const selected = users.find((u) => u.id === selectedId);
	const memberTasks = selected ? tasks.filter((t) => {
		if (t.assignedTo !== selected.id) return false;
		if (selected.heavyDay) return statusOf(t) === "must";
		return true;
	}) : [];
	const handleAddMember = () => {
		if (!name.trim()) return;
		addUser(name);
		setDialogOpen(false);
		setName("");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-3xl font-semibold tracking-tight md:text-4xl",
					children: "Household members"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: "Tap a person to see chores assigned to them."
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
				open: dialogOpen,
				onOpenChange: setDialogOpen,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "secondary",
						className: "shrink-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPlus, { className: "size-4" }), "Dodaj domownika"]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Dodaj domownika" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "member-name",
							children: "Imię"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "member-name",
							placeholder: "np. Ania",
							value: name,
							onChange: (e) => setName(e.target.value),
							onKeyDown: (e) => e.key === "Enter" && handleAddMember()
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "w-full",
						onClick: handleAddMember,
						disabled: !name.trim(),
						children: "Dodaj"
					})]
				})] })]
			})]
		}), users.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-lg font-semibold",
				children: "No members yet"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted-foreground",
				children: "Add household members to assign and track chores."
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "grid grid-cols-2 gap-3 md:grid-cols-4",
			children: users.map((user) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MemberCard, {
				user,
				taskCount: tasks.filter((t) => t.assignedTo === user.id).length,
				selected: selectedId === user.id,
				onSelect: () => setSelectedId((id) => id === user.id ? null : user.id)
			}, user.id))
		}), selected && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeavyDayToggle, {
					user: selected,
					onToggle: () => toggleUserHeavyDay(selected.id)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					className: "text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground",
					children: [
						selected.name,
						"'s chores · ",
						memberTasks.length
					]
				}),
				memberTasks.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-12 text-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted-foreground",
						children: [
							"No chores assigned to ",
							selected.name,
							"."
						]
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3",
					children: memberTasks.map((task) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChoreCard, { task }, task.id))
				})
			]
		})] })]
	});
}
function MemberCard({ user, taskCount, selected, onSelect }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: onSelect,
		className: cn("flex flex-col items-center justify-center gap-3 rounded-3xl border bg-gradient-to-br from-surface-elevated via-surface to-card p-6 shadow-elevated transition-transform hover:-translate-y-0.5", selected ? "border-primary/40 text-primary ring-2 ring-primary/20" : "border-border text-foreground hover:border-primary/20", !user.active && "opacity-60"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid size-16 place-items-center rounded-full bg-background/40 text-2xl font-semibold",
			style: { color: `var(--${user.color})` },
			children: user.avatar
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-lg font-semibold tracking-tight",
				children: user.name
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 text-xs text-muted-foreground",
				children: user.heavyDay ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-warn",
					children: "Heavy Day"
				}) : user.active ? `${taskCount} chore${taskCount === 1 ? "" : "s"}` : "Away"
			})]
		})]
	});
}
function HeavyDayToggle({ user, onToggle }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: onToggle,
		className: cn("flex w-full items-center justify-between rounded-2xl border border-border bg-surface px-5 py-4 text-left transition-colors", user.heavyDay && "border-warn/40 bg-warn/10"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid size-10 place-items-center rounded-xl bg-warn/15 text-warn",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, { className: "size-5" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "font-semibold",
				children: ["Heavy Day — ", user.name]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-xs text-muted-foreground",
				children: user.heavyDay ? "Tylko pilne obowiązki tej osoby" : "Odłóż mniej ważne zadania tej osoby na jutro"
			})] })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: cn("h-6 w-10 shrink-0 rounded-full bg-muted p-0.5 transition-colors", user.heavyDay && "bg-warn"),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn("h-5 w-5 rounded-full bg-background transition-transform", user.heavyDay && "translate-x-4") })
		})]
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MembersPage, {}) });
//#endregion
export { SplitComponent as component };
