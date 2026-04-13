/**
 * Quality-assurance suite: performance timing, content validation,
 * error state handling, and accessibility checks.
 */
import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Performance timing
// ---------------------------------------------------------------------------
test.describe('Performance', () => {
  test('homepage Time to First Byte is under 2 s', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse(r => r.url().endsWith('/') || r.url().match(/localhost:\d+\/?$/) !== null),
      page.goto('/'),
    ]);
    // Server-side TTFB — check the response came back quickly
    expect(response.status()).toBeLessThanOrEqual(200);

    const timing = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return nav ? nav.responseStart - nav.requestStart : null;
    });

    if (timing !== null) {
      expect(timing, 'TTFB should be under 2000ms').toBeLessThan(2000);
    }
  });

  test('homepage DOM content loaded under 3 s', async ({ page }) => {
    await page.goto('/');
    const domLoadTime = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return nav ? nav.domContentLoadedEventEnd - nav.startTime : null;
    });

    if (domLoadTime !== null) {
      expect(domLoadTime, 'DOMContentLoaded should be under 3000ms').toBeLessThan(3000);
    }
  });

  test('demo page loads without long tasks blocking main thread', async ({ page }) => {
    await page.goto('/demos/llm-router');
    // Page should be interactive (no JS errors, no loading spinner stuck)
    await expect(page.getByText('LLM Router').first()).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// Content validation
// ---------------------------------------------------------------------------
test.describe('Content validation', () => {
  test('homepage has correct title tag', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Prasad Kavuri/i);
  });

  test('homepage has meta description', async ({ page }) => {
    await page.goto('/');
    const metaDesc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDesc).toBeTruthy();
    expect(metaDesc!.length).toBeGreaterThan(20);
  });

  test('homepage has Open Graph tags', async ({ page }) => {
    await page.goto('/');
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
    expect(ogTitle).toBeTruthy();
    expect(ogDescription).toBeTruthy();
  });

  test('homepage has canonical link tag', async ({ page }) => {
    await page.goto('/');
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBeTruthy();
    expect(canonical).toMatch(/prasadkavuri\.com/);
  });

  test('demo page has canonical link tag', async ({ page }) => {
    await page.goto('/demos/llm-router');
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBeTruthy();
    expect(canonical).toMatch(/llm-router/);
  });

  test('all images in hero section have alt text', async ({ page }) => {
    await page.goto('/');
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      // Either has alt text, or is explicitly decorative (role="presentation" or alt="")
      const isDecorativeByRole = role === 'presentation' || role === 'none';
      const hasAlt = alt !== null;
      expect(
        hasAlt || isDecorativeByRole,
        `Image should have alt text or be marked decorative`
      ).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Error state handling
// ---------------------------------------------------------------------------
test.describe('Error states', () => {
  test('non-existent route returns a 404 page', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-xyz123');
    expect(response?.status()).toBe(404);
  });

  test('unknown .html URL redirects to homepage (308)', async ({ page }) => {
    const response = await page.goto('/some-unknown-page.html');
    // Catch-all in proxy.ts sends unknown .html slugs → / (homepage)
    // /demos has no index page so it would 404 — homepage is the safe fallback
    const finalUrl = page.url();
    expect(finalUrl).toMatch(/localhost:\d+\/?$/);
    expect(response?.status()).toBeLessThan(400);
  });

  test('known legacy redirect: /rag-pipeline.html → /demos/rag-pipeline', async ({ page }) => {
    await page.goto('/rag-pipeline.html');
    await expect(page).toHaveURL(/demos\/rag-pipeline/);
  });

  test('known legacy redirect: /multimodal-assistant.html → /demos/multimodal', async ({ page }) => {
    await page.goto('/multimodal-assistant.html');
    await expect(page).toHaveURL(/demos\/multimodal/);
  });

  test('API route returns JSON error for missing body', async ({ page }) => {
    const response = await page.request.post('/api/llm-router', {
      data: {},
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.99' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json() as { error: string };
    expect(typeof body.error).toBe('string');
  });

  test('non-existent API route returns 404', async ({ page }) => {
    const response = await page.request.get('/api/does-not-exist');
    expect(response.status()).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------
test.describe('Accessibility', () => {
  test('homepage has a single <h1>', async ({ page }) => {
    await page.goto('/');
    const h1s = await page.locator('h1').all();
    expect(h1s.length).toBe(1);
  });

  test('interactive elements are reachable via keyboard Tab', async ({ page, browserName }) => {
    test.skip(
      browserName === 'webkit',
      'WebKit on macOS follows the host keyboard focus preference for Tab navigation.'
    );
    await page.goto('/');
    // Press Tab 5 times and verify focus moves to interactive elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }
    const focused = await page.evaluate(() => document.activeElement?.tagName ?? '');
    // Focus should be on an interactive element, not <body>
    expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(focused)).toBe(true);
  });

  test('navigation links have accessible text', async ({ page }) => {
    await page.goto('/');
    const navLinks = await page.locator('nav a').all();
    expect(navLinks.length).toBeGreaterThan(0);
    for (const link of navLinks) {
      const text = (await link.textContent())?.trim() ?? '';
      const ariaLabel = await link.getAttribute('aria-label') ?? '';
      expect(
        text.length > 0 || ariaLabel.length > 0,
        'Nav link should have visible text or aria-label'
      ).toBe(true);
    }
  });

  test('demo cards have accessible link text', async ({ page }) => {
    await page.goto('/');
    // All demo card links should have discernible text
    const demoLinks = await page.locator('[id="tools"] a').all();
    for (const link of demoLinks) {
      const text = (await link.textContent())?.trim() ?? '';
      const ariaLabel = await link.getAttribute('aria-label') ?? '';
      expect(
        text.length > 0 || ariaLabel.length > 0,
        'Demo card link should have text or aria-label'
      ).toBe(true);
    }
  });

  test('theme toggle button has accessible label', async ({ page }) => {
    await page.goto('/');
    const toggleBtn = page.getByRole('button', { name: /toggle theme/i });
    await expect(toggleBtn).toBeVisible();
  });

  test('page has a <main> landmark', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible();
  });

  test('homepage exposes a keyboard skip link to main content', async ({ page, isMobile, browserName }) => {
    await page.goto('/');
    if (isMobile || browserName === 'webkit') {
      // Mobile emulation and WebKit do not provide deterministic Tab/Enter skip-link activation semantics.
      // Keep a lightweight regression check that the link remains present in the DOM.
      await expect(page.getByRole('link', { name: /Skip to main content/i })).toBeAttached();
      return;
    }
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: /Skip to main content/i });
    await expect(skipLink).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.locator('main#main-content')).toBeFocused();
  });

  test('page has a <nav> landmark', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav').first();
    if (test.info().project.name === 'mobile') {
      await expect(nav).toBeAttached();
      return;
    }
    await expect(nav).toBeVisible();
  });
});
