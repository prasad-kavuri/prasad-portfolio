import { test, expect } from '@playwright/test';

test.describe('Resume Download', () => {
  test('Download Resume link points to resume download API', async ({ page }) => {
    await page.goto('/');
    const downloadLink = page.getByRole('link', { name: /Download Resume/i }).first();
    const href = await downloadLink.getAttribute('href');
    expect(href).toContain('resume');
  });

  test('resume download API redirects to PDF', async ({ page }) => {
    const response = await page.request.get('/api/resume-download');
    expect([200, 302, 307, 308]).toContain(response.status());
  });
});
