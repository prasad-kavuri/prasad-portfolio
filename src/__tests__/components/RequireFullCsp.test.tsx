import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { RequireFullCsp } from '@/components/RequireFullCsp';

function setTier(tier: 'strict' | 'full' | null) {
  const entry = tier ? { serverTiming: [{ name: 'csp', description: tier }] } : {};
  vi.spyOn(performance, 'getEntriesByType').mockReturnValue([entry] as unknown as PerformanceEntryList);
}

describe('RequireFullCsp (SPEC-0027 stage 2)', () => {
  const reload = vi.fn();
  const originalLocation = window.location;

  beforeEach(() => {
    sessionStorage.clear();
    reload.mockClear();
    Object.defineProperty(window, 'location', { configurable: true, value: { ...originalLocation, reload } });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });

  it('reloads once when the document was served the strict policy', () => {
    setTier('strict');
    render(<RequireFullCsp />);
    expect(reload).toHaveBeenCalledTimes(1);
    render(<RequireFullCsp />); // still strict after the reload: do not loop
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the document already has the full policy, and re-arms the guard', () => {
    sessionStorage.setItem('csp-tier-reload', '1');
    setTier('full');
    render(<RequireFullCsp />);
    expect(reload).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('csp-tier-reload')).toBeNull();
  });

  it('does nothing when no policy tier is reported', () => {
    setTier(null);
    render(<RequireFullCsp />);
    expect(reload).not.toHaveBeenCalled();
  });

  it('does not reload when session storage is unavailable', () => {
    setTier('strict');
    const real = window.sessionStorage;
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      get: () => {
        throw new Error('blocked');
      },
    });
    render(<RequireFullCsp />);
    expect(reload).not.toHaveBeenCalled();
    Object.defineProperty(window, 'sessionStorage', { configurable: true, value: real });
  });
});
