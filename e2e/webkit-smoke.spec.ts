import { test, expect } from '@playwright/test';

test.describe('WebKit smoke', () => {
  test('homepage renders core profile content', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Prasad Kavuri' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Director, AI Platform & Agentic Solutions at Zip/i).first()).toBeVisible();
  });

  test('demos index renders production demo catalogue', async ({ page }) => {
    await page.goto('/demos');

    await expect(page.getByRole('heading', { name: /16 Production AI Modules/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('RAG Pipeline').first()).toBeVisible();
  });
});
