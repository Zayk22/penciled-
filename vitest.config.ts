// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    hookTimeout: 30000,
    testTimeout: 30000,
    exclude: process.env.VITEST_INTEGRATION === "true"
      ? ["**/node_modules/**"]
      : ["**/node_modules/**", "**/*.integration.test.ts"],
  },
});