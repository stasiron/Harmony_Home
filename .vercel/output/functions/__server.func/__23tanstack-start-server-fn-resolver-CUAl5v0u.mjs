//#region node_modules/.nitro/vite/services/ssr/assets/__23tanstack-start-server-fn-resolver-CUAl5v0u.js
var manifest = {
	"2625dd3e1554050889f3e1513a5dea4d219cdb561d458b2fb57cd1abee325e6f": {
		functionName: "setMemberCalendarDisplay_createServerFn_handler",
		importer: () => import("./_ssr/calendarSettings-CuYboaDJ.mjs")
	},
	"73d61eab497ade0575f45a2623c1ae1954ba3019d69988096d65e4569ab3f488": {
		functionName: "checkGuestCalendar_createServerFn_handler",
		importer: () => import("./_ssr/checkGuestCalendar-C40pR-3u.mjs")
	},
	"9f1ee1fb71b7d85136cac560062c58a04fe10c914fe4aa4a85c92415bf46453f": {
		functionName: "getCalendarConnectionStatus_createServerFn_handler",
		importer: () => import("./_ssr/calendarSettings-CuYboaDJ.mjs")
	},
	"ab88838169e5f4798a336020bc1facfacc132e83fcd411f67c82ce1d72983e7b": {
		functionName: "setMemberCalendarEnabled_createServerFn_handler",
		importer: () => import("./_ssr/calendarSettings-CuYboaDJ.mjs")
	},
	"c0212ebf73af9bfdfe0016f16cce82c9cd95f806d5a764ef60794721c5c47680": {
		functionName: "fetchCalendarEvents_createServerFn_handler",
		importer: () => import("./_ssr/fetchCalendarEvents-B7_MhoH8.mjs")
	},
	"f893593c8b5864406ef9d9a3e79a86e29d0d2a736155dbb387fc94637c270160": {
		functionName: "disconnectMemberGoogle_createServerFn_handler",
		importer: () => import("./_ssr/calendarSettings-CuYboaDJ.mjs")
	}
};
async function getServerFnById(id, access) {
	const serverFnInfo = manifest[id];
	if (!serverFnInfo) throw new Error("Server function info not found for " + id);
	const fnModule = serverFnInfo.module ?? await serverFnInfo.importer();
	if (!fnModule) throw new Error("Server function module not resolved for " + id);
	const action = fnModule[serverFnInfo.functionName];
	if (!action) throw new Error("Server function module export not resolved for serverFn ID: " + id);
	return action;
}
//#endregion
export { getServerFnById as t };
