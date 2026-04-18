import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CopyForAI } from '@/components/CopyForAI';

describe('CopyForAI', () => {
  beforeEach(() => {
    // Mock navigator.clipboard
    const mockClipboard = {
      writeText: vi.fn().mockImplementation(() => Promise.resolve()),
    };
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      configurable: true,
      writable: true
    });
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
  });
});
