import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('navbar links scroll to correct sections', async ({ page }) => {
    await page.getByRole('link', { name: 'AI Tools' }).click();
    await expect(page.locator('#tools')).toBeInViewport({ timeout: 10000 });
  });

  test('clicking Experience nav scrolls to experience section', async ({ page }) => {
    // Use href selector to avoid strict mode violation (multiple links contain "Experience")
    await page.locator('a[href="#experience"]').click();
    await expect(page.locator('#experience')).toBeInViewport({ timeout: 10000 });
  });

  test('theme toggle switches between dark and light', async ({ page }) => {
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
    await page.getByRole('button', { name: /toggle theme/i }).click();
    await expect(html).not.toHaveClass(/dark/);
  });

  test('demo card links navigate to demo pages', async ({ page }) => {
    await page.getByText('LLM Router').first().click();
    await expect(page).toHaveURL(/demos\/llm-router/);
    await expect(page.getByText('LLM Router').first()).toBeVisible();
  });

  test('back button on demo page returns to homepage', async ({ page }) => {
    await page.goto('/demos/llm-router');
    // Back button is an icon-only link (<ArrowLeft />) — match by href
    await page.locator('a[href="/"]').click();
    await expect(page).toHaveURL('/');
  });
});
