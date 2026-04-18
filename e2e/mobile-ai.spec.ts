/**
 * Mobile AI routing smoke tests
 *
 * Verifies that the 4 browser-WASM demos degrade gracefully on mobile devices:
 * - No JS crash on load
 * - No blob: CSP errors
 * - AdaptiveExecutionBadge is visible
 * - Touch targets meet minimum size (44×44px)
 * - No horizontal overflow
 *
 * These tests run in simulated mobile contexts; they do NOT trigger real WASM
 * inference (that would require a real browser with full GPU/WASM support).
 *
 * Run: npx playwright test e2e/mobile-ai.spec.ts --project=Mobile-iOS
 */
import { test, expect } from '@playwright/test';

const WASM_DEMOS = [
  { id: 'rag-pipeline', path: '/demos/rag-pipeline', label: 'RAG Pipeline' },
  { id: 'vector-search', path: '/demos/vector-search', label: 'Vector Search' },
  { id: 'multimodal', path: '/demos/multimodal', label: 'Multimodal' },
  { id: 'quantization', path: '/demos/quantization', label: 'Quantization' },
] as const;

test.describe('Mobile AI — no crash on load', () => {
  for (const demo of WASM_DEMOS) {
    test(`${demo.label} loads without JS errors`, async ({ page }) => {
      const jsErrors: string[] = [];
      page.on('pageerror', err => jsErrors.push(err.message));

      await page.goto(demo.path, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');

      // Filter out known benign third-party errors
      const criticalErrors = jsErrors.filter(
        e => !e.includes('ResizeObserver') && !e.includes('Non-Error promise rejection')
      );
      expect(criticalErrors).toHaveLength(0);
    });
  }
});

test.describe('Mobile AI — no blob: CSP violations', () => {
  for (const demo of WASM_DEMOS) {
    test(`${demo.label} has no CSP blob: errors`, async ({ page }) => {
      const cspViolations: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error' && msg.text().includes('Content Security Policy')) {
          cspViolations.push(msg.text());
        }
      });

      await page.goto(demo.path, { waitUntil: 'networkidle' });

      const blobViolations = cspViolations.filter(v => v.includes('blob:'));
      expect(blobViolations).toHaveLength(0);
    });
  }
});

test.describe('Mobile AI — AdaptiveExecutionBadge visible', () => {
  for (const demo of WASM_DEMOS) {
    test(`${demo.label} shows execution mode badge`, async ({ page }) => {
      await page.goto(demo.path, { waitUntil: 'networkidle' });

      // Badge has role="status" per component spec
      const badge = page.getByRole('status').first();
      await expect(badge).toBeVisible({ timeout: 10_000 });
    });
  }
});

test.describe('Mobile AI — touch target compliance', () => {
  for (const demo of WASM_DEMOS) {
    test(`${demo.label} primary button meets 44×44px minimum`, async ({ page }) => {
      await page.goto(demo.path, { waitUntil: 'networkidle' });

      // Find the first actionable button (load model / run demo)
      const primaryBtn = page.getByRole('button').first();
      await expect(primaryBtn).toBeVisible({ timeout: 10_000 });

      const box = await primaryBtn.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.width).toBeGreaterThanOrEqual(44);
      }
    });
  }
});

test.describe('Mobile AI — no horizontal overflow', () => {
  for (const demo of WASM_DEMOS) {
    test(`${demo.label} has no horizontal scroll`, async ({ page }) => {
      await page.goto(demo.path, { waitUntil: 'networkidle' });

      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = page.viewportSize()?.width ?? 390;
      expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 5); // 5px tolerance
    });
  }
});

test.describe('Mobile AI — multi-agent HITL touch targets', () => {
  test('HITL action buttons are at least 44×44px', async ({ page }) => {
    await page.goto('/demos/multi-agent', { waitUntil: 'networkidle' });

    // Trigger a workflow so HITL buttons appear, or verify initial state buttons
    const buttons = page.getByRole('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);

    // Check each visible button meets touch target minimum
    for (let i = 0; i < Math.min(count, 5); i++) {
      const btn = buttons.nth(i);
      const isVisible = await btn.isVisible();
      if (isVisible) {
        const box = await btn.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44);
          expect(box.width).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });
});
