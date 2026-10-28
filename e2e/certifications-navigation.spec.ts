import { expect, test } from '@playwright/test';

test('certifications has a named home link that navigates to the homepage', async ({ page }) => {
  await page.goto('/certifications');
  const home = page.getByRole('link', { name: 'Back to home' });
  await expect(home).toHaveAttribute('href', '/');
  await home.click();
  await expect(page).toHaveURL(/localhost:3000\/$/);
});
