import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: "list",
  use: {
    baseURL: process.env.MEMORA_WEB_URL ?? "http://localhost:3300",
    headless: true,
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  projects: [
    {
      name: "chrome-desktop",
      use: {
        browserName: "chromium",
        channel: "chrome",
        viewport: { width: 1440, height: 1000 },
      },
    },
  ],
});
