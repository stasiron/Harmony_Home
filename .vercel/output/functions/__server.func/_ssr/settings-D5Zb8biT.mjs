import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as useServerFn } from "./useServerFn-CrZF2pjq.mjs";
import { i as cn, n as Shell, t as Button } from "./Shell-JV0XcIcI.mjs";
import { t as Label } from "./label-BuAXkWMP.mjs";
import { a as setMemberCalendarEnabled, i as setMemberCalendarDisplay, n as getCalendarConnectionStatus, t as disconnectMemberGoogle } from "./calendarSettings-BqIBmHve.mjs";
import { t as Switch } from "./switch-CbqVEryT.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings-D5Zb8biT.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SettingsPage() {
	const loadStatus = useServerFn(getCalendarConnectionStatus);
	const toggleEnabled = useServerFn(setMemberCalendarEnabled);
	const toggleDisplay = useServerFn(setMemberCalendarDisplay);
	const disconnect = useServerFn(disconnectMemberGoogle);
	const [status, setStatus] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [banner, setBanner] = (0, import_react.useState)(null);
	const refresh = async () => {
		setLoading(true);
		try {
			setStatus(await loadStatus());
		} finally {
			setLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		refresh();
		const params = new URLSearchParams(window.location.search);
		const error = params.get("error");
		const connected = params.get("connected");
		if (error) setBanner(`Błąd połączenia: ${error}`);
		if (connected) setBanner("Kalendarz Google połączony. Wszystkie kalendarze włączone — wyłącz tu te, które mają zniknąć.");
		if (error || connected) window.history.replaceState({}, "", "/settings");
	}, []);
	if (loading && !status) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted-foreground",
		children: "Ładowanie ustawień…"
	});
	if (!status) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-3xl font-semibold tracking-tight md:text-4xl",
				children: "Ustawienia"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: "Każdy domownik loguje się Google — kalendarze widoczne dla wszystkich. Tu wyłączasz te, które mają zniknąć z widoku."
			})] }),
			banner && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-2xl border border-border bg-surface px-4 py-3 text-sm",
				children: banner
			}),
			!status.oauthReady && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-dashed border-border bg-surface/50 px-4 py-4 text-sm text-muted-foreground",
				children: [
					"Ustaw ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
						className: "text-foreground",
						children: "GOOGLE_CLIENT_ID"
					}),
					",",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
						className: "text-foreground",
						children: "GOOGLE_CLIENT_SECRET"
					}),
					" i",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
						className: "text-foreground",
						children: "AUTH_SECRET"
					}),
					" w env. Redirect URI w Google Cloud:",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
						className: "text-foreground",
						children: "https://twoja-domena/api/auth/google/callback"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-4",
				children: status.members.map((member) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-3xl border border-border bg-gradient-to-br from-surface-elevated via-surface to-card p-5 shadow-elevated",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-xl font-semibold",
							children: member.memberName
						}), member.connected && member.connection ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-sm text-muted-foreground",
							children: [
								member.connection.googleEmail,
								" · ",
								member.connection.calendars.length,
								" ",
								"kalendarzy"
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted-foreground",
							children: "Nie połączono z Google"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex shrink-0 gap-2",
							children: [status.oauthReady && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								asChild: true,
								variant: member.connected ? "outline" : "default",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: `/api/auth/google?memberId=${member.memberId}`,
									children: member.connected ? "Połącz ponownie" : "Połącz Google"
								})
							}), member.connected && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								className: "text-muted-foreground",
								onClick: async () => {
									await disconnect({ data: { memberId: member.memberId } });
									await refresh();
								},
								children: "Odłącz"
							})]
						})]
					}), member.connection && member.connection.calendars.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-5 space-y-3 border-t border-border pt-4",
						children: member.connection.calendars.map((calendar) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex flex-col gap-3 rounded-2xl border border-border bg-surface/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium",
									children: calendar.summary
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted-foreground",
									children: [calendar.label, calendar.display === "busy" ? " · tylko zajęty/wolny" : " · pełne szczegóły"]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
										id: `${member.memberId}-${calendar.googleCalendarId}-enabled`,
										checked: calendar.enabled,
										onCheckedChange: async (enabled) => {
											await toggleEnabled({ data: {
												memberId: member.memberId,
												googleCalendarId: calendar.googleCalendarId,
												enabled
											} });
											await refresh();
										}
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: `${member.memberId}-${calendar.googleCalendarId}-enabled`,
										className: "text-xs",
										children: "Widoczny"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex gap-1 rounded-xl border border-border p-1",
									children: ["full", "busy"].map((mode) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: cn("rounded-lg px-2 py-1 text-xs font-medium transition-colors", calendar.display === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"),
										onClick: async () => {
											await toggleDisplay({ data: {
												memberId: member.memberId,
												googleCalendarId: calendar.googleCalendarId,
												display: mode
											} });
											await refresh();
										},
										children: mode === "full" ? "Szczegóły" : "Zajęty"
									}, mode))
								})]
							})]
						}, calendar.googleCalendarId))
					})]
				}, member.memberId))
			})
		]
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsPage, {}) });
//#endregion
export { SplitComponent as component };
