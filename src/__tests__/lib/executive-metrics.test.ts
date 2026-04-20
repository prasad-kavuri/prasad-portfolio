import { describe, it, expect } from 'vitest';
import { EXECUTIVE_METRICS, EXECUTIVE_METRICS_DISPLAY } from '@/lib/executive-metrics';

describe('EXECUTIVE_METRICS', () => {
  it('exports all 5 canonical proof points', () => {
    expect(EXECUTIVE_METRICS.yearsExperience).toBe('20+');
    expect(EXECUTIVE_METRICS.engineersLed).toBe('200+');
    expect(EXECUTIVE_METRICS.b2bCustomersEnabled).toBe('13K+');
    expect(EXECUTIVE_METRICS.costReductionDelivered).toBe('Up to 70%');
    expect(EXECUTIVE_METRICS.revenueLaunched).toBe('$10M+');
  });

  it('costReductionDisplay is numeric-prefixed so AnimatedCounter can animate it', () => {
    // AnimatedCounter animates values matching /^(\d+)(.*)/
    expect(EXECUTIVE_METRICS.costReductionDisplay).toMatch(/^\d/);
    expect(EXECUTIVE_METRICS.costReductionDisplay).toBe('70%');
  });

  it('costReductionDelivered preserves the "Up to" qualifier for prose references', () => {
    expect(EXECUTIVE_METRICS.costReductionDelivered).toContain('Up to');
  });
});

describe('EXECUTIVE_METRICS_DISPLAY', () => {
  it('has exactly 5 entries', () => {
    expect(EXECUTIVE_METRICS_DISPLAY).toHaveLength(5);
  });

  it('entries cover all 5 canonical dimensions', () => {
    const labels = EXECUTIVE_METRICS_DISPLAY.map((e) => e.label);
    expect(labels).toContain('Years Experience');
    expect(labels).toContain('Engineers Led');
    expect(labels).toContain('B2B Customers Enabled');
    expect(labels).toContain('Cost Reduction Delivered');
    expect(labels).toContain('Revenue Launched');
  });

  it('cost reduction display value matches costReductionDisplay (not the prose form)', () => {
    const entry = EXECUTIVE_METRICS_DISPLAY.find((e) => e.label === 'Cost Reduction Delivered');
    expect(entry?.value).toBe(EXECUTIVE_METRICS.costReductionDisplay);
    expect(entry?.value).not.toBe(EXECUTIVE_METRICS.costReductionDelivered);
  });

  it('context line for cost reduction preserves the "Up to" qualifier', () => {
    const entry = EXECUTIVE_METRICS_DISPLAY.find((e) => e.label === 'Cost Reduction Delivered');
    expect(entry?.context).toMatch(/up to/i);
  });

  it('engineers led context references the three orgs', () => {
    const entry = EXECUTIVE_METRICS_DISPLAY.find((e) => e.label === 'Engineers Led');
    expect(entry?.context).toMatch(/Krutrim/i);
    expect(entry?.context).toMatch(/Ola/i);
    expect(entry?.context).toMatch(/HERE/i);
  });
});
