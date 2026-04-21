import { test, expect } from '@playwright/test';

test.describe('Quantization demo resilience', () => {
  test('mocked backend/model fetch failure does not hard-fail and simulated benchmark mode is usable', async ({ page, browserName, isMobile }) => {
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

    await page.goto('/demos/quantization', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Load Models & Start Benchmark/i }).click();

    await expect(page.getByText('Local Benchmark Models Unavailable')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: /Retry Initialization/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Use Simulated Benchmark Mode/i })).toBeVisible();

    await page.getByRole('button', { name: /Use Simulated Benchmark Mode/i }).click();
    await expect(page.getByText(/Simulated benchmark mode is active/i)).toBeVisible();

    await page.getByPlaceholder(/Enter text to analyze/i).fill('This product is excellent.');
    await page.getByRole('button', { name: /Run Benchmark/i }).click();
    await expect(page.getByText('Comparison Summary')).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /Retry Initialization/i }).click();
    await expect(page.getByText('Loading FP32 model...')).toBeVisible({ timeout: 10_000 });

    expect(pageErrors).toEqual([]);
  });
});
