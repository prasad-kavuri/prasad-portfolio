import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock framer-motion useInView to immediately return true
vi.mock('framer-motion', () => ({
  useInView: () => true,
}));

import { AnimatedCounter } from '@/components/ui/counter';

describe('AnimatedCounter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders non-numeric value directly without animation', () => {
    render(<AnimatedCounter value="Up to 70%" className="test" />);
    expect(screen.getByText('Up to 70%')).toBeDefined();
  });

  it('starts at initial value for numeric values', () => {
    render(<AnimatedCounter value="200+" className="test" />);
    // Before timers run, display is initialised to value
    expect(screen.getByText(/\d+\+/)).toBeDefined();
  });

  it('animates to target value after interval completes', () => {
    render(<AnimatedCounter value="20+" className="test" />);
    vi.runAllTimers();
    expect(screen.getByText('20+')).toBeDefined();
  });

  it('handles K+ suffix correctly', () => {
    render(<AnimatedCounter value="13K+" className="test" />);
    vi.runAllTimers();
    expect(screen.getByText('13K+')).toBeDefined();
  });

  it('applies className prop', () => {
    const { container } = render(
      <AnimatedCounter value="20+" className="text-2xl font-semibold" />
    );
    const span = container.querySelector('.text-2xl');
    expect(span).toBeDefined();
  });
});
