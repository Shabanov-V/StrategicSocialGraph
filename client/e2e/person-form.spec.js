import { test, expect } from '@playwright/test';

// Regression guard for the add-person form.
//
// The PersonForm migration onto the Field/Select primitives was partial: Sector
// and Color-group stayed raw <select> and the text inputs had no width rule, so
// those controls shrank to content while the migrated <Select> fields were
// full-width. The form looked ragged. This asserts every control shares one
// width — i.e. they all stretch to the form.

test('add-person form controls are uniform width', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add person' }).click();

  const controls = page.locator('form').locator('input[type="text"], select');
  // Name, Sector, Circle, Importance, "Who is this?", Color Group
  await expect(controls).toHaveCount(6);

  // The panel animates in, so measure once layout settles: poll the spread of
  // all control widths until it stabilises at ~0 (every control full-width).
  await expect
    .poll(
      async () => {
        const widths = await controls.evaluateAll((els) =>
          els.map((e) => Math.round(e.getBoundingClientRect().width))
        );
        return Math.max(...widths) - Math.min(...widths);
      },
      { message: 'add-person form controls should all be the same (full) width' }
    )
    .toBeLessThanOrEqual(2);
});
