import { createFileRoute } from "@tanstack/react-router";

// Missing /assets/* must return real 404 (not app shell with immutable cache).
// See: https://github.com/TanStack/router/issues/7215
export const Route = createFileRoute("/assets/$")({
  component: () => null,
  server: {
    handlers: {
      GET: () =>
        new Response("Not found", {
          status: 404,
          headers: { "cache-control": "no-store" },
        }),
    },
  },
});
