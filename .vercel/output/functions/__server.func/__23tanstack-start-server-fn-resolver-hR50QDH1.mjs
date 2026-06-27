//#region node_modules/.nitro/vite/services/ssr/assets/__23tanstack-start-server-fn-resolver-hR50QDH1.js
var manifest = { "73d61eab497ade0575f45a2623c1ae1954ba3019d69988096d65e4569ab3f488": {
	functionName: "checkGuestCalendar_createServerFn_handler",
	importer: () => import("./_chunks/checkGuestCalendar-DOvaIJIF.mjs")
} };
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
