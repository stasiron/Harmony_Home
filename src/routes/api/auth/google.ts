import { createFileRoute } from "@tanstack/react-router";
import { buildGoogleAuthUrl, getAppOrigin } from "@/lib/googleOAuth";
import { serverOnlyRoute } from "@/lib/server-only-route";

export const Route = createFileRoute("/api/auth/google")({
  ...serverOnlyRoute,
  server: {
    handlers: {
      GET: ({ request }) => {
        const url = new URL(request.url);
        const memberId = url.searchParams.get("memberId")?.trim();
        if (!memberId) {
          return new Response("memberId required", { status: 400 });
        }

        const origin = getAppOrigin(request.url);
        const authUrl = buildGoogleAuthUrl(origin, memberId);
        if (!authUrl) {
          return Response.redirect(`${origin}/settings?error=oauth_not_configured`, 302);
        }

        return Response.redirect(authUrl, 302);
      },
    },
  },
});
