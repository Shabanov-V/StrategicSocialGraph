import { test, expect } from '@playwright/test';

// NOTE on Playwright 1.61 + Chromium 149 compatibility:
//
// 1. waitForFunction(async () => ...) resolves immediately in this version
//    because an async arrow function returns a Promise, which is truthy.
//    All SW condition checks use a page-side sentinel + sync waitForFunction.
//
// 2. context.setOffline(true) + page.reload() bypasses the SW fetch event at
//    the CDP level (ERR_INTERNET_DISCONNECTED before the SW can intercept).
//    Triggering the reload via page.evaluate(() => location.reload()) goes
//    through the renderer's normal navigation path and correctly invokes the
//    SW fetch handler, which serves the shell from the precache.

test('manifest is linked and service worker registers', async ({ page }) => {
  // Set a sentinel when the SW becomes active (navigator.serviceWorker.ready
  // resolves once an active worker exists for the current scope).
  await page.addInitScript(() => {
    window.__swRegistered = false;
    navigator.serviceWorker.ready.then(() => { window.__swRegistered = true; });
  });

  await page.goto('/');

  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifestHref).toBeTruthy();

  // Sync waitForFunction — reads the sentinel set by the page-side async chain.
  await page.waitForFunction(() => !!window.__swRegistered, null, { timeout: 30_000 });
});

test('app boots and renders the graph while offline', async ({ page, context }) => {
  // Sentinel set once the SW is active, controlling this page, and the
  // precache contains all 10 expected entries.
  await page.addInitScript(() => {
    window.__swFullyReady = false;
    async function checkReady() {
      try {
        if (!navigator.serviceWorker.controller) { setTimeout(checkReady, 200); return; }
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg?.active) { setTimeout(checkReady, 200); return; }
        const keys = await caches.keys();
        let total = 0;
        for (const k of keys) {
          const c = await caches.open(k);
          total += (await c.keys()).length;
        }
        if (total >= 10) { window.__swFullyReady = true; }
        else { setTimeout(checkReady, 200); }
      } catch (_) { setTimeout(checkReady, 200); }
    }
    checkReady();
  });

  // First online load to populate the precache + the service worker.
  await page.goto('/');

  // Sync waitForFunction — waits for the page-side sentinel.
  await page.waitForFunction(() => window.__swFullyReady === true, null, {
    timeout: 30_000,
    polling: 200,
  });
  await expect(page.locator('svg')).toBeVisible();

  // Now cut the network and reload — the shell must come from the SW cache.
  await context.setOffline(true);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30_000 }),
    page.evaluate(() => location.reload()),
  ]);
  await expect(page.locator('svg')).toBeVisible();
});
