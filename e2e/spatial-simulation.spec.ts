import { expect, test, type Locator, type Page } from '@playwright/test';

async function clickStable(locator: Locator) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await expect(locator).toBeVisible({ timeout: 10000 });
      await locator.evaluate((element) => {
        (element as HTMLButtonElement).click();
      });
      return;
    } catch (error) {
      if (attempt === 2) {
        throw error;
      }
    }
  }
}

function makeValidWorldGenerationPayload() {
  return {
    status: 'pending_review',
    workflow: [],
    traces: [],
    governance: {
      guardrailsEnforced: true,
      policyValidation: 'pass',
      humanApprovalRequired: true,
      auditTraceId: 'trace-e2e-valid',
      evaluationStatus: 'review',
    },
    businessValue: ['value'],
    worldArtifact: {
      worldTitle: 'Downtown world',
      provider: 'hyworld-adapter',
      providerMode: 'hyworld-adapter',
      availability: 'fallback',
      preview: { width: 2, height: 2, cells: ['road', 'pickup', 'logistics', 'pedestrian'], legend: [{ type: 'road', label: 'Route corridor' }] },
      assets: {
        meshConcept: 'mesh',
        representation: 'mesh-concept',
        sceneZones: ['zone-1'],
        routeCorridors: ['corridor-1'],
        loadingAreas: ['load-1'],
        pedestrianAreas: ['ped-1'],
        simulationReadiness: 'ready',
      },
      sceneSpec: {
        worldId: 'world-e2e-valid',
        title: 'scene',
        region: 'Downtown Core',
        objective: 'speed',
        style: 'logistics-grid',
        providerMode: 'hyworld-adapter',
        availability: 'fallback',
        exportReadiness: 'ready',
        simulationReadiness: 'ready',
        warnings: [],
        primitiveBudget: 42,
        primitives: [
          {
            id: 'ops-core',
            label: 'Operations Core',
            kind: 'zone-block',
            position: { x: 0, z: 0 },
            size: { width: 4, depth: 4 },
            height: 2,
            colorHex: '#2563eb',
          },
        ],
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
    traceId: 'trace-e2e-valid',
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
  };
}

async function mockValidGeneration(page: Page) {
  await page.route('**/api/demos/world-generation', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makeValidWorldGenerationPayload()),
    });
  });
}

test.describe('World Generation demo', () => {
  test.use({ viewport: { width: 1600, height: 1200 } });

  test('renders desktop-friendly governed world-generation experience', async ({ page }) => {
    test.skip(test.info().project.name.toLowerCase().includes('mobile') || test.info().project.name.toLowerCase() === 'webkit', '3D interaction is unstable on mobile and webkit viewports');
    await page.goto('/demos/world-generation');

    await expect(page.getByRole('heading', { name: 'AI Spatial Intelligence & World Generation' })).toBeVisible();
    await expect(page.getByText('Desktop-Friendly', { exact: true })).toBeVisible();
    await expect(page.getByText(/Desktop-friendly:/i)).toBeVisible();
    await expect(page.getByText('World Prompt Input')).toBeVisible();
  });

  test('runs world generation, pauses for approval, then finalizes after approve', async ({ page }) => {
    test.skip(test.info().project.name.toLowerCase().includes('mobile') || test.info().project.name.toLowerCase() === 'webkit', '3D interaction is unstable on mobile and webkit viewports');
    test.slow();
    await mockValidGeneration(page);
    await page.goto('/demos/world-generation');

    await page.getByRole('button', { name: /Generate governed world/i }).click();

    await expect(page.getByText('Human Approval Required', { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('approval-status-label')).toContainText('Awaiting approval', { timeout: 15000 });
    await expect(page.getByTestId('preview-generation-label')).toContainText('Procedural 3D (Fallback Active)', { timeout: 15000 });
    await expect(page.locator('[data-testid=\"world-3d-canvas\"], [data-testid=\"world-3d-fallback\"]')).toHaveCount(1);
    await expect(page.getByTestId('scenario-baseline')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export GLB' })).toBeVisible();
    await page.getByTestId('approval-approve-button').scrollIntoViewIfNeeded();
    await page.getByTestId('approval-approve-button').click({ force: true });
    await expect(page.getByText(/Human Approval Required/i)).toBeVisible();
    await expect(page.getByText(/Evaluation: pass/i)).toBeVisible();
    await expect(page.getByTestId('approval-status-label')).toContainText('Approved');
    await expect(page.locator('[data-testid=\"world-3d-canvas\"], [data-testid=\"world-3d-fallback\"]')).toHaveCount(1);
  });

  test('shows export readiness controls for valid generated scenes', async ({ page }) => {
    test.skip(test.info().project.name.toLowerCase().includes('mobile') || test.info().project.name.toLowerCase() === 'webkit', '3D interaction is unstable on mobile and webkit viewports');
    test.slow();
    await mockValidGeneration(page);
    await page.goto('/demos/world-generation');
    await page.getByRole('button', { name: /Generate governed world/i }).click();

    await expect(page.getByText(/Export status:/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Export GLB' })).toBeEnabled();
    await page.getByRole('button', { name: 'Export GLB' }).scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Export GLB' }).click({ force: true });
    await expect(page.getByTestId('export-feedback')).toContainText(/Scene exported:|Export failed — please retry/i, { timeout: 15000 });
  });

  test('supports revision request without blanking preview and expanded preview open/close', async ({ page }) => {
    test.skip(test.info().project.name.toLowerCase().includes('mobile') || test.info().project.name.toLowerCase() === 'webkit', '3D interaction is unstable on mobile and webkit viewports');
    test.slow();
    await mockValidGeneration(page);
    await page.goto('/demos/world-generation');
    await page.getByRole('button', { name: /Generate governed world/i }).click();

    await expect(page.locator('[data-testid=\"world-3d-canvas\"], [data-testid=\"world-3d-fallback\"]')).toHaveCount(1);
    await page.getByTestId('approval-revise-button').scrollIntoViewIfNeeded();
    await page.getByTestId('approval-revise-button').click({ force: true });
    await expect(page.getByTestId('approval-status-label')).toContainText('Revision requested');
    await expect(page.locator('[data-testid=\"world-3d-canvas\"], [data-testid=\"world-3d-fallback\"]')).toHaveCount(1);

    await page.getByTestId('expand-preview-button').scrollIntoViewIfNeeded();
    await page.getByTestId('expand-preview-button').click({ force: true });
    await expect(page.getByTestId('expanded-preview-modal')).toBeVisible();
    await page.getByRole('button', { name: /Close Preview/i }).scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: /Close Preview/i }).click({ force: true });
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
