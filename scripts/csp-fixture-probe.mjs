import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

export function validateProbeBase(value) {
  const url = new URL(value);
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Probe target must be a localhost HTTP origin with no credentials, path or query');
  }
  return url.origin;
}

export async function probe(base) {
  const origin = validateProbeBase(base);
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.route('**/*', (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await page.addInitScript(() => {
      window.cspViolations = [];
      document.addEventListener('securitypolicyviolation', (event) => {
        window.cspViolations.push({ directive: event.effectiveDirective, blocked: event.blockedURI, disposition: event.disposition });
      });
    });
    const response = await page.goto(origin, { waitUntil: 'networkidle', timeout: 15000 });
    const policy = response.headers()['content-security-policy'] ?? '';
    await page.getByRole('button', { name: 'Count 0' }).click();
    const interactive = await page.waitForFunction(() => document.querySelector('button')?.textContent === 'Count 1', undefined, { timeout: 2000 }).then(() => true, () => false);
    const details = await page.evaluate(() => ({
      violations: window.cspViolations,
      scripts: [...document.scripts].map((script) => ({ external: Boolean(script.src), integrity: Boolean(script.integrity), nonce: Boolean(script.nonce) })),
    }));
    const firstNonce = /'nonce-([^']+)'/.exec(policy)?.[1];
    const second = await page.reload({ waitUntil: 'networkidle', timeout: 15000 });
    const secondNonce = /'nonce-([^']+)'/.exec(second.headers()['content-security-policy'] ?? '')?.[1];
    const scriptPolicy = policy.split(';').find((part) => part.trim().startsWith('script-src')) ?? '';
    return { status: response.status(), interactive, inlineAllowed: scriptPolicy.split(/\s+/).includes("'unsafe-inline'"),
      scriptPolicy: scriptPolicy.replace(/'nonce-[^']+'/g, "'nonce-<redacted>'"),
      nonceRotates: firstNonce ? firstNonce !== secondNonce : null, ...details };
  } finally {
    await browser.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(await probe(process.argv[2] ?? 'http://127.0.0.1:3100'), null, 2));
}
