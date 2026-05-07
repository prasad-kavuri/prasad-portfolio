import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { AdaptiveExecutionBadge } from '@/components/AdaptiveExecutionBadge';
import { CapabilityNotice } from '@/components/CapabilityNotice';
import { ExecutionModeToast } from '@/components/ExecutionModeToast';
import { ThemeToggle } from '@/components/theme-toggle';
import type { RoutingStrategy } from '@/lib/device-intelligence';
import type { ExecutionState } from '@/hooks/useExecutionStrategy';
import { useTheme } from 'next-themes';

vi.mock('next-themes', () => ({
  useTheme: vi.fn(),
}));

function strategy(mode: RoutingStrategy['mode']): RoutingStrategy {
  return {
    mode,
    reason: `${mode} route selected`,
    badges: [],
    mobileOptimized: false,
    canAttemptLocal: mode === 'local' || mode === 'hybrid',
    shouldFallbackToCloud: mode === 'cloud' || mode === 'hybrid',
    cloudProvider: 'groq',
  };
}

function executionState(mode: ExecutionState['mode'], isReady = true): ExecutionState {
  return {
    strategy: mode ? strategy(mode) : null,
    capability: null,
    mode,
    fallbackTriggered: false,
    fallbackReason: null,
    isRecovering: false,
    retryCount: 0,
    isReady,
    canAttemptLocal: mode === 'local' || mode === 'hybrid',
  };
}

describe('execution mode controls', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('toggles from dark to light theme', () => {
    const setTheme = vi.fn();
    vi.mocked(useTheme).mockReturnValue({ resolvedTheme: 'dark', setTheme } as ReturnType<typeof useTheme>);

    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button', { name: /toggle theme/i }));

    expect(setTheme).toHaveBeenCalledWith('light');
  });

  it('toggles from light to dark theme', () => {
    const setTheme = vi.fn();
    vi.mocked(useTheme).mockReturnValue({ resolvedTheme: 'light', setTheme } as ReturnType<typeof useTheme>);

    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button', { name: /toggle theme/i }));

    expect(setTheme).toHaveBeenCalledWith('dark');
  });

  it('renders no adaptive badge until a strategy exists', () => {
    const { container } = render(<AdaptiveExecutionBadge strategy={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it.each([
    ['local', 'On-device AI active'],
    ['hybrid', 'Hybrid mode enabled'],
    ['cloud', 'Optimized for your device: Cloud AI active'],
    ['simulated', 'Simulated walkthrough'],
  ] as const)('labels %s execution mode', (mode, label) => {
    render(<AdaptiveExecutionBadge strategy={strategy(mode)} className="extra-class" />);

    expect(screen.getByRole('status', { name: `AI execution mode: ${label}` })).toHaveAttribute(
      'title',
      `${mode} route selected`
    );
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('keeps capability notice silent for loading, local, and hybrid modes', () => {
    const { container, rerender } = render(<CapabilityNotice state={executionState(null, false)} />);
    expect(container).toBeEmptyDOMElement();

    rerender(<CapabilityNotice state={executionState('local')} />);
    expect(container).toBeEmptyDOMElement();

    rerender(<CapabilityNotice state={executionState('hybrid')} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders cloud and simulated capability notices', () => {
    const { rerender } = render(<CapabilityNotice state={executionState('cloud')} fallbackMessage="Using hosted inference." />);
    expect(screen.getByRole('status')).toHaveTextContent('Optimized for your device');
    expect(screen.getByText('Using hosted inference.')).toBeInTheDocument();

    rerender(<CapabilityNotice state={executionState('simulated')} demoName="World Generation" />);
    expect(screen.getByText('World Generation: Simulated walkthrough')).toBeInTheDocument();
    expect(screen.getByText(/Full walkthrough shown below/)).toBeInTheDocument();
  });

  it('renders and dismisses execution mode toast manually and by timer', () => {
    const onDismiss = vi.fn();
    const { rerender } = render(<ExecutionModeToast show={false} message="Cloud AI active" onDismiss={onDismiss} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    rerender(<ExecutionModeToast show={true} message="Cloud AI active" onDismiss={onDismiss} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Cloud AI active');
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(4_000);
    });
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });
});
