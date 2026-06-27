import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const vercelPreset =
  process.env.VERCEL === "1" || process.env.NITRO_PRESET === "vercel";

export default defineConfig({
  plugins: [
    tanstackStart({
      server: { entry: "server" },
      router: {
        // Keep routes in the main bundle — avoids stale lazy-chunk 404 after deploy.
        autoCodeSplitting: false,
      },
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
});
