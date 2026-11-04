import { defineConfig } from "vitest/config";

// Osobny config — vite.config.ts ładuje TanStack Start i Nitro, zbędne w testach.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
