import { expect, test, type Locator } from '@playwright/test';

async function clickStable(locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  await locator.evaluate((element: Element) => {
    element.scrollIntoView({ block: 'center', inline: 'center' });
    (element as HTMLElement).click();
  });
}

test.describe('World Generation demo', () => {
  test('renders desktop-friendly governed world-generation experience', async ({ page }) => {
    await page.goto('/demos/world-generation');

    await expect(page.getByRole('heading', { name: 'AI Spatial Intelligence & World Generation' })).toBeVisible();
    await expect(page.getByText('Desktop-Friendly', { exact: true })).toBeVisible();
    await expect(page.getByText(/Desktop-friendly:/i)).toBeVisible();
    await expect(page.getByText('World Prompt Input')).toBeVisible();
  });

  test('runs world generation, pauses for approval, then finalizes after approve', async ({ page }) => {
    await page.goto('/demos/world-generation');

    await page.getByRole('button', { name: /Generate governed world/i }).click();

    await expect(page.getByText('Human Approval Required', { exact: true })).toBeVisible();
    await expect(page.getByText('Approval checkpoint', { exact: true })).toBeVisible();
    await expect(page.getByTestId('approval-status-label')).toContainText('Awaiting approval');
    await expect(page.getByTestId('preview-generation-label')).toContainText('Procedural 3D (Fallback Active)');
    await expect(page.locator('[data-testid=\"world-3d-canvas\"], [data-testid=\"world-3d-fallback\"]')).toHaveCount(1);
    await expect(page.getByTestId('scenario-baseline')).toBeVisible();
    await clickStable(page.getByTestId('scenario-safety'));
    await expect(page.getByText(/Safety-optimized scenario/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export GLB' })).toBeVisible();
    await page.getByRole('button', { name: 'Approve' }).evaluate((element) => {
      (element as HTMLButtonElement).click();
    });
    await expect(page.getByText(/Human Approval Required/i)).toBeVisible();
    await expect(page.getByText(/Evaluation: pass/i)).toBeVisible();
    await expect(page.getByTestId('approval-status-label')).toContainText('Approved');
    await expect(page.locator('[data-testid=\"world-3d-canvas\"], [data-testid=\"world-3d-fallback\"]')).toHaveCount(1);
  });

  test('shows export readiness controls for valid generated scenes', async ({ page }) => {
    await page.goto('/demos/world-generation');
    await page.getByRole('button', { name: /Generate governed world/i }).click();

    await expect(page.getByText(/Export status:/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export GLB' })).toBeEnabled();
    await page.getByRole('button', { name: 'Export GLB' }).evaluate((element) => {
      (element as HTMLButtonElement).click();
    });
    await expect(page.getByTestId('export-feedback')).toContainText(/Scene exported:|Export failed — please retry/i);
  });

  test('supports revision request without blanking preview and expanded preview open/close', async ({ page }) => {
    await page.goto('/demos/world-generation');
    await page.getByRole('button', { name: /Generate governed world/i }).click();

    await expect(page.locator('[data-testid=\"world-3d-canvas\"], [data-testid=\"world-3d-fallback\"]')).toHaveCount(1);
    await clickStable(page.getByRole('button', { name: 'Request Revision' }));
    await expect(page.getByTestId('approval-status-label')).toContainText('Revision requested');
    await expect(page.locator('[data-testid=\"world-3d-canvas\"], [data-testid=\"world-3d-fallback\"]')).toHaveCount(1);

    await clickStable(page.getByTestId('expand-preview-button'));
    await expect(page.getByTestId('expanded-preview-modal')).toBeVisible();
    await clickStable(page.getByRole('button', { name: /Close Preview/i }));
    await expect(page.getByTestId('expanded-preview-modal')).toHaveCount(0);
    await expect(page.locator('[data-testid=\"world-3d-canvas\"], [data-testid=\"world-3d-fallback\"]')).toHaveCount(1);
  });

  test('does not show approval when generation payload is missing artifact content', async ({ page }) => {
    await page.route('**/api/demos/world-generation', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'pending_review',
          workflow: [],
          traces: [],
          governance: {
            guardrailsEnforced: true,
            policyValidation: 'pass',
            humanApprovalRequired: true,
            auditTraceId: 'trace-e2e-invalid',
            evaluationStatus: 'review',
          },
          businessValue: ['value'],
          worldArtifact: {
            worldTitle: 'Broken world',
            provider: 'hyworld-adapter',
            providerMode: 'hyworld-adapter',
            availability: 'fallback',
            preview: { width: 2, height: 2, cells: [], legend: [{ type: 'road', label: 'Route corridor' }] },
            assets: {
              meshConcept: 'mesh',
              representation: 'mesh-concept',
              sceneZones: [],
              routeCorridors: [],
              loadingAreas: [],
              pedestrianAreas: [],
              simulationReadiness: 'review',
            },
            sceneSpec: {
              worldId: 'world-broken',
              title: 'scene',
              region: 'Downtown Core',
              objective: 'speed',
              style: 'logistics-grid',
              providerMode: 'hyworld-adapter',
              availability: 'fallback',
              exportReadiness: 'review',
              simulationReadiness: 'review',
              warnings: [],
              primitiveBudget: 42,
              primitives: [],
            },
            notes: ['fallback note'],
          },
          proposedRecommendation: {
            headline: 'headline',
            rationale: 'rationale',
            tradeoffs: ['tradeoff'],
            constraintsApplied: ['constraint'],
            businessImpact: 'impact',
            policyNotes: ['note'],
            alternativesConsidered: ['alt'],
            nextAction: 'approve',
          },
          evaluation: { passed: true, score: 1, checks: [] },
          traceId: 'trace-e2e-invalid',
          scenario: {
            prompt: 'prompt',
            region: 'Downtown Core',
            objective: 'speed',
            style: 'logistics-grid',
            simulationReady: true,
            constraints: {
              budgetLevel: 'medium',
              congestionSensitivity: 'high',
              accessibilityPriority: true,
              policyProfile: 'balanced',
            },
          },
        }),
      });
    });

    await page.goto('/demos/world-generation');
    await page.getByRole('button', { name: /Generate governed world/i }).click();

    await expect(page.getByText(/failed readiness checks/i)).toBeVisible();
    await expect(page.getByText(/failed before a renderable artifact was available/i)).toBeVisible();
    await expect(page.getByText(/Human Approval Required/i)).toHaveCount(0);
  });

  test('rejects unsupported upload safely', async ({ page }) => {
    await page.goto('/demos/world-generation');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'unsafe.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not-an-image'),
    });

    await expect(page.getByText(/Upload rejected:/i)).toBeVisible();
  });

  test('mobile viewport degrades gracefully', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();

    await page.goto('/demos/world-generation');
    await expect(page.getByRole('heading', { name: 'AI Spatial Intelligence & World Generation' })).toBeVisible();
    await expect(page.getByText(/Desktop-friendly:/i)).toBeVisible();

    await context.close();
  });
});
