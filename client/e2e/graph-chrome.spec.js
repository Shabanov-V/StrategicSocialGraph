import { test, expect } from '@playwright/test';

// Regression guard for the D3Graph chrome.
//
// Token cleanup once deleted the gray CSS vars (--medium-gray, --light-gray,
// --dark-gray, --very-dark-gray) that D3Graph.jsx still referenced via inline
// SVG attrs. The strokes/fills resolved to invalid, so the SVG fell back to its
// defaults (stroke `none`) and the orbit rings + sector dividers silently
// vanished — invisible to unit tests and the *.module.css hex grep alike.
//
// These render the real graph in a browser and assert the chrome draws with a
// resolved color, not the undefined-var fallback.

// 'none' = invalid stroke fallback; 'rgb(0, 0, 0)' = the fill/text fallback.
const isUnset = (c) => c === 'none' || c === 'rgb(0, 0, 0)' || c === '';

test.describe('graph chrome', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // graph is async (fetch graph.yml → d3 render); wait for it to draw.
    await expect(page.locator('svg g.circles circle').first()).toBeAttached();
  });

  test('orbit rings render with a resolved stroke', async ({ page }) => {
    const strokes = await page
      .locator('svg g.circles circle')
      .evaluateAll((els) => els.map((e) => getComputedStyle(e).stroke));
    expect(strokes.length).toBeGreaterThan(0);
    expect(strokes.every((s) => !isUnset(s)), `ring strokes: ${strokes.join(' | ')}`).toBe(true);
  });

  test('sector dividers render with a resolved stroke', async ({ page }) => {
    const strokes = await page
      .locator('svg g.sectors path')
      .evaluateAll((els) => els.map((e) => getComputedStyle(e).stroke));
    // fills have stroke:none; at least one boundary path must have a real stroke.
    expect(strokes.some((s) => !isUnset(s)), `sector strokes: ${strokes.join(' | ')}`).toBe(true);
  });

  test('node labels render with a resolved fill', async ({ page }) => {
    await expect(page.locator('svg g.labels text').first()).toBeAttached();
    const fill = await page
      .locator('svg g.labels text')
      .first()
      .evaluate((e) => getComputedStyle(e).fill);
    // --text resolves to #333 = rgb(51,51,51); an undefined var (the old
    // --very-dark-gray bug) falls back to black rgb(0,0,0).
    expect(fill).toBe('rgb(51, 51, 51)');
  });
});
