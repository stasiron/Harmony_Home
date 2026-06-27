import { i as __toESM } from "../_runtime.mjs";
import { g as Link, l as useRouterState } from "../_libs/@tanstack/react-router+[...].mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as useApp } from "./AppContext-CsJxkAiS.mjs";
import { C as Calendar, D as OctagonAlert, O as House, T as CalendarCheck, a as Timer, c as ShoppingBasket, g as CloudRain, k as ChartColumn, l as Settings, m as Cpu, n as Wind, r as Users, s as Siren, t as X } from "../_libs/lucide-react.mjs";
import { i as cn, n as Shell, t as Button } from "./Shell-JV0XcIcI.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-CKbASXWm.mjs";
import { i as fetchCzestochowaWeather, l as weatherLabel, n as WEATHER_REFRESH_MS, t as WEATHER_CITY } from "./weather-0dinpoNJ.mjs";
import { t as WeatherIcon } from "./WeatherIcon-DiFpk1fb.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CQlWogeQ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var navItems = [
	{
		to: "/",
		label: "Home",
		icon: House
	},
	{
		to: "/calendar",
		label: "Kalendarz",
		icon: Calendar
	},
	{
		to: "/chores",
		label: "Chores",
		icon: CalendarCheck
	},
	{
		to: "/kitchen",
		label: "Kitchen",
		icon: ShoppingBasket
	},
	{
		to: "/smart",
		label: "Smart",
		icon: Cpu
	},
	{
		to: "/stats",
		label: "Stats",
		icon: ChartColumn
	},
	{
		to: "/settings",
		label: "Ustawienia",
		icon: Settings
	},
	{
		to: "/members",
		label: "Members",
		icon: Users,
		wide: true
	}
];
var navGridClass = "grid-cols-2 sm:grid-cols-2 md:grid-cols-4";
function isActive(pathname, to) {
	return to === "/" ? pathname === "/" : pathname.startsWith(to);
}
function MainNav({ compact = false }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		className: cn("grid gap-3", navGridClass),
		children: navItems.map(({ to, label, icon: Icon, wide }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavButton, {
			to,
			label,
			icon: Icon,
			active: isActive(pathname, to),
			compact,
			wide
		}, to))
	});
}
function NavButton({ to, label, icon: Icon, active, compact, wide }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		className: cn("group flex flex-col items-center justify-center gap-3 rounded-3xl border bg-gradient-to-br from-surface-elevated via-surface to-card shadow-elevated transition-transform hover:-translate-y-0.5", compact ? "min-h-[88px] p-4" : "min-h-[140px] p-6 sm:min-h-[160px]", wide && "col-span-2", active ? "border-primary/40 text-primary ring-2 ring-primary/20" : "border-border text-foreground hover:border-primary/20"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: cn("grid place-items-center rounded-2xl bg-background/40", compact ? "size-10" : "size-14"),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
				className: cn(compact ? "size-5" : "size-7"),
				strokeWidth: 1.6
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: cn("font-semibold tracking-tight", compact ? "text-sm" : "text-lg md:text-xl"),
			children: label
		})]
	});
}
function ClockWeather() {
	const [now, setNow] = (0, import_react.useState)(() => /* @__PURE__ */ new Date());
	const [weather, setWeather] = (0, import_react.useState)(null);
	const [weatherError, setWeatherError] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const id = setInterval(() => setNow(/* @__PURE__ */ new Date()), 1e3);
		return () => clearInterval(id);
	}, []);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		const load = async () => {
			try {
				const snapshot = await fetchCzestochowaWeather();
				if (!cancelled) {
					setWeather(snapshot);
					setWeatherError(false);
				}
			} catch {
				if (!cancelled) setWeatherError(true);
			}
		};
		load();
		const id = setInterval(load, WEATHER_REFRESH_MS);
		return () => {
			cancelled = true;
			clearInterval(id);
		};
	}, []);
	const time = now.toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false
	});
	const date = now.toLocaleDateString([], {
		weekday: "long",
		month: "long",
		day: "numeric"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-end",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "tabular-clock text-7xl font-extralight leading-none md:text-8xl lg:text-9xl",
			children: time
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-2 text-sm text-muted-foreground md:text-base",
			children: date
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/weather",
			className: cn("flex items-center gap-5 self-end rounded-3xl bg-surface px-6 py-4 transition-colors lg:justify-self-end", weather && "hover:bg-surface-elevated hover:ring-1 hover:ring-primary/20"),
			children: weather ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WeatherIcon, { code: weather.weatherCode }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-3xl font-light tabular-clock",
					children: [weather.temperature, "°"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-xs text-muted-foreground",
					children: [
						weatherLabel(weather.weatherCode),
						" · ",
						WEATHER_CITY
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-1 flex gap-3 text-[11px] text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-center gap-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wind, { className: "size-3" }),
							" ",
							weather.windSpeed,
							" km/h"
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-center gap-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloudRain, { className: "size-3" }),
							" ",
							weather.precipitationProbability,
							"%"
						]
					})]
				})
			] })] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "min-w-[10rem] text-sm text-muted-foreground",
				children: weatherError ? "Pogoda niedostępna" : "Ładowanie pogody…"
			})
		})]
	});
}
function StatusBanner() {
	const { guestsMode, alertCount, panic } = useApp();
	const items = [];
	if (panic?.active) items.push({
		key: "panic",
		text: `PANIC · guests in ${panic.minutes} min`,
		tone: "alert"
	});
	if (guestsMode) items.push({
		key: "guests",
		text: "Guests Mode Active",
		tone: "accent"
	});
	if (alertCount > 0) items.push({
		key: "alert",
		text: `${alertCount} Red Alert${alertCount > 1 ? "s" : ""}`,
		tone: "alert"
	});
	if (items.length === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-wrap gap-2",
		children: items.map((it) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider " + (it.tone === "alert" ? "bg-alert/15 text-alert alert-glow" : it.tone === "warn" ? "bg-warn/15 text-warn" : "bg-accent/20 text-accent"),
			children: [it.key === "guests" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OctagonAlert, { className: "size-4" }), it.text]
		}, it.key))
	});
}
function QuickActions() {
	const { panic, startPanic, endPanic, visibleTasks } = useApp();
	const [open, setOpen] = (0, import_react.useState)(false);
	const [remaining, setRemaining] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		if (!panic?.active) return;
		const end = new Date(panic.startedAt).getTime() + panic.minutes * 60 * 1e3;
		const tick = () => setRemaining(Math.max(0, Math.floor((end - Date.now()) / 1e3)));
		tick();
		const id = setInterval(tick, 1e3);
		return () => clearInterval(id);
	}, [panic]);
	const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid grid-cols-1 gap-3",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			onClick: () => setOpen(true),
			className: "group flex items-center justify-between rounded-2xl border border-alert/30 bg-alert/10 px-5 py-4 text-left transition-colors hover:bg-alert/15 alert-glow",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid size-10 place-items-center rounded-xl bg-alert/20 text-alert",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Siren, { className: "size-5" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "font-semibold text-alert",
					children: "Guests Panic Button"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-xs text-muted-foreground",
					children: panic?.active ? `${fmt(remaining)} · ${visibleTasks.length} blitz tasks` : "Surprise guests incoming?"
				})] })]
			}), panic?.active ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Timer, { className: "size-5 text-alert" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Siren, { className: "size-5 text-alert" })]
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: setOpen,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "border-alert/30",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Siren, { className: "size-5 text-alert" }), " Express Blitzkrieg"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "How long until guests arrive? We'll surface only the absolute essentials and split them across active members." })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-3 gap-3 py-2",
					children: [
						15,
						30,
						45
					].map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => {
							startPanic(m);
							setOpen(false);
						},
						className: "rounded-2xl border border-border bg-surface p-6 text-center transition-colors hover:border-alert/40 hover:bg-alert/10",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-3xl font-light tabular-clock",
							children: m
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs text-muted-foreground",
							children: "minutes"
						})]
					}, m))
				}),
				panic?.active && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "ghost",
					onClick: () => {
						endPanic();
						setOpen(false);
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" }), " Cancel active panic"]
				}) })
			]
		})
	})] });
}
function Dashboard() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClockWeather, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBanner, {})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MainNav, {}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground",
				children: "Quick Actions"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickActions, {})] })
		]
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dashboard, {}) });
//#endregion
export { SplitComponent as component };
