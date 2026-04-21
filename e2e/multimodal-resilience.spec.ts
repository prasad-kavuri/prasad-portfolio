import { test, expect } from '@playwright/test';

test.describe('Multimodal demo resilience', () => {
  test('keeps page usable when backend/model fetch fails', async ({ page, browserName, isMobile }) => {
    test.skip(browserName !== 'chromium' || isMobile, 'Failure-path recovery is validated on desktop Chromium.');
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'gpu', {
        configurable: true,
        value: {},
      });
    });

    await page.route('**/*', async (route) => {
      const url = route.request().url();
      if (
        url.includes('huggingface.co') ||
        url.includes('cdn.jsdelivr.net/npm/onnxruntime-web') ||
        url.includes('unpkg.com/onnxruntime-web')
      ) {
        await route.abort();
        return;
      }
      await route.continue();
    });

    await page.goto('/demos/multimodal', { waitUntil: 'domcontentloaded' });

    const primaryCta = page.getByRole('button', {
      name: /Load Models & Start|Try Simulated Demo/i,
    }).first();
    await expect(primaryCta).toBeVisible({ timeout: 10_000 });
    await primaryCta.click();

    const degradedCard = page.getByText('Local Inference Assets Unavailable');
    const retryButton = page.getByRole('button', { name: /Retry Initialization/i });
    const simulateButton = page.getByRole('button', { name: /Switch to Simulated Demo/i });

    await expect(degradedCard).toBeVisible({ timeout: 20_000 });
    await expect(retryButton).toBeVisible();
    await expect(simulateButton).toBeVisible();

    await simulateButton.click();
    await expect(page.getByText(/Simulated demo mode is active/i)).toBeVisible();
    await expect(page.getByText(/Drag & drop an image or click to browse/i)).toBeVisible();

    await retryButton.click();
    await expect(page.getByText('Loading models...')).toBeVisible({ timeout: 10_000 });
    await expect(degradedCard).toBeVisible({ timeout: 20_000 });

    expect(pageErrors).toEqual([]);
  });
});
