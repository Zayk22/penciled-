import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The integration test guards itself with the ALLOW_INTEGRATION_TESTS env var.
  },
});