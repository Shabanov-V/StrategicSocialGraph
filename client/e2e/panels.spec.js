import { test, expect } from '@playwright/test';

// Regression guard for the shared chrome the design-system foundation added:
// every side panel gets a PanelShell header (title + × close), and NodePanel is
// English. These guard against losing those affordances or NodePanel reverting
// to Russian.

const PANELS = [
  ['Edit YAML', 'YAML'],
  ['Add person', 'People'],
  ['Edit connections', 'Connections'],
  ['Settings', 'Settings'],
  ['Daily check-in', 'Daily Check-in'],
];

test.describe('panel shell', () => {
  for (const [rail, title] of PANELS) {
    test(`${title} panel has a title and a close button`, async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: rail }).click();
      await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: 'Close' })).toBeVisible();
    });
  }
});

test.describe('node panel', () => {
  test('is in English, not Russian', async ({ page }) => {
    await page.goto('/');
    await page.locator('svg g.nodes circle').first().click();
    await expect(page.getByPlaceholder('Add note…')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close' })).toBeVisible();
    // no leftover Russian strings
    await expect(page.getByText(/Закрыть|Добавить|Изменить|Удалить/)).toHaveCount(0);
  });
});
