import { expect, test } from '@playwright/test';

test.describe('World Generation demo', () => {
  test('renders desktop-friendly governed world-generation experience', async ({ page }) => {
    await page.goto('/demos/world-generation');

    await expect(page.getByRole('heading', { name: 'AI Spatial Intelligence & World Generation' })).toBeVisible();
    await expect(page.getByText('Desktop-Friendly', { exact: true })).toBeVisible();
    await expect(page.getByText(/Desktop-friendly:/i)).toBeVisible();
    await expect(page.getByText('World Prompt Input')).toBeVisible();
  });

  test('runs world generation, pauses for approval, then finalizes after approve', async ({ page }) => {
    await page.goto('/demos/world-generation');

    await page.getByRole('button', { name: /Generate governed world/i }).click();

    await expect(page.getByText('Human Approval Required', { exact: true })).toBeVisible();
    await expect(page.getByText('Approval checkpoint', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByText(/Human Approval Required/i)).toHaveCount(0);
    await expect(page.getByText(/Evaluation: pass/i)).toBeVisible();
  });

  test('rejects unsupported upload safely', async ({ page }) => {
    await page.goto('/demos/world-generation');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'unsafe.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not-an-image'),
    });

    await expect(page.getByText(/Upload rejected:/i)).toBeVisible();
  });

  test('mobile viewport degrades gracefully', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();

    await page.goto('/demos/world-generation');
    await expect(page.getByRole('heading', { name: 'AI Spatial Intelligence & World Generation' })).toBeVisible();
    await expect(page.getByText(/Desktop-friendly:/i)).toBeVisible();

    await context.close();
  });
});
