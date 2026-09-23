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
      id: 'governed-agent-platform',
      emoji: 'Workflow',
      title: 'Governed Agent Platform',
      description: 'One enterprise task end to end on real A2A and MCP endpoints.',
      businessImpact: 'Shows the controls that make enterprise agents deployable',
      href: '/demos/governed-agent-platform',
      tags: ['A2A v1.0', 'MCP'],
      status: 'live',
    },
    {
      id: 'rag-pipeline',
      emoji: 'Database',
      title: 'RAG Pipeline',
      description: 'Real retrieval-augmented generation.',
      businessImpact: 'Enables faster decisions across enterprise knowledge systems',
      href: '/demos/rag-pipeline',
      tags: ['RAG', 'Transformers.js'],
      status: 'live',
    },
    {
      id: 'evaluation-showcase',
      emoji: 'ShieldCheck',
      title: 'AI Evaluation Showcase',
      description: 'Closed-loop LLM evaluation pipeline.',
      businessImpact: 'Ensures quality regressions are detected before release',
      href: '/demos/evaluation-showcase',
      tags: ['LLM-as-Judge', 'Drift Monitoring'],
      status: 'live',
    },
    {
      id: 'multi-agent',
      emoji: 'Users',
      title: 'Multi-Agent System',
      description: 'CrewAI-powered agents.',
      businessImpact: 'Improves decision speed across specialized business workflows',
      href: '/demos/multi-agent',
      tags: ['CrewAI', 'Groq'],
      status: 'live',
    },
    {
      id: 'llm-router',
      emoji: 'GitBranch',
      title: 'LLM Router',
      description: 'Multi-model routing.',
      businessImpact: 'Optimizes cost and latency in AI inference pipelines',
      href: '/demos/llm-router',
      tags: ['Groq', 'Multi-model'],
      status: 'live',
    },
    {
      id: 'mcp-demo',
      emoji: 'Plug',
      title: 'MCP Tool Demo',
      description: 'MCP in action.',
      businessImpact: 'Improves reliability through standardized tool access',
      href: '/demos/mcp-demo',
      tags: ['MCP', 'Tool Use'],
      status: 'live',
    },
    {
      id: 'resume-generator',
      emoji: 'FileText',
      title: 'Resume Generator',
      description: 'Tailored resume from JD.',
      businessImpact: 'Reduces recruiting cycle time through faster alignment',
      href: '/demos/resume-generator',
      tags: ['JD parsing', 'Skill matching'],
      status: 'live',
    },
    {
      id: 'enterprise-control-plane',
      emoji: 'Building2',
      title: 'Enterprise Control Plane',
      description: 'Org-wide governance dashboard.',
      businessImpact: 'Governs access, spend, and auditability at scale',
      href: '/demos/enterprise-control-plane',
      tags: ['RBAC', 'Structured Observability'],
      status: 'live',
    },
    {
      id: 'browser-native-ai-skill',
      emoji: 'MonitorCheck',
      title: 'Native Browser AI Skill',
      description: 'On-device accessibility and readiness checks.',
      businessImpact: 'Finds release risks early without inference egress',
      href: '/demos/browser-native-ai-skill',
      tags: ['On-device analysis', 'Accessibility'],
      status: 'live',
    },
    {
      id: 'world-generation',
      emoji: 'Map',
      title: 'AI Spatial Intelligence & World Generation',
      description: 'Governed spatial planning and scenario simulation.',
      businessImpact: 'Improves location-aware planning with policy-aware decision support',
      href: '/demos/world-generation',
      tags: ['Spatial AI', 'Governance', 'Desktop-Friendly'],
      status: 'live',
    },
    {
      id: 'portfolio-assistant',
      emoji: 'Bot',
      title: 'AI Portfolio Assistant',
      description: 'Streaming full-context assistant with retrieval cues.',
      businessImpact: 'Cuts lookup time by making knowledge instantly accessible',
      href: '/demos/portfolio-assistant',
      tags: ['Streaming', 'Retrieval Grounding'],
      status: 'live',
    },
    // Desktop-only demos (ids matched by DESKTOP_ONLY constant in AITools.tsx)
    {
      id: 'vector-search',
      emoji: 'Search',
      title: 'Vector Search',
      description: 'Semantic search with embeddings.',
      businessImpact: 'Accelerates knowledge discovery across enterprise content',
      href: '/demos/vector-search',
      tags: ['all-MiniLM-L6-v2', 'UMAP'],
      status: 'live',
    },
    {
      id: 'multimodal',
      emoji: 'Eye',
      title: 'Multimodal Assistant',
      description: 'Florence-2 image captioning.',
      businessImpact: 'Lowers processing costs by running vision closer to users',
      href: '/demos/multimodal',
      tags: ['Florence-2', 'WebGPU'],
      status: 'live',
    },
    {
      id: 'quantization',
      emoji: 'Zap',
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
    expect(screen.getByText(/shared governance\s+infrastructure/i)).toBeInTheDocument();
  });

  it('renders the three demo group labels from the shared demo-groups config', () => {
    render(React.createElement(AITools));
    expect(screen.getByText('Core AI Platform')).toBeInTheDocument();
    expect(screen.getByText('Agentic Systems & Governance')).toBeInTheDocument();
    expect(screen.getByText('Labs')).toBeInTheDocument();
    expect(screen.queryByText('Technical Explorations')).not.toBeInTheDocument();
  });

  it('shows AI quality callout and signature quality labeling', () => {
    render(React.createElement(AITools));
    expect(screen.getByText('How AI Quality Is Measured')).toBeInTheDocument();
    expect(screen.getByText('Local-First AI Demos')).toBeInTheDocument();
    expect(screen.getByText('Flagship Platform')).toBeInTheDocument();
    expect(screen.getAllByText('Governed Agent Platform').length).toBeGreaterThan(0);
    expect(screen.getAllByText('AI Evaluation Showcase').length).toBeGreaterThan(0);
  });

  it('renders demo cards with correct titles', () => {
    render(React.createElement(AITools));
    expect(screen.getByText('RAG Pipeline')).toBeInTheDocument();
    // Multi-Agent System appears twice: once in the featured card and once in the group grid
    expect(screen.getAllByText('Multi-Agent System').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('LLM Router')).toBeInTheDocument();
    expect(screen.getByText('MCP Tool Demo')).toBeInTheDocument();
    expect(screen.getByText('Enterprise Control Plane')).toBeInTheDocument();
    expect(screen.getByText('AI Spatial Intelligence & World Generation')).toBeInTheDocument();
    expect(screen.getByText('AI Portfolio Assistant')).toBeInTheDocument();
  });

  it('does not render retired demos even if they are present in data', () => {
    render(React.createElement(AITools));
    expect(screen.queryByText('Native Browser AI Skill')).not.toBeInTheDocument();
    expect(screen.queryByText('Resume Generator')).not.toBeInTheDocument();
    expect(screen.queryByText('Vector Search')).not.toBeInTheDocument();
    expect(screen.queryByText('Multimodal Assistant')).not.toBeInTheDocument();
  });

  it('renders business impact lines for demo cards', () => {
    render(React.createElement(AITools));
    expect(screen.getByText('Optimizes cost and latency in AI inference pipelines')).toBeInTheDocument();
    expect(screen.getByText('Improves location-aware planning with policy-aware decision support')).toBeInTheDocument();
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

  it('renders Desktop badge on exactly 2 cards', () => {
    render(React.createElement(AITools));
    const desktopBadges = screen.getAllByText('Desktop');
    expect(desktopBadges.length).toBe(2);
  });

  it('Desktop badge appears on Model Quantization', () => {
    render(React.createElement(AITools));
    const quantCard = screen.getByText('Model Quantization').closest('a');
    expect(quantCard?.textContent).toContain('Desktop');
  });

  it('Desktop badge appears on AI Spatial Intelligence & World Generation', () => {
    render(React.createElement(AITools));
    const spatialCard = screen.getByText('AI Spatial Intelligence & World Generation').closest('a');
    expect(spatialCard?.textContent).toContain('Desktop');
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
