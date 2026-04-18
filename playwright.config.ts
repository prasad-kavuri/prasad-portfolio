import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
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
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'Mobile-iOS',
      use: { ...devices['iPhone 15 Pro'] },
    },
    {
      name: 'Mobile-Android',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'Mobile-Android-LowEnd',
      use: {
        ...devices['Pixel 5'],
        launchOptions: {
          args: ['--js-flags=--max-old-space-size=256'],
        },
      },
    },
  ],
  // In CI the server is started explicitly in the workflow (npm run start & wait-on).
  // webServer is only used for local dev where no server is running yet.
  webServer: process.env.CI ? undefined : {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
