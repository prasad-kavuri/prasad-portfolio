import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href, ...props }, children),
}));

vi.mock('@/components/theme-toggle', () => ({
  ThemeToggle: () => React.createElement('button', { 'aria-label': 'Toggle theme' }, 'Theme'),
}));

const mockPipeline = vi.fn();
vi.mock('@huggingface/transformers', () => ({
  env: {},
  pipeline: mockPipeline,
}));

import RAGPipelinePage from '@/app/demos/rag-pipeline/page';

describe('RAGPipelinePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPipeline.mockImplementation(async () => {
      return async (input: string) => ({
        data: new Float32Array([input.length % 7, 0.5, 0.2]),
      });
    });
  });

  it('renders browser privacy badges', () => {
    render(React.createElement(RAGPipelinePage));
    expect(screen.getByText('RAG Pipeline Demo')).toBeInTheDocument();
    expect(screen.getByText('Runs in Browser')).toBeInTheDocument();
    expect(screen.getByText('Privacy-preserving local retrieval')).toBeInTheDocument();
  });

  it('loads local embedding model and performs semantic retrieval', async () => {
    render(React.createElement(RAGPipelinePage));
    fireEvent.click(screen.getByRole('button', { name: /Load Model & Start/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/What is Prasad's AI experience/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/What is Prasad's AI experience/i), {
      target: { value: 'AI platform leadership' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Search$/i }));

    await waitFor(() => {
      expect(screen.getByText(/Top 3 Retrieved Documents/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Query time/i)).toBeInTheDocument();
  });
});
