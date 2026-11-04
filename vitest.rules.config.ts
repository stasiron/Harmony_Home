import { defineConfig } from "vitest/config";

// Testy reguł Firestore — wymagają emulatora: npm run test:rules
export default defineConfig({
  test: {
    include: ["tests/**/*.rules.test.ts"],
    environment: "node",
    testTimeout: 20_000,
    fileParallelism: false,
  },
});
