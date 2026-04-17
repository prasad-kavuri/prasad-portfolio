import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href, ...props }, children),
}));

vi.mock('@/components/theme-toggle', () => ({
  ThemeToggle: () => React.createElement('button', { 'aria-label': 'Toggle theme' }, 'Theme'),
}));

import BrowserNativeAISkillPage from '@/app/demos/browser-native-ai-skill/page';

describe('BrowserNativeAISkillPage', () => {
  it('renders page heading and privacy badges', () => {
    render(<BrowserNativeAISkillPage />);
    expect(screen.getByRole('heading', { name: 'Native Browser AI Skill' })).toBeInTheDocument();
    expect(screen.getByText('Runs in browser')).toBeInTheDocument();
    expect(screen.getByText('No model egress')).toBeInTheDocument();
  });

  it('copies AI skill manifest via clipboard action', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    render(<BrowserNativeAISkillPage />);
    fireEvent.click(screen.getByRole('button', { name: /Copy AI Skill Manifest/i }));

    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining('"name": "Gemini Nano Accessibility Auditor"')
    );
    expect(await screen.findByText('Manifest copied to clipboard.')).toBeInTheDocument();
  });

  it('runs local audit and shows mixed pass/review outcomes', async () => {
    render(<BrowserNativeAISkillPage />);

    fireEvent.change(screen.getByLabelText(/Page markup input/i), {
      target: { value: '<main><h1>Checkout</h1><img src="/hero.png"><button></button></main>' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Run Local Skill Audit/i }));

    expect(await screen.findByText('Skill Output')).toBeInTheDocument();
    expect(await screen.findByText(/Readiness Score:/i)).toBeInTheDocument();
    expect((await screen.findAllByText('Pass')).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('Needs review')).length).toBeGreaterThan(0);
  });

  it('supports fully ready markup path with all checks passing', async () => {
    render(<BrowserNativeAISkillPage />);

    fireEvent.change(screen.getByLabelText(/Page markup input/i), {
      target: {
        value:
          '<main><nav></nav><h1>Checkout</h1><img src="/hero.png" alt="Hero"><button aria-label="Pay now">Pay</button></main>',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: /Run Local Skill Audit/i }));

    expect(await screen.findByText('Readiness Score: 100%')).toBeInTheDocument();
    expect(screen.queryByText('Needs review')).not.toBeInTheDocument();
  });

  it('flags missing landmarks when markup has no main or nav regions', async () => {
    render(<BrowserNativeAISkillPage />);

    fireEvent.change(screen.getByLabelText(/Page markup input/i), {
      target: { value: '<section><h1>Checkout</h1><button aria-label="Pay now">Pay</button></section>' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Run Local Skill Audit/i }));

    expect(await screen.findByText('Add <main> or <nav> landmarks.')).toBeInTheDocument();
    expect(await screen.findByText('Readiness Score: 75%')).toBeInTheDocument();
  });

  it('flags focus and automation readiness when no supporting metadata is present', async () => {
    render(<BrowserNativeAISkillPage />);

    fireEvent.change(screen.getByLabelText(/Page markup input/i), {
      target: { value: '<nav><h1>Checkout</h1><img src="/hero.png" alt="Hero"><button>Pay</button></nav>' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Run Local Skill Audit/i }));

    expect(await screen.findByText('Add focus or ARIA metadata for resilient automation.')).toBeInTheDocument();
    expect(await screen.findByText('Readiness Score: 75%')).toBeInTheDocument();
  });
});
