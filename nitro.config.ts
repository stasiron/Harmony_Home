import { defineConfig } from "nitro/config";

const vercelPreset =
  process.env.VERCEL === "1" || process.env.NITRO_PRESET === "vercel";

export default defineConfig({
  preset: vercelPreset ? "vercel" : undefined,
  traceDeps: ["tslib*"],
});
