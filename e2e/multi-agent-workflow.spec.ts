import { expect, test } from '@playwright/test';

test.describe('Multi-Agent Workflow', () => {
  test('shows approval checkpoint and releases final output after approval', async ({ page }) => {
    await page.route('**/api/multi-agent', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          website: 'https://example.com',
          total_duration_ms: 1840,
          total_tokens: 980,
          agents: [
            {
              name: 'Analyzer',
              role: 'Technical',
              findings: ['Core flows are clear but trust controls should be more explicit.'],
              recommendation: 'Document baseline architecture decisions.',
              confidence: 84,
              duration_ms: 480,
              tokens: 260,
            },
            {
              name: 'Researcher',
              role: 'Research',
              findings: ['Comparable enterprise sites surface governance controls earlier in workflow views.'],
              recommendation: 'Elevate trust controls in top-third layout.',
              confidence: 81,
              duration_ms: 620,
              tokens: 320,
            },
            {
              name: 'Strategist',
              role: 'Strategy',
              findings: ['Prioritize human approval and trace visibility in output path.'],
              recommendation: 'Ship approval-first workflow with explicit trace panel.',
              confidence: 86,
              duration_ms: 740,
              tokens: 400,
            },
          ],
        }),
      });
    });

    await page.goto('/demos/multi-agent');
    await page.getByRole('button', { name: /Run workflow/i }).click();

    await expect(page.getByText(/Human Approval Required/i)).toBeVisible();
    await expect(page.getByText(/Strategist requires approval to proceed/i)).toBeVisible();

    await page.getByRole('button', { name: /^Approve$/i }).click();

    await expect(page.getByText(/Final Recommendation/i)).toBeVisible();
    await expect(page.getByText(/Ship approval-first workflow with explicit trace panel/i)).toBeVisible();
  });
});

