import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { g as CloudRain, h as Cloud, o as Sun } from "../_libs/lucide-react.mjs";
import { c as weatherIconKind } from "./weather-0dinpoNJ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/WeatherIcon-DiFpk1fb.js
var import_jsx_runtime = require_jsx_runtime();
function WeatherIcon({ code, className = "size-12 text-primary" }) {
	const kind = weatherIconKind(code);
	const props = {
		className,
		strokeWidth: 1.4
	};
	if (kind === "sun") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { ...props });
	if (kind === "rain") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloudRain, { ...props });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cloud, { ...props });
}
//#endregion
export { WeatherIcon as t };
