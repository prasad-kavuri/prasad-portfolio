import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('node:dns/promises', () => ({
  lookup: vi.fn().mockResolvedValue([{ address: '93.184.216.34', family: 4 }]),
}));
