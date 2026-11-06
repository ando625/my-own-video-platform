import { mkdirSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";
import { assertTestDatabase } from "./tests/assert-test-database";
import { E2E_BASE_URL, E2E_ENV, E2E_PORT } from "./tests/e2e/test-env";

assertTestDatabase(E2E_ENV.TURSO_DATABASE_URL);
mkdirSync(".test", { recursive: true });

export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  forbidOnly: true,
  use: {
    baseURL: E2E_BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${E2E_PORT}`,
    url: E2E_BASE_URL,
    env: E2E_ENV,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
