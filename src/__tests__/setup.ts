import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('node:dns/promises', () => ({
  lookup: vi.fn().mockResolvedValue([{ address: '93.184.216.34', family: 4 }]),
}));

// Daily LLM spend caps (SPEC-0020) are exercised explicitly in
// src/__tests__/lib/daily-budget.test.ts. Everywhere else, keep them out of the
// way so suites that call a route many times from one test IP are unaffected.
process.env.DAILY_LLM_CALL_CAP ??= '1000000';
process.env.DAILY_LLM_CALLS_PER_CLIENT ??= '1000000';
