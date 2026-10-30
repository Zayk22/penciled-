// scripts/test-integration.ts
import { config } from "dotenv";
import { execSync } from "child_process";

config({ path: ".env.local" });

if (process.env.ALLOW_INTEGRATION_TESTS !== "true") {
  console.error("Error: ALLOW_INTEGRATION_TESTS must be set to 'true' in .env.local to run these tests.");
  process.exit(1);
}

console.log("Running integration tests against Neon dev branch...");

try {
  execSync("npx vitest run src/db/bookings.integration.test.ts", { stdio: "inherit" });
} catch {
  process.exit(1);
}