import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Exclude integration tests from the default run (e.g., in CI)
    // They are run explicitly via `npm run test:integration`
    exclude: ["**/node_modules/**", "**/*.integration.test.ts"],
  },
});