import { defineConfig, devices } from '@playwright/test';

// PWA tests need a real service worker, which only runs against a production
// build — so serve `vite preview` (not `vite dev`). Isolated from the main
// e2e config (different port + testMatch) so the dev-based suite is unaffected.
export default defineConfig({
  testDir: './e2e',
  testMatch: 'pwa.spec.js',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5181',
    ...devices['Pixel 5'],
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 5181 --host 127.0.0.1',
    url: 'http://127.0.0.1:5181',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
