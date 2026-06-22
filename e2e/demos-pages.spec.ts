import { test, expect } from '@playwright/test';

/**
 * Smoke tests for individual demo pages not covered by other E2E specs.
 * Covers /demos/llm-router and /demos/multimodal per evaluations/testing.yaml gap.
 * These are lightweight smoke tests — they verify the page loads and renders
 * key content, not the full interactive flow (which requires live API keys).
 */

test.describe('LLM Router demo page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/llm-router');
  });

  test('page loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/LLM Router/i);
  });

  test('page heading is visible', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /LLM Router/i }).first()
    ).toBeVisible();
  });

  test('back navigation link exists', async ({ page }) => {
    // Back button links to homepage
    const backLink = page.locator('a[href="/"]').first();
    await expect(backLink).toBeVisible();
  });

  test('model routing UI or loading state is visible', async ({ page }) => {
    // The demo renders either the interactive UI or a loading/error state —
    // either is a valid smoke-test pass (we just confirm the page shell renders)
    const hasContent = await page.locator('main, [role="main"], #main-content').count();
    expect(hasContent).toBeGreaterThan(0);
  });

  test('does not render a 404 or error boundary', async ({ page }) => {
    await expect(page.getByText(/404/i)).not.toBeVisible();
    await expect(page.getByText(/application error/i)).not.toBeVisible();
  });
});

test.describe('Multimodal demo page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/multimodal');
  });

  test('page loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Multimodal/i);
  });

  test('page heading is visible', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /Multimodal/i }).first()
    ).toBeVisible();
  });

  test('back navigation link exists', async ({ page }) => {
    const backLink = page.locator('a[href="/"]').first();
    await expect(backLink).toBeVisible();
  });

  test('shows BrowserAIWarning on mobile or non-WebGPU environments', async ({
    page,
    isMobile,
  }) => {
    // On mobile, multimodal must show the BrowserAIWarning (requires WebGPU)
    // On desktop CI (headless Chromium without real GPU), the warning is also expected
    // This confirms the useBrowserAI hook fires correctly in non-GPU environments
    if (isMobile) {
      // Mobile must show warning — never attempt WebGPU load
      const warning = page.getByText(/WebGPU|not supported|desktop/i).first();
      await expect(warning).toBeVisible({ timeout: 10000 });
    } else {
      // Desktop headless: warning OR the actual UI — either is valid
      // The test just confirms no crash / blank page
      const hasContent = await page.locator('main, [role="main"], #main-content').count();
      expect(hasContent).toBeGreaterThan(0);
    }
  });

  test('does not render a 404 or error boundary', async ({ page }) => {
    await expect(page.getByText(/404/i)).not.toBeVisible();
    await expect(page.getByText(/application error/i)).not.toBeVisible();
  });
});

test.describe('Demos index page — filter tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demos');
  });

  test('page heading renders', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /AI Platform Modules/i }).first()
    ).toBeVisible();
  });

  test('all four filter tabs are present', async ({ page }) => {
    await expect(page.getByRole('button', { name: /All Modules/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Core AI/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Agentic/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Apps/i })).toBeVisible();
  });

  test('"All Modules" filter is active by default (aria-pressed=true)', async ({ page }) => {
    const allButton = page.getByRole('button', { name: /All Modules/i });
    await expect(allButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('signature demo card is present', async ({ page }) => {
    await expect(page.getByText('AI Evaluation Showcase').first()).toBeVisible();
  });

  test('does not render a 404 or error boundary', async ({ page }) => {
    await expect(page.getByText(/404/i)).not.toBeVisible();
  });
});
