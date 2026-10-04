import { test } from 'vitest';
import assert from 'node:assert/strict';
import { auditFailures } from '../audit-dependencies.mjs';

const now = Date.parse('2026-10-03T00:00:00Z');
function report(extra = {}) {
  return { metadata: { vulnerabilities: {} }, vulnerabilities: {
    braces: { severity: 'high', via: [{ name: 'braces', url: 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm' }] },
    micromatch: { severity: 'high', via: ['braces'] },
    ...extra,
  } };
}
test('allows only the exact advisory and its dependency effects', () => {
  assert.deepEqual(auditFailures(report(), now), []);
});
test('blocks unrelated high and critical findings', () => {
  assert.deepEqual(auditFailures(report({ next: { severity: 'critical', via: [{ url: 'other' }] } }), now), ['next']);
});
test('does not allow another advisory on an excepted package', () => {
  const data = report();
  data.vulnerabilities.braces.via.push({ name: 'braces', url: 'other' });
  assert.deepEqual(auditFailures(data, now), ['braces', 'micromatch']);
});
test('exception expires automatically', () => {
  assert.deepEqual(auditFailures(report(), Date.parse('2026-10-18T00:00:00Z')), ['braces', 'micromatch']);
});
test('rejects malformed or failed audit responses', () => {
  assert.throws(() => auditFailures({ error: 'registry unavailable' }, now));
});
