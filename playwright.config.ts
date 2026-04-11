import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      // API tests share the in-memory rate-limit bucket with chromium;
      // running them again in webkit exhausts 'anonymous' and causes false 429s.
      // HTTP-level validation is browser-agnostic — chromium coverage is sufficient.
      testIgnore: ['**/api.spec.ts'],
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      // Same rate-limit bucket issue for API tests.
      // Desktop navbar links are hidden on mobile (hamburger layout) —
      // navigation.spec.ts tests desktop-only nav interactions.
      testIgnore: ['**/api.spec.ts', '**/navigation.spec.ts'],
    },
  ],
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
