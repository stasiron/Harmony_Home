import { createFileRoute } from "@tanstack/react-router";
import { runDiagnostics } from "@/lib/diagnostics";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const report = await runDiagnostics();
        const status = report.ok ? 200 : 503;

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
          { status },
        );
      },
    },
  },
});
