import { createFileRoute } from "@tanstack/react-router";
import { peekLastCapturedError } from "@/lib/error-capture";
import { runDiagnostics, verifyDebugToken } from "@/lib/diagnostics";

export const Route = createFileRoute("/api/debug")({
  server: {
    handlers: {
      GET: async ({ request }) => {
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
      },
    },
  },
});
