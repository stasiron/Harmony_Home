import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as useApp } from "./AppContext-CSDmHffq.mjs";
import { n as Shell } from "./Shell-JV0XcIcI.mjs";
import { a as XAxis, c as CartesianGrid, d as Tooltip, i as YAxis, l as Bar, n as BarChart, u as ResponsiveContainer } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/stats-F6VJeY89.js
var import_jsx_runtime = require_jsx_runtime();
function StatsPage() {
	const { users, tasks, daysSince } = useApp();
	const hasData = users.length > 0 && tasks.length > 0;
	const data = users.map((u, idx) => {
		const userTasks = tasks.filter((t) => t.assignedTo === u.id);
		const completedThisWeek = userTasks.filter((t) => daysSince(t.lastCompleted) <= 7).length;
		const minutes = userTasks.filter((t) => daysSince(t.lastCompleted) <= 7).reduce((acc, t) => acc + t.estimatedMinutes, 0);
		const completion = userTasks.length === 0 ? 0 : Math.round(completedThisWeek / userTasks.length * 100);
		return {
			name: u.name,
			Completed: completedThisWeek,
			Minutes: minutes,
			Completion: completion,
			fill: `var(--chart-${idx + 1})`
		};
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-3xl font-semibold tracking-tight md:text-4xl",
			children: "Household stats"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-muted-foreground",
			children: "A weekly look at who's pulling weight."
		})] }), !hasData ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-lg font-semibold",
				children: "No stats yet"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted-foreground",
				children: "Analytics appear once household members and chores are set up."
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-1 gap-4 md:grid-cols-3",
			children: data.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-border bg-surface p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-xs uppercase tracking-wider text-muted-foreground",
					children: d.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 grid grid-cols-3 gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Done",
							value: d.Completed
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Min",
							value: d.Minutes
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "%",
							value: d.Completion
						})
					]
				})]
			}, d.name))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-2xl border border-border bg-surface p-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground",
				children: "Minutes spent this week"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-72 w-full",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
					width: "100%",
					height: "100%",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
						data,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
								stroke: "var(--color-border)",
								strokeDasharray: "3 3",
								vertical: false
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
								dataKey: "name",
								stroke: "var(--color-muted-foreground)",
								fontSize: 12
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
								stroke: "var(--color-muted-foreground)",
								fontSize: 12
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { contentStyle: {
								background: "var(--color-popover)",
								border: "1px solid var(--color-border)",
								borderRadius: 12,
								fontSize: 12
							} }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
								dataKey: "Minutes",
								radius: [
									8,
									8,
									0,
									0
								],
								fill: "var(--color-primary)"
							})
						]
					})
				})
			})]
		})] })]
	});
}
function Stat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "tabular-clock text-2xl font-light",
		children: value
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "text-[10px] uppercase tracking-wider text-muted-foreground",
		children: label
	})] });
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatsPage, {}) });
//#endregion
export { SplitComponent as component };
