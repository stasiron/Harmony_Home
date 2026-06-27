import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as useApp } from "./AppContext-CsJxkAiS.mjs";
import { S as Check, u as Plus } from "../_libs/lucide-react.mjs";
import { i as cn, n as Shell, t as Button } from "./Shell-JV0XcIcI.mjs";
import { n as CheckboxIndicator, t as Checkbox$1 } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { i as Trigger, n as List, r as Root2, t as Content } from "../_libs/radix-ui__react-tabs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/kitchen-C5ZL1eeP.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Tabs = Root2;
var TabsList = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, {
	ref,
	className: cn("inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground", className),
	...props
}));
TabsList.displayName = List.displayName;
var TabsTrigger = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trigger, {
	ref,
	className: cn("inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow", className),
	...props
}));
TabsTrigger.displayName = Trigger.displayName;
var TabsContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content, {
	ref,
	className: cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className),
	...props
}));
TabsContent.displayName = Content.displayName;
var Checkbox = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox$1, {
	ref,
	className: cn("grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckboxIndicator, {
		className: cn("grid place-content-center text-current"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" })
	})
}));
Checkbox.displayName = Checkbox$1.displayName;
var CATEGORY_ORDER = [
	"produce",
	"dairy",
	"bakery",
	"pantry",
	"frozen",
	"household"
];
function KitchenPage() {
	const { shopping, toggleShopping, recipes, addShopping } = useApp();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-3xl font-semibold tracking-tight md:text-4xl",
			children: "Kitchen"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-muted-foreground",
			children: "Shopping list and favorite recipes."
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
			defaultValue: "shopping",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
					value: "shopping",
					children: "Shopping List"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
					value: "recipes",
					children: "Recipes"
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "shopping",
					className: "mt-6 space-y-6",
					children: shopping.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyPanel, {
						title: "Shopping list is empty",
						description: "Add items manually or from a recipe when you save one."
					}) : CATEGORY_ORDER.map((cat) => {
						const items = shopping.filter((s) => s.category === cat);
						if (items.length === 0) return null;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground",
							children: cat
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "overflow-hidden rounded-2xl border border-border bg-surface",
							children: items.map((s, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: cn("flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-elevated", idx > 0 && "border-t border-border"),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
										checked: s.checked,
										onCheckedChange: () => toggleShopping(s.id)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: cn("flex-1 min-w-0 truncate", s.checked && "text-muted-foreground line-through"),
										children: s.name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "shrink-0 text-xs text-muted-foreground",
										children: s.qty
									})
								]
							}, s.id))
						})] }, cat);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "recipes",
					className: "mt-6",
					children: recipes.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyPanel, {
						title: "No recipes yet",
						description: "Save your favorite meals here to quickly add ingredients to the shopping list."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
						children: recipes.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex items-start justify-between gap-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-3xl",
												children: r.emoji
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "mt-2 text-lg font-semibold",
												children: r.name
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "text-xs text-muted-foreground",
												children: [r.timeMinutes, " min"]
											})
										]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "space-y-1 text-sm text-muted-foreground",
									children: r.ingredients.map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex justify-between gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "truncate",
											children: i.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "shrink-0 text-xs",
											children: i.qty
										})]
									}, i.name))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "secondary",
									className: "mt-auto",
									onClick: () => addShopping(r.ingredients),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), " Add to shopping list"]
								})
							]
						}, r.id))
					})
				})
			]
		})]
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
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KitchenPage, {}) });
//#endregion
export { SplitComponent as component };
