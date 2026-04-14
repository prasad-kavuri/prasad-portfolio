/**
 * WCAG 2.2 automated accessibility checks via axe-core.
 *
 * Strategy: fail only on "critical" impact violations to block genuine
 * regressions while treating serious/moderate/minor as warnings in CI.
 * Data-vis pages exclude color-contrast (charts use intentional semantic colors).
 *
 * Rules: wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa
 * Run locally: npx playwright test accessibility.spec.ts
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Pages that auto-fetch from API routes on load (/demos/enterprise-control-plane,
// /governance) are intentionally excluded here — they exhaust the shared in-memory
// rate-limit bucket (10 req/60s, 'unknown' IP) when combined with the
// enterprise-control-plane.spec.ts beforeAll running concurrently (workers: 2).
// Those pages are covered by their own dedicated specs.
const PAGES = [
  { name: 'homepage',                    path: '/' },
  { name: 'LLM Router demo',             path: '/demos/llm-router' },
  { name: 'RAG Pipeline demo',           path: '/demos/rag-pipeline' },
  { name: 'MCP demo',                    path: '/demos/mcp-demo' },
  { name: 'Multi-Agent demo',            path: '/demos/multi-agent' },
  { name: 'Resume Generator demo',       path: '/demos/resume-generator' },
];

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

for (const { name, path } of PAGES) {
  test(`[a11y] ${name} has no critical WCAG violations`, async ({ page }) => {
    await page.goto(path);

    const builder = new AxeBuilder({ page }).withTags(TAGS);
    const results = await builder.analyze();

    const critical = results.violations.filter(v => v.impact === 'critical');
    const other    = results.violations.filter(v => v.impact !== 'critical');

    if (other.length > 0) {
      console.warn(
        `[a11y] ${name} — non-critical violations (${other.length}):`,
        other.map(v => `${v.impact}/${v.id}: ${v.description}`)
      );
    }
    if (critical.length > 0) {
      console.error(
        `[a11y] ${name} — CRITICAL violations:`,
        critical.map(v => `${v.id}: ${v.description}\n  Nodes: ${v.nodes.map(n => n.html).join(', ')}`)
      );
    }

    expect(
      critical,
      `${name} has ${critical.length} critical WCAG violation(s)`
    ).toHaveLength(0);
  });
}
