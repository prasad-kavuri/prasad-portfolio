import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href, ...props }, children),
}));

vi.mock('@/components/theme-toggle', () => ({
  ThemeToggle: () => React.createElement('button', { 'aria-label': 'Toggle theme' }, 'Theme'),
}));

import RAGPipelinePage from '@/app/demos/rag-pipeline/page';

describe('RAGPipelinePage', () => {
  it('renders browser privacy badges', () => {
    render(React.createElement(RAGPipelinePage));
    expect(screen.getByText('RAG Pipeline Demo')).toBeInTheDocument();
    expect(screen.getByText('Runs in Browser')).toBeInTheDocument();
    expect(screen.getByText('Privacy-preserving local retrieval')).toBeInTheDocument();
  });
});
