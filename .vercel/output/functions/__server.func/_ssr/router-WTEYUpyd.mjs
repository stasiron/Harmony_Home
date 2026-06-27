import { _ as useRouter, c as HeadContent, d as createRouter, f as Outlet, g as Link, h as createRootRouteWithContext, m as createFileRoute, p as lazyRouteComponent, s as Scripts } from "../_libs/@tanstack/react-router+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { h as verifyOAuthState, n as buildGoogleAuthUrl, r as exchangeGoogleCode, s as getAppOrigin } from "./googleOAuth-BhEtEXPI.mjs";
import { t as AppProvider } from "./AppContext-CnIfV1R4.mjs";
import { i as peekLastCapturedError, n as runDiagnostics, r as verifyDebugToken } from "./ssr.mjs";
import { t as WEATHER_CITY } from "./weather-0dinpoNJ.mjs";
import { r as saveOAuthMemberConnection } from "./calendarSettings-BqIBmHve.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { t as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-WTEYUpyd.js
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-DcTqn4RA.css";
var RELOAD_KEY = "homeharmony-chunk-reload";
var RELOAD_COOLDOWN_MS = 15e3;
var CHUNK_ERROR_PATTERNS = [
	"Failed to fetch dynamically imported module",
	"Loading chunk",
	"Importing a module script failed"
];
function isChunkLoadError(reason) {
	const message = String(reason instanceof Error ? reason.message : reason ?? "");
	return CHUNK_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}
