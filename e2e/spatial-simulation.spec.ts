import { expect, test } from '@playwright/test';

test.describe('Spatial Simulation demo', () => {
  test('renders desktop-friendly governed simulation experience', async ({ page }) => {
    await page.goto('/demos/spatial-simulation');

    await expect(page.getByRole('heading', { name: 'AI Spatial Intelligence & Simulation' })).toBeVisible();
    await expect(page.getByText('Desktop-Friendly', { exact: true })).toBeVisible();
    await expect(page.getByText(/Desktop-friendly:/i)).toBeVisible();
    await expect(page.getByText('Scenario Input')).toBeVisible();
  });

  test('runs simulation, pauses for approval, then finalizes after approve', async ({ page }) => {
    await page.goto('/demos/spatial-simulation');

    await page.getByRole('button', { name: /Run governed simulation/i }).click();

    await expect(page.getByText('Human Approval Required', { exact: true })).toBeVisible();
    await expect(page.getByText('Approval checkpoint', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByText(/Human Approval Required/i)).toHaveCount(0);
    await expect(page.getByText(/Evaluation: pass/i)).toBeVisible();
  });

  test('rejects unsupported upload safely', async ({ page }) => {
    await page.goto('/demos/spatial-simulation');

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

    await page.goto('/demos/spatial-simulation');
    await expect(page.getByRole('heading', { name: 'AI Spatial Intelligence & Simulation' })).toBeVisible();
    await expect(page.getByText(/Desktop-friendly:/i)).toBeVisible();

    await context.close();
  });
});
