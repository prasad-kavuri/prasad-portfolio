'use client';

import { useEffect } from 'react';

const RELOAD_KEY = 'csp-tier-reload';

/**
 * The WebAssembly demos need the full Content Security Policy, but a page's policy is fixed when its document
 * loads. Reaching a demo through an in-app link keeps the strict policy of the page the visitor came from, so
 * the model runtime would be blocked. The proxy tells the page which policy its document got (Server-Timing);
 * when that is "strict", reload once so the server sends the demo's own policy. SPEC-0027 stage 2.
 */
export function RequireFullCsp() {
  useEffect(() => {
    let strict = false;
    try {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      strict = Boolean(nav?.serverTiming?.some((t) => t.name === 'csp' && t.description === 'strict'));
    } catch {
      return;
    }
    try {
      if (!strict) {
        sessionStorage.removeItem(RELOAD_KEY);
        return;
      }
      if (sessionStorage.getItem(RELOAD_KEY)) return; // reload once, never loop
      sessionStorage.setItem(RELOAD_KEY, '1');
    } catch {
      return;
    }
    window.location.reload();
  }, []);
  return null;
}
