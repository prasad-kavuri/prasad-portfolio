/**
 * Mobile smoke test — iPhone 15 Pro Max (Mobile WebKit)
 *
 * Verifies the Flagship AI Evaluation Showcase loads correctly on a simulated
 * iPhone 15 Pro Max. Uses test.use() to override the project device for this
 * file without modifying the global playwright.config.ts.
 *
 * Run: npx playwright test e2e/mobile-smoke.spec.ts --project=webkit
 */
import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPhone 15 Pro Max'] });

test.describe('Mobile smoke — iPhone 15 Pro Max', () => {
  test('AI Evaluation Showcase loads and shows key headings', async ({ page }) => {
    await page.goto('/demos/evaluation-showcase');

    // Page title / main heading is visible
    await expect(
      page.getByRole('heading', { name: /evaluation/i }).first()
    ).toBeVisible({ timeout: 15_000 });

    // No unhandled JS errors on load
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('AI Evaluation Showcase renders a Run Evaluation or similar CTA', async ({ page }) => {
    await page.goto('/demos/evaluation-showcase');
    await page.waitForLoadState('networkidle');

    // At least one interactive button is visible (run / evaluate / submit)
    const cta = page.getByRole('button').first();
    await expect(cta).toBeVisible({ timeout: 10_000 });
  });

  test('homepage loads on mobile without layout overflow', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // The page heading is visible (use role to avoid strict-mode violation from nav/footer duplicates)
    await expect(page.getByRole('heading', { name: 'Prasad Kavuri' })).toBeVisible({ timeout: 10_000 });

    // No horizontal scroll (body width should not exceed viewport)
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width ?? 430;
    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 5); // 5px tolerance
  });
});
