import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { FULL_CSP_ROUTES, CSP_DIRECTIVES, STRICT_CSP_DIRECTIVES } from '@/lib/csp';

it('keeps current freshness fields synchronized without rewriting history', () => {
  const short = readFileSync('public/llms.txt', 'utf8');
  const full = readFileSync('public/llms-full.txt', 'utf8');
  const manifest = JSON.parse(readFileSync('public/.well-known/ai-agent-manifest.json', 'utf8'));
  const date = /^Last-Updated: (\d{4}-\d{2}-\d{2})$/m.exec(short)?.[1];
  expect(date).toBeTruthy();
  expect(Number.isFinite(Date.parse(`${date}T00:00:00Z`))).toBe(true);
  expect(full).toContain(`# Updated: ${date} |`);
  expect(full).toContain(`Last-Updated: ${date}`);
  expect(full).toContain(`Last Updated: ${date}`);
  expect(manifest.last_updated).toBe(date);
  expect(full).toContain('Retired (2026-09-23):');
});

it('documents the shipped CSP tiers without claiming implemented nonces or hashes', () => {
  const adr = readFileSync('docs/adr/0009-csp-nonce.md', 'utf8');
  expect(adr).toContain('No inline-script nonce or hash allowlist is implemented.');
  expect(adr).toContain('`next.config.ts` does not send CSP');
  for (const route of FULL_CSP_ROUTES) expect(adr).toContain(route);
  for (const policy of [CSP_DIRECTIVES, STRICT_CSP_DIRECTIVES]) {
    expect(policy.find(([name]) => name === 'script-src')?.[1]).toContain("'unsafe-inline'");
  }
  expect(adr).toContain('stage 4');
});
