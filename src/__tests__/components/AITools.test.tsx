import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href, ...props }, children),
}));

vi.mock('@/data/demos', () => ({
  demos: [
    {
      id: 'rag-pipeline',
      emoji: '🚀',
      title: 'RAG Pipeline',
      description: 'Real retrieval-augmented generation.',
      href: '/demos/rag-pipeline',
      tags: ['RAG', 'Transformers.js'],
      status: 'live',
    },
    {
      id: 'multi-agent',
      emoji: '👥',
      title: 'Multi-Agent System',
      description: 'CrewAI-powered agents.',
      href: '/demos/multi-agent',
      tags: ['CrewAI', 'Groq'],
      status: 'live',
    },
    {
      id: 'llm-router',
      emoji: '🔄',
      title: 'LLM Router',
      description: 'Multi-model routing.',
      href: '/demos/llm-router',
      tags: ['Groq', 'Multi-model'],
      status: 'live',
    },
    {
      id: 'mcp-demo',
      emoji: '🔌',
      title: 'MCP Tool Demo',
      description: 'MCP in action.',
      href: '/demos/mcp-demo',
      tags: ['MCP', 'Tool Use'],
      status: 'live',
    },
    {
      id: 'resume-generator',
      emoji: '📄',
      title: 'Resume Generator',
      description: 'Tailored resume from JD.',
      href: '/demos/resume-generator',
      tags: ['JD parsing', 'Skill matching'],
      status: 'live',
    },
    {
      id: 'portfolio-assistant',
      emoji: '🤖',
      title: 'AI Portfolio Assistant',
      description: 'Streaming RAG assistant.',
      href: '/demos/portfolio-assistant',
      tags: ['Streaming', 'RAG'],
      status: 'live',
    },
  ],
}));

import { AITools } from '@/components/sections/AITools';

describe('AITools', () => {
  it('renders the section heading', () => {
    render(React.createElement(AITools));
    expect(screen.getByText('AI-Powered Tools')).toBeInTheDocument();
  });

  it('renders the section description', () => {
    render(React.createElement(AITools));
    expect(screen.getByText(/production-ready implementations/i)).toBeInTheDocument();
  });

  it('renders all three demo group labels', () => {
    render(React.createElement(AITools));
    expect(screen.getByText('Core AI Infrastructure')).toBeInTheDocument();
    expect(screen.getByText('Agentic Systems')).toBeInTheDocument();
    expect(screen.getByText('AI Applications')).toBeInTheDocument();
  });

  it('renders demo cards with correct titles', () => {
    render(React.createElement(AITools));
    expect(screen.getByText('RAG Pipeline')).toBeInTheDocument();
    expect(screen.getByText('Multi-Agent System')).toBeInTheDocument();
    expect(screen.getByText('LLM Router')).toBeInTheDocument();
    expect(screen.getByText('MCP Tool Demo')).toBeInTheDocument();
    expect(screen.getByText('Resume Generator')).toBeInTheDocument();
    expect(screen.getByText('AI Portfolio Assistant')).toBeInTheDocument();
  });

  it('renders demo card links with correct hrefs', () => {
    render(React.createElement(AITools));
    const ragLink = screen.getByText('RAG Pipeline').closest('a');
    expect(ragLink).toHaveAttribute('href', '/demos/rag-pipeline');
  });

  it('renders Live badges for live demos', () => {
    render(React.createElement(AITools));
    const liveBadges = screen.getAllByText('Live');
    expect(liveBadges.length).toBeGreaterThan(0);
  });
});
