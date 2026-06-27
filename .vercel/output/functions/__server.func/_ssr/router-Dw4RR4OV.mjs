import { _ as useRouter, c as HeadContent, d as createRouter, f as Outlet, g as Link, h as createRootRouteWithContext, m as createFileRoute, p as lazyRouteComponent, s as Scripts } from "../_libs/@tanstack/react-router+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as AppProvider } from "./AppContext-DueSceAK.mjs";
import { t as WEATHER_CITY } from "./weather-0dinpoNJ.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { t as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-Dw4RR4OV.js
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-CVSN2I-c.css";
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
var Route$7 = createRootRouteWithContext()({
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
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$7.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) })
	});
}
var $$splitComponentImporter$6 = () => import("./weather-Bo76fYmA.mjs");
var Route$6 = createFileRoute("/weather")({
	head: () => ({ meta: [{ title: `Pogoda · ${WEATHER_CITY}` }, {
		name: "description",
		content: "Prognoza pogody na 3 dni — Częstochowa."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./stats-BXHUsSEj.mjs");
var Route$5 = createFileRoute("/stats")({
	head: () => ({ meta: [{ title: "Stats · Homebase" }, {
		name: "description",
		content: "Household chores analytics."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./smart-Bmk4uYGe.mjs");
var Route$4 = createFileRoute("/smart")({
	head: () => ({ meta: [{ title: "Smart Home · Homebase" }, {
		name: "description",
		content: "Home Assistant devices linked to household chores."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./members-CB1o6fb7.mjs");
var Route$3 = createFileRoute("/members")({
	head: () => ({ meta: [{ title: "Members · Homebase" }, {
		name: "description",
		content: "Household members and their assigned chores."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./kitchen-C5D7YrV6.mjs");
var Route$2 = createFileRoute("/kitchen")({
	head: () => ({ meta: [{ title: "Kitchen · Homebase" }, {
		name: "description",
		content: "Shopping list and household recipes."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./chores-BMh1GA0H.mjs");
var Route$1 = createFileRoute("/chores")({
	head: () => ({ meta: [{ title: "Chores · Homebase" }, {
		name: "description",
		content: "Flexible chore intervals — safe, suggested, must-do."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./routes-CcJyjxGf.mjs");
var Route = createFileRoute("/")({
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
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var WeatherRoute = Route$6.update({
	id: "/weather",
	path: "/weather",
	getParentRoute: () => Route$7
});
var StatsRoute = Route$5.update({
	id: "/stats",
	path: "/stats",
	getParentRoute: () => Route$7
});
var SmartRoute = Route$4.update({
	id: "/smart",
	path: "/smart",
	getParentRoute: () => Route$7
});
var MembersRoute = Route$3.update({
	id: "/members",
	path: "/members",
	getParentRoute: () => Route$7
});
var KitchenRoute = Route$2.update({
	id: "/kitchen",
	path: "/kitchen",
	getParentRoute: () => Route$7
});
var ChoresRoute = Route$1.update({
	id: "/chores",
	path: "/chores",
	getParentRoute: () => Route$7
});
var rootRouteChildren = {
	IndexRoute: Route.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$7
	}),
	ChoresRoute,
	KitchenRoute,
	MembersRoute,
	SmartRoute,
	StatsRoute,
	WeatherRoute
};
var routeTree = Route$7._addFileChildren(rootRouteChildren)._addFileTypes();
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
