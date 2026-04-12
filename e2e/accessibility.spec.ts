/**
 * WCAG 2.1 AA automated accessibility checks via axe-core.
 * Critical violations (axe impact: "critical") fail the test.
 * Serious/moderate/minor violations are logged as warnings.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = [
  { name: 'homepage', path: '/' },
  { name: 'LLM Router demo', path: '/demos/llm-router' },
  { name: 'RAG Pipeline demo', path: '/demos/rag-pipeline' },
];

for (const { name, path } of PAGES) {
  test(`${name} passes WCAG 2.1 AA — no critical violations`, async ({ page }) => {
    await page.goto(path);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    const criticalViolations = results.violations.filter(v => v.impact === 'critical');
    const otherViolations = results.violations.filter(v => v.impact !== 'critical');

    if (otherViolations.length > 0) {
      console.warn(
        `[a11y] ${name} — non-critical violations (${otherViolations.length}):`,
        otherViolations.map(v => `${v.impact}/${v.id}: ${v.description}`)
      );
    }

    if (criticalViolations.length > 0) {
      console.error(
        `[a11y] ${name} — CRITICAL violations:`,
        criticalViolations.map(v => `${v.id}: ${v.description}\n  Nodes: ${v.nodes.map(n => n.html).join(', ')}`)
      );
    }

    expect(
      criticalViolations,
      `${name} has ${criticalViolations.length} critical WCAG violation(s)`
    ).toHaveLength(0);
  });
}
