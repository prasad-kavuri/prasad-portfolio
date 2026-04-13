import { describe, it, expect, beforeEach } from 'vitest';
import {
  trackModelOutput,
  getDriftSnapshot,
  _resetDriftMonitor,
} from '@/lib/drift-monitor';

beforeEach(() => {
  _resetDriftMonitor();
});

describe('getDriftSnapshot', () => {
  it('returns empty array for unknown route', () => {
    expect(getDriftSnapshot('/api/unknown')).toEqual([]);
  });

  it('returns recorded samples for a route', () => {
    trackModelOutput('/api/test', 'some output', 'success');
    const snapshot = getDriftSnapshot('/api/test');
    expect(snapshot).toHaveLength(1);
    expect(snapshot[0].route).toBe('/api/test');
    expect(snapshot[0].output).toBe('some output');
    expect(snapshot[0].status).toBe('success');
  });

  it('returns a copy (mutations do not affect internal state)', () => {
    trackModelOutput('/api/test', 'output', 'success');
    const snapshot = getDriftSnapshot('/api/test');
    snapshot.pop();
    expect(getDriftSnapshot('/api/test')).toHaveLength(1);
  });
});

describe('_resetDriftMonitor', () => {
  it('clears all recorded samples', () => {
    trackModelOutput('/api/test', 'output', 'success');
    _resetDriftMonitor();
    expect(getDriftSnapshot('/api/test')).toEqual([]);
  });
});
