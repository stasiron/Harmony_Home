import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import { resolveAppVersion } from "./src/lib/appVersion.build";

const appVersion = resolveAppVersion();

const vercelPreset =
  process.env.VERCEL === "1" || process.env.NITRO_PRESET === "vercel";

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion.version),
    __APP_COMMIT__: JSON.stringify(appVersion.commit),
  },
  plugins: [
    tanstackStart({
      // TanStack Start zawsze dzieli trasy na chunki (opcja autoCodeSplitting
      // jest tu ignorowana). Stare chunki po deployu łapie chunk-reload-guard.
      server: { entry: "server" },
    }),
    viteReact(),
    tailwindcss(),
    nitro({
      preset: vercelPreset ? "vercel" : undefined,
      traceDeps: ["tslib*"],
    }),
  ],
  nitro: {
    preset: vercelPreset ? "vercel" : undefined,
    traceDeps: ["tslib*"],
    runtimeConfig: {
      googleCalendarIcalUrl: "",
    },
  },
  resolve: {
    tsconfigPaths: true,
    dedupe: [
      "react",
      "react-dom",
      "@tanstack/react-router",
      "@tanstack/react-start",
    ],
  },
  server: {
    host: true,
  },
});
