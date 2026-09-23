import { expect, test } from '@playwright/test';

test.describe('Multi-Agent Workflow', () => {
  test('shows approval checkpoint and releases final output after approval', async ({ page }) => {
    const approvalId = `apr_${'1'.repeat(32)}`;
    let decideBody: Record<string, unknown> | null = null;
    await page.route('**/api/multi-agent**', async (route) => {
      const requestBody = route.request().postDataJSON() as Record<string, unknown>;
      if (requestBody.action === 'decide') {
        decideBody = requestBody;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'released',
            releasedRecommendation: 'Ship approval-first workflow with explicit trace panel.',
            edited: false,
            approvalMode: 'human',
            receipt: { approvalId, decision: 'approved', payloadHash: 'a'.repeat(64), createdAt: new Date().toISOString(), decidedAt: new Date().toISOString() },
          }),
        });
        return;
      }
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
          approval: { status: 'pending', approvalId, expiresAt: new Date(Date.now() + 900_000).toISOString(), payloadHash: 'a'.repeat(64) },
        }),
      });
    });

    await page.goto('/demos/multi-agent');
    const responsePromise = page.waitForResponse((response) => response.url().includes('/api/multi-agent'));
    await page.getByLabel('Start multi-agent analysis workflow').click();
    await responsePromise;

    await expect(page.getByLabel('Approve strategist recommendation and finalize workflow')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/Strategist requires approval to proceed/i)).toBeVisible({ timeout: 20000 });

    await page.getByLabel('Approve strategist recommendation and finalize workflow').click();

    await expect(page.getByText(/Final Recommendation/i)).toBeVisible();
    await expect(page.getByText(/Ship approval-first workflow with explicit trace panel/i).first()).toBeVisible();
    // The release is recorded by the server, not asserted by the client (SPEC-0020).
    expect(decideBody).toMatchObject({ action: 'decide', approvalId, decision: 'approve' });
    await expect(page.getByTestId('release-receipt')).toContainText(/single use/i);
  });
});
