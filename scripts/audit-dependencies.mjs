import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const advisory = 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm';
const expires = Date.parse('2026-10-18T00:00:00Z');

export function auditFailures(report, now = Date.now()) {
  if (!report || !report.vulnerabilities || !report.metadata?.vulnerabilities || report.error) {
    throw new Error('Invalid npm audit report');
  }
  const vulnerabilities = report.vulnerabilities;
  function excepted(name, visited = new Set()) {
    if (now >= expires || visited.has(name)) return false;
    const item = vulnerabilities[name];
    if (!item || !Array.isArray(item.via) || item.via.length === 0) return false;
    const next = new Set([...visited, name]);
    return item.via.every((cause) => typeof cause === 'string'
      ? excepted(cause, next)
      : cause.url === advisory && cause.name === 'braces');
  }
  return Object.entries(vulnerabilities)
    .filter(([name, item]) => ['high', 'critical'].includes(item.severity) && !excepted(name))
    .map(([name]) => name);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = spawnSync('npm', ['audit', '--json'], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  try {
    if (result.error || ![0, 1].includes(result.status)) throw new Error('npm audit could not complete');
    const report = JSON.parse(result.stdout);
    const failures = auditFailures(report);
    if (failures.length) {
      console.error('Blocking dependency findings:', failures.join(', '));
      process.exitCode = 1;
    } else {
      console.log('No blocking high/critical findings. Temporary braces exception expires after 2026-10-17 UTC.');
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