function reloadOnceForStaleChunks() {
	const last = sessionStorage.getItem(RELOAD_KEY);
	const now = Date.now();
	if (last && now - Number(last) < RELOAD_COOLDOWN_MS) return;
	sessionStorage.setItem(RELOAD_KEY, String(now));
	window.location.reload();
}
function installChunkReloadGuard() {
	if (typeof window === "undefined") return;
	window.addEventListener("unhandledrejection", (event) => {
		if (!isChunkLoadError(event.reason)) return;
		event.preventDefault();
		reloadOnceForStaleChunks();
	});
	window.addEventListener("vite:preloadError", (event) => {
		event.preventDefault();
		reloadOnceForStaleChunks();
	});
}
if (typeof window !== "undefined") installChunkReloadGuard();
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				error?.message ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
					className: "mt-4 max-h-48 overflow-auto rounded-md bg-muted p-3 text-left text-xs text-muted-foreground",
					children: error.message
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 text-xs text-muted-foreground",
					children: ["Diagnostyka: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/api/health",
						className: "underline",
						children: "/api/health"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$14 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Homebase · Smart Home & Chores" },
			{
				name: "description",
				content: "A warm, minimalist kitchen-kiosk dashboard for chores, guests and smart-home automations."
			},
			{
				property: "og:title",
				content: "Homebase · Smart Home & Chores"
			},
			{
				property: "og:description",
				content: "Kiosk-ready chores & smart-home dashboard."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary"
			}
		],
		links: [{
			rel: "stylesheet",
			href: styles_default
		}]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("head", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("script", { dangerouslySetInnerHTML: { __html: `(function(){var k="homeharmony-chunk-reload",p=["Failed to fetch dynamically imported module","Loading chunk","Importing a module script failed"];function r(m){if(!p.some(function(x){return String(m||"").indexOf(x)!==-1}))return;var l=sessionStorage.getItem(k),n=Date.now();if(l&&n-Number(l)<15000)return;sessionStorage.setItem(k,String(n));location.reload()}window.addEventListener("unhandledrejection",function(e){r(e.reason&&e.reason.message)});window.addEventListener("vite:preloadError",function(e){e.preventDefault();r("preload")})})();` } })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$14.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) })
	});
}
var $$splitComponentImporter$9 = () => import("./weather-DTvUvk_j.mjs");
var Route$13 = createFileRoute("/weather")({
	head: () => ({ meta: [{ title: `Pogoda · ${WEATHER_CITY}` }, {
		name: "description",
		content: "Prognoza pogody na 3 dni — Częstochowa."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
var $$splitComponentImporter$8 = () => import("./stats-D7Y4no2I.mjs");
var Route$12 = createFileRoute("/stats")({
	head: () => ({ meta: [{ title: "Stats · Homebase" }, {
		name: "description",
		content: "Household chores analytics."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
var $$splitComponentImporter$7 = () => import("./smart-DHTmxVxF.mjs");
var Route$11 = createFileRoute("/smart")({
	head: () => ({ meta: [{ title: "Smart Home · Homebase" }, {
		name: "description",
		content: "Home Assistant devices linked to household chores."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitComponentImporter$6 = () => import("./settings-D5Zb8biT.mjs");
var Route$10 = createFileRoute("/settings")({
	head: () => ({ meta: [{ title: "Ustawienia · Homebase" }, {
		name: "description",
		content: "Połączenia Google Calendar domowników."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./members-BG6Dr94l.mjs");
var Route$9 = createFileRoute("/members")({
	head: () => ({ meta: [{ title: "Members · Homebase" }, {
		name: "description",
		content: "Household members and their assigned chores."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./kitchen-CWq-2kKs.mjs");
var Route$8 = createFileRoute("/kitchen")({
	head: () => ({ meta: [{ title: "Kitchen · Homebase" }, {
		name: "description",
		content: "Shopping list and household recipes."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./chores-uIl7Eq8i.mjs");
var Route$7 = createFileRoute("/chores")({
	head: () => ({ meta: [{ title: "Chores · Homebase" }, {
		name: "description",
		content: "Flexible chore intervals — safe, suggested, must-do."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./calendar-DDSClTcL.mjs");
var Route$6 = createFileRoute("/calendar")({
	head: () => ({ meta: [{ title: "Kalendarz · Homebase" }, {
		name: "description",
		content: "Google Calendar, obowiązki domowe i plany gości w jednym widoku."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./routes-CN-sgUtd.mjs");
var Route$5 = createFileRoute("/")({
	head: () => ({ meta: [
		{ title: "Homebase · Smart Home & Chores" },
		{
			name: "description",
			content: "A warm, minimalist kitchen-kiosk dashboard for chores, guests and smart-home automations."
		},
		{
			property: "og:title",
			content: "Homebase · Smart Home & Chores"
		},
		{
			property: "og:description",
			content: "Kiosk-ready chores & smart-home dashboard."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("../_-DyRkPrxN.mjs");
var Route$4 = createFileRoute("/assets/$")({
	component: lazyRouteComponent($$splitComponentImporter, "component"),
	server: { handlers: { GET: () => new Response("Not found", {
		status: 404,
		headers: { "cache-control": "no-store" }
	}) } }
});
var Route$3 = createFileRoute("/api/health")({ server: { handlers: { GET: async () => {
	const report = await runDiagnostics();
	const status = report.ok ? 200 : 503;
	return Response.json({
		ok: report.ok,
		at: report.at,
		runtime: report.runtime,
		failed: {
			modules: Object.entries(report.modules).filter(([, v]) => !v.ok).map(([name, v]) => ({
				name,
				error: v.error
			})),
			ssr: Object.entries(report.ssr).filter(([, v]) => !v.ok).map(([name, v]) => ({
				name,
				error: v.error
			}))
		}
	}, { status });
} } } });
var Route$2 = createFileRoute("/api/debug")({ server: { handlers: { GET: async ({ request }) => {
	if (!verifyDebugToken(request)) return Response.json({
		ok: false,
		error: "debug_forbidden",
		hint: "Set DEBUG_SECRET on Vercel, then open /api/debug?token=YOUR_SECRET"
	}, { status: 403 });
	const report = await runDiagnostics(peekLastCapturedError());
	return Response.json(report, { status: report.ok ? 200 : 503 });
} } } });
var Route$1 = createFileRoute("/api/auth/google")({ server: { handlers: { GET: ({ request }) => {
	const memberId = new URL(request.url).searchParams.get("memberId")?.trim();
	if (!memberId) return new Response("memberId required", { status: 400 });
	const origin = getAppOrigin(request.url);
	const authUrl = buildGoogleAuthUrl(origin, memberId);
	if (!authUrl) return Response.redirect(`${origin}/settings?error=oauth_not_configured`, 302);
	return Response.redirect(authUrl, 302);
} } } });
var Route = createFileRoute("/api/auth/google/callback")({ server: { handlers: { GET: async ({ request }) => {
	const origin = getAppOrigin(request.url);
	const url = new URL(request.url);
	const error = url.searchParams.get("error");
	if (error) return Response.redirect(`${origin}/settings?error=${encodeURIComponent(error)}`, 302);
	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");
	if (!code || !state) return Response.redirect(`${origin}/settings?error=missing_code`, 302);
	const parsed = verifyOAuthState(state);
	if (!parsed) return Response.redirect(`${origin}/settings?error=invalid_state`, 302);
	try {
		const tokens = await exchangeGoogleCode(code, origin);
		if (!tokens.refresh_token) return Response.redirect(`${origin}/settings?error=no_refresh_token`, 302);
		await saveOAuthMemberConnection({
			memberId: parsed.memberId,
			refreshToken: tokens.refresh_token,
			accessToken: tokens.access_token,
			expiresIn: tokens.expires_in
		});
		return Response.redirect(`${origin}/settings?connected=${parsed.memberId}`, 302);
	} catch {
		return Response.redirect(`${origin}/settings?error=connect_failed`, 302);
	}
} } } });
var WeatherRoute = Route$13.update({
	id: "/weather",
	path: "/weather",
	getParentRoute: () => Route$14
});
var StatsRoute = Route$12.update({
	id: "/stats",
	path: "/stats",
	getParentRoute: () => Route$14
});
var SmartRoute = Route$11.update({
	id: "/smart",
	path: "/smart",
	getParentRoute: () => Route$14
});
var SettingsRoute = Route$10.update({
	id: "/settings",
	path: "/settings",
	getParentRoute: () => Route$14
});
var MembersRoute = Route$9.update({
	id: "/members",
	path: "/members",
	getParentRoute: () => Route$14
});
var KitchenRoute = Route$8.update({
	id: "/kitchen",
	path: "/kitchen",
	getParentRoute: () => Route$14
});
var ChoresRoute = Route$7.update({
	id: "/chores",
	path: "/chores",
	getParentRoute: () => Route$14
});
var CalendarRoute = Route$6.update({
	id: "/calendar",
	path: "/calendar",
	getParentRoute: () => Route$14
});
var IndexRoute = Route$5.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$14
});
var AssetsSplatRoute = Route$4.update({
	id: "/assets/$",
	path: "/assets/$",
	getParentRoute: () => Route$14
});
var ApiHealthRoute = Route$3.update({
	id: "/api/health",
	path: "/api/health",
	getParentRoute: () => Route$14
});
var ApiDebugRoute = Route$2.update({
	id: "/api/debug",
	path: "/api/debug",
	getParentRoute: () => Route$14
});
var ApiAuthGoogleRoute = Route$1.update({
	id: "/api/auth/google",
	path: "/api/auth/google",
	getParentRoute: () => Route$14
});
var ApiAuthGoogleRouteChildren = { ApiAuthGoogleCallbackRoute: Route.update({
	id: "/callback",
	path: "/callback",
	getParentRoute: () => ApiAuthGoogleRoute
}) };
var rootRouteChildren = {
	IndexRoute,
	CalendarRoute,
	ChoresRoute,
	KitchenRoute,
	MembersRoute,
	SettingsRoute,
	SmartRoute,
	StatsRoute,
	WeatherRoute,
	ApiDebugRoute,
	ApiHealthRoute,
	AssetsSplatRoute,
	ApiAuthGoogleRoute: ApiAuthGoogleRoute._addFileChildren(ApiAuthGoogleRouteChildren)
};
var routeTree = Route$14._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	return createRouter({
		routeTree,
		context: { queryClient: new QueryClient() },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
