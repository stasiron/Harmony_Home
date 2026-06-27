import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as useApp } from "./AppContext-CSDmHffq.mjs";
import { E as Sparkles, m as Cpu } from "../_libs/lucide-react.mjs";
import { n as Shell } from "./Shell-JV0XcIcI.mjs";
import { t as Switch } from "./switch-CbqVEryT.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/smart-DNgynwOY.js
var import_jsx_runtime = require_jsx_runtime();
function SmartPage() {
	const { devices, triggerDevice, tasks } = useApp();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-3xl font-semibold tracking-tight md:text-4xl",
			children: "Smart Home"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-muted-foreground",
			children: "Devices from Home Assistant appear here and can update or create chores."
		})] }), devices.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cpu, {
					className: "mx-auto size-10 text-muted-foreground",
					strokeWidth: 1.4
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-lg font-semibold",
					children: "No devices connected"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Connect Home Assistant to sync vacuum, washer, sensors and other entities."
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
			children: devices.map((d) => {
				const linked = tasks.find((t) => t.id === d.linkedTaskId);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border border-border bg-surface p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 text-xs text-muted-foreground",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cpu, { className: "size-3.5" }),
										" ",
										d.room
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-1 truncate text-lg font-semibold",
									children: d.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-0.5 text-xs uppercase tracking-wider text-muted-foreground",
									children: d.type
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
							checked: d.triggered,
							onCheckedChange: () => triggerDevice(d.id)
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 space-y-2 border-t border-border pt-4 text-xs text-muted-foreground",
						children: [
							linked && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-3.5 text-primary" }),
									"Auto-completes: ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-medium text-foreground",
										children: linked.name
									})
								]
							}),
							d.generatesTask && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-3.5 text-accent" }),
									"Generates: ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-medium text-foreground",
										children: d.generatesTask
									})
								]
							}),
							!linked && !d.generatesTask && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "Sensor input only." })
						]
					})]
				}, d.id);
			})
		})]
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SmartPage, {}) });
//#endregion
export { SplitComponent as component };
