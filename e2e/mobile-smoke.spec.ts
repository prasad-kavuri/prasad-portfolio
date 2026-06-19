/**
 * Mobile smoke test — iPhone 15 Pro Max (Mobile WebKit)
 *
 * Verifies the Flagship AI Evaluation Showcase loads correctly on a simulated
 * iPhone 15 Pro Max. Uses test.use() to override the project device for this
 * file without modifying the global playwright.config.ts.
 *
 * Run: npx playwright test e2e/mobile-smoke.spec.ts --project=mobile
 */
import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPhone 15 Pro Max'] });

test.describe('Mobile smoke — iPhone 15 Pro Max', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.includes('Mobile') && testInfo.project.name !== 'mobile', 'Mobile smoke test targets mobile device projects');

    // Production CSP upgrades localhost subresources to HTTPS, while the CI
    // test server intentionally serves HTTP. Proxy upgraded asset requests
    // back to that server so mobile checks exercise the fully styled app.
    await page.route('https://localhost:3000/**', async (route) => {
      const response = await page.request.fetch(
        route.request().url().replace('https://localhost:3000', 'http://localhost:3000'),
      );
      await route.fulfill({ response });
    });
  });

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

    // No user-visible horizontal scroll.
    const scrollX = await page.evaluate(() => {
      window.scrollTo(10_000, window.scrollY);
      return window.scrollX;
    });
    expect(scrollX).toBe(0);
  });
});
