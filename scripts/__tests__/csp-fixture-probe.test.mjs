import { expect, it } from 'vitest';
import { validateProbeBase } from '../csp-fixture-probe.mjs';

it.each(['http://localhost:3100', 'http://127.0.0.1:3100/', 'http://[::1]:3100'])('allows only local fixture origins: %s', (url) => {
  expect(validateProbeBase(url)).toBe(new URL(url).origin);
});
it.each(['https://www.prasadkavuri.com', 'http://localhost.example.com', 'http://user:pass@localhost', 'http://localhost/api/test', 'http://localhost/?token=x', 'http://localhost/#x'])('rejects non-fixture target: %s', (url) => {
  expect(() => validateProbeBase(url)).toThrow();
});
