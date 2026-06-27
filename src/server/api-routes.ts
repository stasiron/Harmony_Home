import { peekLastCapturedError } from "@/lib/error-capture";
import { runDiagnostics, verifyDebugToken } from "@/lib/diagnostics";
import { saveOAuthMemberConnection } from "@/lib/calendarSettings";
import {
  buildGoogleAuthUrl,
  exchangeGoogleCode,
  getAppOrigin,
  verifyOAuthState,
} from "@/lib/googleOAuth";

export async function handleApiRequest(request: Request): Promise<Response | null> {
  const { pathname } = new URL(request.url);
  if (!pathname.startsWith("/api/")) return null;

  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (pathname === "/api/health") {
    const report = await runDiagnostics();
    return Response.json(
      {
        ok: report.ok,
        at: report.at,
        runtime: report.runtime,
        failed: {
          modules: Object.entries(report.modules)
            .filter(([, v]) => !v.ok)
            .map(([name, v]) => ({ name, error: v.error })),
          ssr: Object.entries(report.ssr)
            .filter(([, v]) => !v.ok)
            .map(([name, v]) => ({ name, error: v.error })),
        },
      },
      { status: report.ok ? 200 : 503 },
    );
  }

  if (pathname === "/api/debug") {
    if (!verifyDebugToken(request)) {
      return Response.json(
        {
          ok: false,
          error: "debug_forbidden",
          hint: "Set DEBUG_SECRET on Vercel, then open /api/debug?token=YOUR_SECRET",
        },
        { status: 403 },
      );
    }

    const report = await runDiagnostics(peekLastCapturedError());
    return Response.json(report, { status: report.ok ? 200 : 503 });
  }

  if (pathname === "/api/auth/google") {
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
  }

  if (pathname === "/api/auth/google/callback") {
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
  }

  return new Response("Not found", { status: 404 });
}
