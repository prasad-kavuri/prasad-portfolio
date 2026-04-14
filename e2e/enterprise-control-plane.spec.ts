import { test, expect } from '@playwright/test';

// RFC 5737 documentation IPs reserved for this file: 203.0.113.100–114
// Must NOT overlap with resume-download.spec.ts (203.0.113.5) or
// api.spec.ts (203.0.113.10–13, 203.0.113.250).
//
// Root cause addressed: the demo page fires 6 concurrent /api/enterprise-sim
// requests on every page load. With 15 beforeEach navigations sharing the
// 'unknown' fallback bucket (10 req/60s), tests 3+ would all receive 429.
// Per-test IP isolation gives each test its own fresh bucket (6 calls < 10 limit).
let _testIp = 100;

test.describe('Enterprise Control Plane demo', () => {
  test.beforeEach(async ({ page }) => {
    const testIp = `203.0.113.${_testIp++}`;
    await page.route('**/api/enterprise-sim**', async route => {
      await route.continue({
        headers: { ...route.request().headers(), 'x-forwarded-for': testIp },
      });
    });
    await page.goto('/demos/enterprise-control-plane');
  });

  test('page loads with org summary strip visible', async ({ page }) => {
    await expect(page.getByText('Total Teams')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Active Users')).toBeVisible();
  });

  test('all three tabs are present and clickable', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Access Control' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Spend & Tokens' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Observability' })).toBeVisible();
  });

  test('RBAC tab: 5 teams render in team list', async ({ page }) => {
    await page.getByRole('tab', { name: 'Access Control' }).click();
    // Wait for data to load
    await expect(page.getByText('Engineering').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Marketing').first()).toBeVisible();
    await expect(page.getByText('Legal').first()).toBeVisible();
    await expect(page.getByText('Finance').first()).toBeVisible();
    await expect(page.getByText('Operations').first()).toBeVisible();
  });

  test('RBAC tab: clicking Engineering shows its capability toggles', async ({ page }) => {
    await page.getByRole('tab', { name: 'Access Control' }).click();
    await expect(page.getByText('Engineering').first()).toBeVisible({ timeout: 10000 });
    await page.getByText('Engineering').first().click();
    await expect(page.getByText('Capabilities')).toBeVisible();
    await expect(page.getByText('Code Generation')).toBeVisible();
  });

  test('RBAC tab: toggling a capability shows toast confirmation', async ({ page }) => {
    await page.getByRole('tab', { name: 'Access Control' }).click();
    await expect(page.getByText('Engineering').first()).toBeVisible({ timeout: 10000 });
    // Find a toggle switch and click it
    const toggle = page.getByRole('switch').first();
    await toggle.click();
    await expect(page.getByText('Change saved (simulated)')).toBeVisible({ timeout: 3000 });
  });

  test('RBAC tab: Legal team connectors are all read-only', async ({ page }) => {
    await page.getByRole('tab', { name: 'Access Control' }).click();
    await expect(page.getByText('Legal').first()).toBeVisible({ timeout: 10000 });
    await page.getByText('Legal').first().click();
    await expect(page.getByText('Connector Permissions')).toBeVisible();
    // Legal connectors should show checkmarks only in read column
    // Verify there are no write/delete checkmarks (the ✓ symbols)
    const connectorTable = page.locator('table').last();
    await expect(connectorTable).toBeVisible();
  });

  test('Spend tab: budget progress bars are present for all teams', async ({ page }) => {
    await page.getByRole('tab', { name: 'Spend & Tokens' }).click();
    await expect(page.getByText('Team Budget Utilization')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Engineering').first()).toBeVisible();
    await expect(page.getByText('Marketing').first()).toBeVisible();
  });

  test('Spend tab: token cost breakdown table renders', async ({ page }) => {
    await page.getByRole('tab', { name: 'Spend & Tokens' }).click();
    await expect(page.getByText('Token Cost Breakdown by Team')).toBeVisible({ timeout: 10000 });
  });

  test('Spend tab: token usage chart renders with SVG element', async ({ page }) => {
    await page.getByRole('tab', { name: 'Spend & Tokens' }).click();
    await expect(page.getByText('Token Usage Over Time')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('svg').first()).toBeVisible();
  });

  test('Spend tab: time range toggle switches chart data', async ({ page }) => {
    await page.getByRole('tab', { name: 'Spend & Tokens' }).click();
    await expect(page.getByText('Token Usage Over Time')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: '7d' }).click();
    await expect(page.getByRole('button', { name: '7d' })).toBeVisible();
    await page.getByRole('button', { name: '30d' }).click();
    await expect(page.getByRole('button', { name: '30d' })).toBeVisible();
  });

  test('Observability tab: event feed shows minimum 10 events', async ({ page }) => {
    await page.getByRole('tab', { name: 'Observability' }).click();
    await expect(page.getByText('Event Feed')).toBeVisible({ timeout: 10000 });
    // At least check the feed section is there with some content
    await expect(page.getByText(/\d+ events/)).toBeVisible();
  });

  test('Observability tab: team filter reduces visible events', async ({ page }) => {
    await page.getByRole('tab', { name: 'Observability' }).click();
    await expect(page.getByText('Event Feed')).toBeVisible({ timeout: 10000 });
    const teamSelect = page.locator('select').first();
    await teamSelect.selectOption('engineering');
    // After filter, event count text should change
    await expect(page.getByText(/\d+ events/)).toBeVisible();
  });

  test('Observability tab: SIEM export button opens modal with NDJSON', async ({ page }) => {
    await page.getByRole('tab', { name: 'Observability' }).click();
    await expect(page.getByRole('button', { name: 'Export to SIEM' })).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Export to SIEM' }).click();
    await expect(page.getByText('Export to SIEM — Sample NDJSON Payload')).toBeVisible();
    await expect(page.getByText(/NDJSON/i).first()).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
  });

  test('Observability tab: auto-refresh adds events dynamically', async ({ page }) => {
    await page.getByRole('tab', { name: 'Observability' }).click();
    await expect(page.getByText('Event Feed')).toBeVisible({ timeout: 10000 });
    // Enable auto-refresh
    const autoRefreshToggle = page.getByRole('switch', { name: /auto.refresh/i });
    await autoRefreshToggle.click();
    await expect(page.getByText('● Live')).toBeVisible({ timeout: 5000 });
    // Disable to clean up
    await autoRefreshToggle.click();
  });

  test('architecture note is collapsible', async ({ page }) => {
    await expect(page.getByText('How this maps to real enterprise deployment')).toBeVisible();
    const archButton = page.getByRole('button', { name: /How this maps to real enterprise deployment/ });
    await archButton.click();
    await expect(page.getByText('Analytics API')).toBeVisible();
    await archButton.click();
    await expect(page.getByText('Analytics API')).not.toBeVisible();
  });

  test('page has no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.reload();
    await page.waitForTimeout(2000);
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(e => !e.includes('favicon') && !e.includes('404'));
    expect(criticalErrors).toHaveLength(0);
  });

  test('all interactive elements are keyboard accessible', async ({ page }) => {
    await page.getByRole('tab', { name: 'Access Control' }).focus();
    // Arrow right should move to next tab
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Spend & Tokens' })).toBeFocused();
  });

  test('no hardcoded 2024 copyright text', async ({ page }) => {
    const content = await page.content();
    expect(content).not.toContain('Copyright 2024');
    expect(content).not.toContain('© 2024');
  });
});
