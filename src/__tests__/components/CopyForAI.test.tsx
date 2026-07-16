import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CopyForAI } from '@/components/CopyForAI';
import { trackEvent } from '@/lib/analytics';

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

describe('CopyForAI', () => {
  const originalExecCommand = document.execCommand;

  beforeEach(() => {
    vi.mocked(trackEvent).mockClear();
    // Mock navigator.clipboard
    const mockClipboard = {
      writeText: vi.fn().mockImplementation(() => Promise.resolve()),
    };
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      configurable: true,
      writable: true
    });
    document.execCommand = vi.fn().mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    document.execCommand = originalExecCommand;
  });

  it('renders the copy button', () => {
    render(<CopyForAI />);
    expect(screen.getByText('Copy Profile for AI')).toBeDefined();
  });

  it('shows success state after copying', async () => {
    render(<CopyForAI />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeDefined();
    });
    expect(trackEvent).toHaveBeenCalledWith('copy_for_ai_clicked');
  });

  it('copies profile markdown with recruiter-friendly details', async () => {
    render(<CopyForAI />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('Prasad Kavuri'));
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('Director, AI Platform & Agentic Solutions'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('production AI governance'));
  });

  it('falls back to document copy when clipboard API fails', async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('denied'));
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');

    render(<CopyForAI />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(document.execCommand).toHaveBeenCalledWith('copy');
    });
    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
    expect(screen.getByText('Copied!')).toBeInTheDocument();
    expect(trackEvent).toHaveBeenCalledWith('copy_for_ai_clicked');
  });

  it('resets the success state after the timeout', async () => {
    vi.useFakeTimers();
    render(<CopyForAI />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    expect(screen.getByText('Copied!')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(screen.getByText('Copy Profile for AI')).toBeInTheDocument();
  });
});
