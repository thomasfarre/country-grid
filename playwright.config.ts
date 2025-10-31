import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "src/tests/e2e",
  fullyParallel: true,
  timeout: 60_000,
  use: {
    baseURL: "http://127.0.0.1:3000",
    headless: true,
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: {
    command: "npm run dev",
    port: 3000,
    env: {
      NEXT_PUBLIC_USE_MOCK_REALTIME: "true",
      NEXT_PUBLIC_E2E: "true",
      NEXT_PUBLIC_COUNTDOWN_SECONDS: "1",
      NEXT_PUBLIC_PLAYING_SECONDS: "5",
      NEXT_PUBLIC_REVEAL_SECONDS: "2"
    },
    reuseExistingServer: !process.env.CI
  }
});
