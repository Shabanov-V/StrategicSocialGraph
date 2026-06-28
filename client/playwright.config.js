import { defineConfig, devices } from '@playwright/test';

// Mobile-first app (see CONTEXT.md) — drive every e2e test through a phone
// viewport so regressions show up the way real users hit them. Browser comes
// from the default ~/.cache/ms-playwright cache; no PLAYWRIGHT_BROWSERS_PATH
// needed. Vite is started automatically and reused if already running.
export default defineConfig({
  testDir: './e2e',
  testIgnore: ['**/pwa.spec.js'],
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:5180',
    ...devices['Pixel 5'], // 393×851, isMobile, hasTouch
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev -- --port 5180 --host 127.0.0.1',
    url: 'http://127.0.0.1:5180',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
