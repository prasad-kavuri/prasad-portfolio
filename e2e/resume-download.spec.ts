import { test, expect } from '@playwright/test';

// Reserved documentation IPs (RFC 5737) used in this file.
// Must NOT overlap with IPs in api.spec.ts (203.0.113.10–13, 203.0.113.250)
// to avoid sharing the in-memory rate-limit bucket.
const RESUME_TEST_IP = '203.0.113.5';

test.describe('Resume Download', () => {
  test('Download Resume link points to resume download API', async ({ page }) => {
    await page.goto('/');
    // Use attribute selector instead of getByRole — avoids visibility/role-resolution
    // differences across browsers and viewport sizes (mobile below-the-fold issue).
    const href = await page.locator('a[href*="resume-download"]').first().getAttribute('href');
    expect(href).toContain('resume');
  });

  test('resume download API redirects to PDF', async ({ page }) => {
    // Explicit x-forwarded-for prevents sharing the in-memory rate-limit bucket
    // with other tests that omit this header (fallback: 'anonymous').
    const response = await page.request.get('/api/resume-download', {
      headers: { 'x-forwarded-for': RESUME_TEST_IP },
    });
    expect([200, 302, 307, 308]).toContain(response.status());
  });
});
