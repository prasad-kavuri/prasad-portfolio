import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LatencyCostChart, generateData, seededRand } from '@/components/observability/LatencyCostChart';

describe('LatencyCostChart', () => {
  it('renders without crashing', () => {
    render(React.createElement(LatencyCostChart));
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('renders all three latency toggle buttons', () => {
    render(React.createElement(LatencyCostChart));
    expect(screen.getByRole('button', { name: /p50 latency/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /p95 latency/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /p99 latency/i })).toBeInTheDocument();
  });

  it('switching to p50 updates aria-label on svg', () => {
    render(React.createElement(LatencyCostChart));
    fireEvent.click(screen.getByRole('button', { name: /p50 latency/i }));
    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      expect.stringContaining('p50')
    );
  });

  it('switching to p99 updates aria-label on svg', () => {
    render(React.createElement(LatencyCostChart));
    fireEvent.click(screen.getByRole('button', { name: /p99 latency/i }));
    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      expect.stringContaining('p99')
    );
  });
});

describe('generateData', () => {
  it('returns exactly 24 hourly data points', () => {
    const data = generateData();
    expect(data).toHaveLength(24);
  });

  it('p95 latency is always greater than p50 for every point', () => {
    const data = generateData();
    data.forEach(d => {
      expect(d.p95LatencyMs).toBeGreaterThan(d.p50LatencyMs);
    });
  });

  it('p99 latency is always greater than p95 for every point', () => {
    const data = generateData();
    data.forEach(d => {
      expect(d.p99LatencyMs).toBeGreaterThan(d.p95LatencyMs);
    });
  });

  it('all cost values are positive', () => {
    const data = generateData();
    data.forEach(d => {
      expect(d.costPerRequestUSD).toBeGreaterThan(0);
    });
  });

  it('data is deterministic across multiple generateData() calls', () => {
    const a = generateData();
    const b = generateData();
    expect(a.map(d => d.p95LatencyMs)).toEqual(b.map(d => d.p95LatencyMs));
    expect(a.map(d => d.costPerRequestUSD)).toEqual(b.map(d => d.costPerRequestUSD));
  });

  it('all hour labels are in HH:00 format', () => {
    const data = generateData();
    data.forEach(d => {
      expect(d.hour).toMatch(/^\d{2}:00$/);
    });
  });
});

describe('seededRand', () => {
  it('never returns a value > 1', () => {
    const rand = seededRand(42);
    for (let i = 0; i < 1000; i++) {
      expect(rand()).toBeLessThanOrEqual(1);
    }
  });

  it('never returns a value < 0', () => {
    const rand = seededRand(42);
    for (let i = 0; i < 1000; i++) {
      expect(rand()).toBeGreaterThanOrEqual(0);
    }
  });

  it('produces same sequence for same seed', () => {
    const a = seededRand(0xdeadbeef);
    const b = seededRand(0xdeadbeef);
    for (let i = 0; i < 20; i++) {
      expect(a()).toBe(b());
    }
  });
});
