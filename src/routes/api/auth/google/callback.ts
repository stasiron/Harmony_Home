import { createFileRoute } from "@tanstack/react-router";
import { saveOAuthMemberConnection } from "@/lib/calendarSettings";
import {
  exchangeGoogleCode,
  getAppOrigin,
  verifyOAuthState,
} from "@/lib/googleOAuth";
import { serverOnlyRoute } from "@/lib/server-only-route";

export const Route = createFileRoute("/api/auth/google/callback")({
  ...serverOnlyRoute,
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = getAppOrigin(request.url);
        const url = new URL(request.url);
        const error = url.searchParams.get("error");
        if (error) {
          return Response.redirect(`${origin}/settings?error=${encodeURIComponent(error)}`, 302);
        }

        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        if (!code || !state) {
          return Response.redirect(`${origin}/settings?error=missing_code`, 302);
        }

        const parsed = verifyOAuthState(state);
        if (!parsed) {
          return Response.redirect(`${origin}/settings?error=invalid_state`, 302);
        }

        try {
          const tokens = await exchangeGoogleCode(code, origin);
          if (!tokens.refresh_token) {
            return Response.redirect(`${origin}/settings?error=no_refresh_token`, 302);
          }

          await saveOAuthMemberConnection({
            memberId: parsed.memberId,
            refreshToken: tokens.refresh_token,
            accessToken: tokens.access_token,
            expiresIn: tokens.expires_in,
          });

          return Response.redirect(`${origin}/settings?connected=${parsed.memberId}`, 302);
        } catch {
          return Response.redirect(`${origin}/settings?error=connect_failed`, 302);
        }
      },
    },
  },
});
