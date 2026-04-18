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

describe('trackModelOutput — drift detection branches', () => {
  it('returns exceeded:false and empty reasons for a clean success sample', () => {
    const result = trackModelOutput('/api/clean', 'Great response with useful content', 'success');
    expect(result.exceeded).toBe(false);
    expect(result.reasons).toHaveLength(0);
    expect(result.driftScore).toBe(0);
  });

  it('detects hallucination_indicators from a single sample', () => {
    const result = trackModelOutput(
      '/api/halluc',
      "I'm not sure about this — I cannot verify the information provided.",
      'success'
    );
    expect(result.reasons).toContain('hallucination_indicators');
    expect(result.driftScore).toBeGreaterThan(0);
  });

  it('detects increased_error_patterns when ≥35% of recent samples are errors', () => {
    // Need ≥4 samples with ≥35% errors to trigger: 4 samples, 2 errors = 50%
    trackModelOutput('/api/err', 'good response', 'success');
    trackModelOutput('/api/err', 'good response', 'success');
    trackModelOutput('/api/err', 'error response', 'error');
    const result = trackModelOutput('/api/err', 'error response', 'error');
    expect(result.reasons).toContain('increased_error_patterns');
    expect(result.driftScore).toBeGreaterThan(0);
  });

  it('detects response_length_anomaly when output is >2.5x the average length', () => {
    const base = 'a'.repeat(100);
    // Seed 3 success samples to establish average of 100 chars
    trackModelOutput('/api/len', base, 'success');
    trackModelOutput('/api/len', base, 'success');
    trackModelOutput('/api/len', base, 'success');
    // Output 300 chars = 3x average; 3 > 2.5 → anomaly
    const longOutput = 'a'.repeat(300);
    const result = trackModelOutput('/api/len', longOutput, 'success');
    expect(result.reasons).toContain('response_length_anomaly');
  });

  it('detects response_length_anomaly when output is <0.25x the average length', () => {
    const base = 'a'.repeat(200);
    trackModelOutput('/api/short', base, 'success');
    trackModelOutput('/api/short', base, 'success');
    trackModelOutput('/api/short', base, 'success');
    // Output 10 chars = 5% of 200 average; < 25% → anomaly
    const result = trackModelOutput('/api/short', 'a'.repeat(10), 'success');
    expect(result.reasons).toContain('response_length_anomaly');
  });

  it('does NOT flag length anomaly when there are fewer than 3 prior success samples', () => {
    const base = 'a'.repeat(200);
    trackModelOutput('/api/fewsamples', base, 'success');
    trackModelOutput('/api/fewsamples', base, 'success');
    // Only 2 prior samples — length anomaly check returns false
    const result = trackModelOutput('/api/fewsamples', 'a'.repeat(10), 'success');
    expect(result.reasons).not.toContain('response_length_anomaly');
  });

  it('does NOT flag length anomaly when output is empty', () => {
    const base = 'a'.repeat(200);
    trackModelOutput('/api/empty', base, 'success');
    trackModelOutput('/api/empty', base, 'success');
    trackModelOutput('/api/empty', base, 'success');
    const result = trackModelOutput('/api/empty', '', 'success');
    expect(result.reasons).not.toContain('response_length_anomaly');
  });

  it('accumulates multiple drift reasons and clamps score to 1', () => {
    // Hallucination + error rate + length anomaly all together
    const base = 'a'.repeat(100);
    trackModelOutput('/api/multi', base, 'success');
    trackModelOutput('/api/multi', base, 'success');
    trackModelOutput('/api/multi', base, 'success');
    trackModelOutput('/api/multi', 'error', 'error');
    trackModelOutput('/api/multi', 'error', 'error');
    const result = trackModelOutput(
      '/api/multi',
      // Hallucination pattern + very short (anomaly against established 100-char baseline)
      "I'm not sure",
      'error'
    );
    expect(result.driftScore).toBeGreaterThan(0);
    expect(result.driftScore).toBeLessThanOrEqual(1);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it('uses success as default status', () => {
    const result = trackModelOutput('/api/default', 'clean output');
    expect(getDriftSnapshot('/api/default')[0].status).toBe('success');
    expect(result.sampleCount).toBe(1);
  });

  it('caps stored samples at 25 (MAX_SAMPLES)', () => {
    for (let i = 0; i < 30; i++) {
      trackModelOutput('/api/cap', `output ${i}`, 'success');
    }
    expect(getDriftSnapshot('/api/cap')).toHaveLength(25);
  });
});
