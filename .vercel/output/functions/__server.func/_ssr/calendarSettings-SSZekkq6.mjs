import { l as createServerFn } from "./esm-Dova13aH.mjs";
import { c as getGoogleOAuthConfig, d as publicMemberConnection, f as readCalendarConnectionsStore, p as updateMemberConnection, t as DEFAULT_MEMBERS } from "./googleOAuth-8wiwlTph.mjs";
import { t as createServerRpc } from "./createServerRpc-WJgk8O8C.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/calendarSettings-SSZekkq6.js
var getCalendarConnectionStatus_createServerFn_handler = createServerRpc({
	id: "9f1ee1fb71b7d85136cac560062c58a04fe10c914fe4aa4a85c92415bf46453f",
	name: "getCalendarConnectionStatus",
	filename: "src/lib/calendarSettings.ts"
}, (opts) => getCalendarConnectionStatus.__executeServer(opts));
var getCalendarConnectionStatus = createServerFn({ method: "GET" }).handler(getCalendarConnectionStatus_createServerFn_handler, async () => {
	const store = await readCalendarConnectionsStore();
	return {
		oauthReady: Boolean(getGoogleOAuthConfig()),
		members: DEFAULT_MEMBERS.map((member) => {
			const connection = store.members[member.id];
			return {
				memberId: member.id,
				memberName: member.name,
				connected: Boolean(connection),
				connection: connection ? publicMemberConnection(connection) : null
			};
		})
	};
});
var setMemberCalendarEnabled_createServerFn_handler = createServerRpc({
	id: "ab88838169e5f4798a336020bc1facfacc132e83fcd411f67c82ce1d72983e7b",
	name: "setMemberCalendarEnabled",
	filename: "src/lib/calendarSettings.ts"
}, (opts) => setMemberCalendarEnabled.__executeServer(opts));
var setMemberCalendarEnabled = createServerFn({ method: "POST" }).validator((data) => data).handler(setMemberCalendarEnabled_createServerFn_handler, async ({ data }) => {
	await updateMemberConnection(data.memberId, (current) => {
		if (!current) return current;
		return {
			...current,
			calendars: current.calendars.map((c) => c.googleCalendarId === data.googleCalendarId ? {
				...c,
				enabled: data.enabled
			} : c)
		};
	});
	return { ok: true };
});
var setMemberCalendarDisplay_createServerFn_handler = createServerRpc({
	id: "2625dd3e1554050889f3e1513a5dea4d219cdb561d458b2fb57cd1abee325e6f",
	name: "setMemberCalendarDisplay",
	filename: "src/lib/calendarSettings.ts"
}, (opts) => setMemberCalendarDisplay.__executeServer(opts));
var setMemberCalendarDisplay = createServerFn({ method: "POST" }).validator((data) => data).handler(setMemberCalendarDisplay_createServerFn_handler, async ({ data }) => {
	await updateMemberConnection(data.memberId, (current) => {
		if (!current) return current;
		return {
			...current,
			calendars: current.calendars.map((c) => c.googleCalendarId === data.googleCalendarId ? {
				...c,
				display: data.display
			} : c)
		};
	});
	return { ok: true };
});
var disconnectMemberGoogle_createServerFn_handler = createServerRpc({
	id: "f893593c8b5864406ef9d9a3e79a86e29d0d2a736155dbb387fc94637c270160",
	name: "disconnectMemberGoogle",
	filename: "src/lib/calendarSettings.ts"
}, (opts) => disconnectMemberGoogle.__executeServer(opts));
var disconnectMemberGoogle = createServerFn({ method: "POST" }).validator((data) => data).handler(disconnectMemberGoogle_createServerFn_handler, async ({ data }) => {
	await updateMemberConnection(data.memberId, () => void 0);
	return { ok: true };
});
//#endregion
export { disconnectMemberGoogle_createServerFn_handler, getCalendarConnectionStatus_createServerFn_handler, setMemberCalendarDisplay_createServerFn_handler, setMemberCalendarEnabled_createServerFn_handler };
