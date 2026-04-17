import { describe, expect, it } from 'vitest';
import { runBrowserAuditChecks } from '@/lib/browser-ai-audit';

describe('runBrowserAuditChecks', () => {
  it('returns deterministic check set with review findings for unsafe markup', () => {
    const checks = runBrowserAuditChecks('<main><img src=\"/hero.png\"><button></button></main>');
    expect(checks).toHaveLength(4);
    expect(checks.find((check) => check.key === 'alt-text')?.ok).toBe(false);
    expect(checks.find((check) => check.key === 'controls')?.ok).toBe(false);
  });

  it('passes all checks for fully labeled markup', () => {
    const checks = runBrowserAuditChecks(
      '<main><nav></nav><img src=\"/hero.png\" alt=\"Hero\"><button aria-label=\"Pay\">Pay</button></main>'
    );
    expect(checks.every((check) => check.ok)).toBe(true);
  });
});
