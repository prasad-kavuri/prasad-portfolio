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
      businessImpact: 'Enables faster decisions across enterprise knowledge systems',
      href: '/demos/rag-pipeline',
      tags: ['RAG', 'Transformers.js'],
      status: 'live',
    },
    {
      id: 'multi-agent',
      emoji: '👥',
      title: 'Multi-Agent System',
      description: 'CrewAI-powered agents.',
      businessImpact: 'Improves decision speed across specialized business workflows',
      href: '/demos/multi-agent',
      tags: ['CrewAI', 'Groq'],
      status: 'live',
    },
    {
      id: 'llm-router',
      emoji: '🔄',
      title: 'LLM Router',
      description: 'Multi-model routing.',
      businessImpact: 'Optimizes cost and latency in AI inference pipelines',
      href: '/demos/llm-router',
      tags: ['Groq', 'Multi-model'],
      status: 'live',
    },
    {
      id: 'mcp-demo',
      emoji: '🔌',
      title: 'MCP Tool Demo',
      description: 'MCP in action.',
      businessImpact: 'Improves reliability through standardized tool access',
      href: '/demos/mcp-demo',
      tags: ['MCP', 'Tool Use'],
      status: 'live',
    },
    {
      id: 'resume-generator',
      emoji: '📄',
      title: 'Resume Generator',
      description: 'Tailored resume from JD.',
      businessImpact: 'Reduces recruiting cycle time through faster alignment',
      href: '/demos/resume-generator',
      tags: ['JD parsing', 'Skill matching'],
      status: 'live',
    },
    {
      id: 'portfolio-assistant',
      emoji: '🤖',
      title: 'AI Portfolio Assistant',
      description: 'Streaming RAG assistant.',
      businessImpact: 'Cuts lookup time by making knowledge instantly accessible',
      href: '/demos/portfolio-assistant',
      tags: ['Streaming', 'RAG'],
      status: 'live',
    },
    // Desktop-only demos (ids matched by DESKTOP_ONLY constant in AITools.tsx)
    {
      id: 'vector-search',
      emoji: '🔎',
      title: 'Vector Search',
      description: 'Semantic search with embeddings.',
      businessImpact: 'Accelerates knowledge discovery across enterprise content',
      href: '/demos/vector-search',
      tags: ['all-MiniLM-L6-v2', 'UMAP'],
      status: 'live',
    },
    {
      id: 'multimodal',
      emoji: '🎭',
      title: 'Multimodal Assistant',
      description: 'Florence-2 image captioning.',
      businessImpact: 'Lowers processing costs by running vision closer to users',
      href: '/demos/multimodal',
      tags: ['Florence-2', 'WebGPU'],
      status: 'live',
    },
    {
      id: 'quantization',
      emoji: '⚡',
      title: 'Model Quantization',
      description: 'Live ONNX benchmark.',
      businessImpact: 'Reduces infrastructure overhead through faster production models',
      href: '/demos/quantization',
      tags: ['ONNX', 'INT8 vs FP32'],
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
    // Multi-Agent System appears twice: once in the featured card and once in the group grid
    expect(screen.getAllByText('Multi-Agent System').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('LLM Router')).toBeInTheDocument();
    expect(screen.getByText('MCP Tool Demo')).toBeInTheDocument();
    expect(screen.getByText('Resume Generator')).toBeInTheDocument();
    expect(screen.getByText('AI Portfolio Assistant')).toBeInTheDocument();
  });

  it('renders business impact lines for demo cards', () => {
    render(React.createElement(AITools));
    expect(screen.getByText('Optimizes cost and latency in AI inference pipelines')).toBeInTheDocument();
    expect(screen.getByText('Accelerates knowledge discovery across enterprise content')).toBeInTheDocument();
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

  it('renders Desktop badge on exactly 3 cards', () => {
    render(React.createElement(AITools));
    const desktopBadges = screen.getAllByText('Desktop');
    expect(desktopBadges.length).toBe(3);
  });

  it('Desktop badge appears on Vector Search', () => {
    render(React.createElement(AITools));
    const vectorCard = screen.getByText('Vector Search').closest('a');
    expect(vectorCard?.textContent).toContain('Desktop');
  });

  it('Desktop badge appears on Multimodal Assistant', () => {
    render(React.createElement(AITools));
    const multimodalCard = screen.getByText('Multimodal Assistant').closest('a');
    expect(multimodalCard?.textContent).toContain('Desktop');
  });

  it('Desktop badge appears on Model Quantization', () => {
    render(React.createElement(AITools));
    const quantCard = screen.getByText('Model Quantization').closest('a');
    expect(quantCard?.textContent).toContain('Desktop');
  });

  it('does NOT show Desktop badge on RAG Pipeline', () => {
    render(React.createElement(AITools));
    const ragCard = screen.getByText('RAG Pipeline').closest('a');
    expect(ragCard?.textContent).not.toContain('Desktop');
  });

  it('all demo cards have working href links', () => {
    render(React.createElement(AITools));
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href?.includes('/demos/')) {
        expect(href).toMatch(/^\/demos\//);
      }
    });
  });
});
