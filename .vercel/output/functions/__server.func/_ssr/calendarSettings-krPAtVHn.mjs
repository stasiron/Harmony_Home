import { l as createServerFn } from "./esm-Dova13aH.mjs";
import { t as createSsrRpc } from "./createSsrRpc-CCoN_rBu.mjs";
import { a as fetchGoogleCalendarList, m as upsertMemberConnection, o as fetchGoogleUserEmail } from "./googleOAuth-8wiwlTph.mjs";
import { t as classifyGoogleCalendar } from "./calendarRules-UOuR3C_E.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/calendarSettings-krPAtVHn.js
var getCalendarConnectionStatus = createServerFn({ method: "GET" }).handler(createSsrRpc("9f1ee1fb71b7d85136cac560062c58a04fe10c914fe4aa4a85c92415bf46453f"));
var setMemberCalendarEnabled = createServerFn({ method: "POST" }).validator((data) => data).handler(createSsrRpc("ab88838169e5f4798a336020bc1facfacc132e83fcd411f67c82ce1d72983e7b"));
var setMemberCalendarDisplay = createServerFn({ method: "POST" }).validator((data) => data).handler(createSsrRpc("2625dd3e1554050889f3e1513a5dea4d219cdb561d458b2fb57cd1abee325e6f"));
var disconnectMemberGoogle = createServerFn({ method: "POST" }).validator((data) => data).handler(createSsrRpc("f893593c8b5864406ef9d9a3e79a86e29d0d2a736155dbb387fc94637c270160"));
async function saveOAuthMemberConnection(input) {
	const accessTokenExpiresAt = new Date(Date.now() + input.expiresIn * 1e3).toISOString();
	const googleEmail = await fetchGoogleUserEmail(input.accessToken);
	const calendars = (await fetchGoogleCalendarList(input.accessToken)).map((item) => {
		const classified = classifyGoogleCalendar(input.memberId, item.summary);
		return {
			googleCalendarId: item.id,
			summary: item.summary,
			enabled: true,
			display: classified.display,
			color: classified.color,
			label: classified.label
		};
	});
	await upsertMemberConnection({
		memberId: input.memberId,
		googleEmail,
		refreshToken: input.refreshToken,
		accessToken: input.accessToken,
		accessTokenExpiresAt,
		connectedAt: (/* @__PURE__ */ new Date()).toISOString(),
		calendars
	});
}
//#endregion
export { setMemberCalendarEnabled as a, setMemberCalendarDisplay as i, getCalendarConnectionStatus as n, saveOAuthMemberConnection as r, disconnectMemberGoogle as t };
