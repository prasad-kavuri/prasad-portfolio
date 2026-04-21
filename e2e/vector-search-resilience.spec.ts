import { test, expect } from '@playwright/test';

test.describe('Vector Search demo resilience', () => {
  test('mocked backend/model fetch failure does not hard-fail and fallback mode is usable', async ({ page, browserName, isMobile }) => {
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

    await page.goto('/demos/vector-search', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Load Model & Start/i }).click();

    await expect(page.getByText('Local Semantic Model Unavailable')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: /Retry Initialization/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Use Fallback Sample Mode/i })).toBeVisible();

    await page.getByRole('button', { name: /Use Fallback Sample Mode/i }).click();
    await expect(page.getByText(/Fallback sample mode is active/i)).toBeVisible();

    await page.getByPlaceholder(/What is Prasad's AI experience/i).fill('AI platform leadership');
    await page.getByRole('button', { name: /^Search$/i }).click();
    await expect(page.getByText('Top 5 Retrieved Documents')).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /Retry Initialization/i }).click();
    await expect(page.getByText('Loading model...')).toBeVisible({ timeout: 10_000 });

    expect(pageErrors).toEqual([]);
  });
});
