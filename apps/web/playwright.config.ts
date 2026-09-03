import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : [
        {
          command: "pnpm exec tsx src/index.ts",
          cwd: "../api",
          url: "http://localhost:4000/health",
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
        {
          command: "pnpm start",
          url: "http://localhost:3000",
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      ],
});
