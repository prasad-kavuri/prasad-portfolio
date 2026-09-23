import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// Mocks — must precede imports that use them
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href, ...props }, children),
}));

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) =>
    React.createElement('span', null, children),
}));

// Minimal lucide-react mock — only icons used by DemosGallery
vi.mock('lucide-react', () => {
  const stub = ({ ...props }: object) => React.createElement('span', props);
  return {
    ArrowRight: stub, Bot: stub, Building2: stub, CheckCircle2: stub,
    Cuboid: stub, Database: stub, GitBranch: stub,
    KeyRound: stub, Layers: stub, LayoutTemplate: stub, Plug: stub,
    ShieldCheck: stub, Telescope: stub, Users: stub, Workflow: stub, Zap: stub,
  };
});

vi.mock('@/data/demos', () => ({
  demos: [
    {
      id: 'governed-agent-platform',
      title: 'Governed Agent Platform',
      description: 'One enterprise task end to end on real A2A and MCP endpoints.',
      businessImpact: 'Shows the controls that make enterprise agents deployable',
      businessOutcome: 'Proves agent identity, tool authorization, approval, and release gating work together.',
      href: '/demos/governed-agent-platform',
      tags: ['A2A v1.0', 'MCP', 'Tool Gateway'],
      status: 'live',
      mobileConfig: { executionProfile: 'cloud-preferred', supportsOffline: false, fallbackMode: 'cloud', cloudFallbackRoute: '/api/a2a' },
    },
    {
      id: 'evaluation-showcase',
      title: 'AI Evaluation Showcase',
      description: 'LLM-as-Judge eval with drift monitoring.',
      businessImpact: 'Prevents quality regressions in production AI pipelines',
      businessOutcome: 'Proves that eval-gated CI is viable at enterprise scale.',
      href: '/demos/evaluation-showcase',
      tags: ['Eval', 'Drift', 'HITL'],
      status: 'live',
      mobileConfig: { executionProfile: 'cloud-preferred', supportsOffline: false, fallbackMode: 'cloud', cloudFallbackRoute: '/api/evaluation-showcase' },
    },
    {
      id: 'rag-pipeline',
      title: 'RAG Pipeline',
      description: 'Browser WASM RAG with Transformers.js.',
      businessImpact: 'Grounds AI answers in enterprise knowledge',
      businessOutcome: 'Shows retrieval with source traceability.',
      href: '/demos/rag-pipeline',
      tags: ['Transformers.js', 'WASM'],
      status: 'live',
      mobileConfig: { executionProfile: 'heavy-local', supportsOffline: true, fallbackMode: 'cloud', cloudFallbackRoute: '/api/portfolio-assistant' },
    },
    {
      id: 'llm-router',
      title: 'LLM Router',
      description: 'Multi-model routing with live cost/latency stats.',
      businessImpact: 'Balances quality, latency, and spend',
      businessOutcome: 'Routes AI requests to the optimal model tier.',
      href: '/demos/llm-router',
      tags: ['Groq', 'Multi-model'],
      status: 'live',
      mobileConfig: { executionProfile: 'cloud-preferred', supportsOffline: false, fallbackMode: 'cloud', cloudFallbackRoute: '/api/llm-router' },
    },
    {
      id: 'multi-agent',
      title: 'Multi-Agent System',
      description: 'Analyzer → Researcher → Strategist pipeline with HITL.',
      businessImpact: 'Demonstrates agentic task decomposition at enterprise scale',
      href: '/demos/multi-agent',
      tags: ['Groq', 'HITL', 'Agents'],
      status: 'live',
      mobileConfig: { executionProfile: 'cloud-preferred', supportsOffline: false, fallbackMode: 'cloud', cloudFallbackRoute: '/api/multi-agent' },
    },
    {
      id: 'mcp-demo',
      title: 'MCP Tool Demo',
      description: 'MCP protocol flow with JSON-RPC inspector.',
      businessImpact: 'Shows interoperable AI tool integration via open standard',
      href: '/demos/mcp-demo',
      tags: ['MCP', 'JSON-RPC'],
      status: 'live',
      mobileConfig: { executionProfile: 'cloud-preferred', supportsOffline: false, fallbackMode: 'cloud', cloudFallbackRoute: '/api/mcp-demo' },
    },
    {
      id: 'agent-auth',
      title: 'Agent Auth',
      description: 'auth.md agent identity: anon → email → Bearer.',
      businessImpact: 'Solves agent authentication in multi-tier enterprise systems',
      href: '/demos/agent-auth',
      tags: ['Auth', 'Agents'],
      status: 'live',
      mobileConfig: { executionProfile: 'cloud-preferred', supportsOffline: false, fallbackMode: 'cloud', cloudFallbackRoute: '/api/agent-auth' },
    },
    {
      id: 'edge-agent-collaboration',
      title: 'Edge-Agent Collaboration',
      description: 'Edge BERT NER + HITL gate + Groq cloud.',
      businessImpact: 'Combines on-device speed with cloud reasoning power',
      href: '/demos/edge-agent-collaboration',
      tags: ['Edge', 'HITL'],
      status: 'live',
      mobileConfig: { executionProfile: 'cloud-preferred', supportsOffline: false, fallbackMode: 'cloud', cloudFallbackRoute: '/api/edge-agent' },
    },
    {
      id: 'enterprise-control-plane',
      title: 'Enterprise Control Plane',
      description: 'RBAC, spend limits, observability dashboard.',
      businessImpact: 'Gives platform teams visibility and control over AI spend',
      href: '/demos/enterprise-control-plane',
      tags: ['RBAC', 'FinOps'],
      status: 'live',
      mobileConfig: { executionProfile: 'cloud-preferred', supportsOffline: false, fallbackMode: 'cloud', cloudFallbackRoute: '/api/enterprise-sim' },
    },
    {
      id: 'world-generation',
      title: 'World Generation',
      description: 'Spatial AI + LLM query layer, Three.js.',
      businessImpact: 'Shows Physical AI potential for simulation and mapping',
      href: '/demos/world-generation',
      tags: ['Three.js', 'Spatial AI'],
      status: 'live',
      mobileConfig: { executionProfile: 'cloud-preferred', supportsOffline: false, fallbackMode: 'cloud', cloudFallbackRoute: '/api/world-generation' },
    },
    {
      id: 'portfolio-assistant',
      title: 'Portfolio Assistant',
      description: 'Streaming RAG-grounded assistant.',
      businessImpact: 'Shows RAG-grounded conversational AI at enterprise quality',
      href: '/demos/portfolio-assistant',
      tags: ['Groq', 'RAG', 'Streaming'],
      status: 'live',
      mobileConfig: { executionProfile: 'cloud-preferred', supportsOffline: false, fallbackMode: 'cloud', cloudFallbackRoute: '/api/portfolio-assistant' },
    },
    {
      id: 'storm-research',
      title: 'STORM Research Agent',
      description: 'Multi-perspective research synthesis via Groq.',
      businessImpact: 'Demonstrates research-agent orchestration at enterprise scale',
      href: '/demos/storm-research',
      tags: ['Groq', 'Multi-Agent', 'Research Synthesis'],
      status: 'live',
      mobileConfig: { executionProfile: 'cloud-preferred', supportsOffline: false, fallbackMode: 'cloud', cloudFallbackRoute: '/api/storm-research' },
    },
    {
      id: 'quantization',
      title: 'Model Quantization',
      description: 'INT8 vs FP32 ONNX benchmark.',
      businessImpact: 'Demonstrates on-device efficiency gains via quantization',
      href: '/demos/quantization',
      tags: ['ONNX', 'INT8'],
      status: 'live',
      mobileConfig: { executionProfile: 'heavy-local', supportsOffline: false, fallbackMode: 'simulated', cloudFallbackRoute: null },
    },
    {
      id: 'generative-ui',
      title: 'Constrained Generative UI',
      description: 'Catalog-constrained JSON to UI.',
      businessImpact: 'Removes unvalidated AI markup as an attack surface',
      href: '/demos/generative-ui',
      tags: ['Generative UI', 'Schema Validation'],
      status: 'live',
      mobileConfig: { executionProfile: 'cloud-preferred', supportsOffline: false, fallbackMode: 'cloud', cloudFallbackRoute: 'native' },
    },
  ],
}));

import { DemosGallery } from '@/components/sections/DemosGallery';
import { trackEvent } from '@/lib/analytics';

describe('DemosGallery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the filter bar with all 4 filter options', () => {
    render(<DemosGallery />);
    expect(screen.getByRole('button', { name: 'All Modules' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Core AI' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Agentic' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Labs' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Explorations' })).not.toBeInTheDocument();
  });

  it('"All Modules" filter is active (aria-pressed=true) by default', () => {
    render(<DemosGallery />);
    const btn = screen.getByRole('button', { name: 'All Modules' });
    expect(btn.getAttribute('aria-pressed')).toBe('true');
  });

  it('other filters are not active by default', () => {
    render(<DemosGallery />);
    expect(screen.getByRole('button', { name: 'Core AI' }).getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByRole('button', { name: 'Agentic' }).getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByRole('button', { name: 'Labs' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('clicking "Core AI" makes it active and deactivates "All Modules"', () => {
    render(<DemosGallery />);
    const coreBtn = screen.getByRole('button', { name: 'Core AI' });
    fireEvent.click(coreBtn);
    expect(coreBtn.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'All Modules' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('renders the flagship "governed-agent-platform" card with "Flagship Platform" badge', () => {
    render(<DemosGallery />);
    expect(screen.getByText('Governed Agent Platform')).toBeInTheDocument();
    expect(screen.getByText('Flagship Platform')).toBeInTheDocument();
    expect(screen.getByText('AI Evaluation Showcase')).toBeInTheDocument();
  });

  it('renders businessOutcome "What this proves" callout for evaluation-showcase', () => {
    render(<DemosGallery />);
    expect(screen.getAllByText('What this proves').length).toBeGreaterThan(0);
    expect(screen.getByText('Proves that eval-gated CI is viable at enterprise scale.')).toBeInTheDocument();
  });

  it('renders platform stats strip with 4 stat cards', () => {
    render(<DemosGallery />);
    expect(screen.getByText('Governance layer')).toBeInTheDocument();
    expect(screen.getByText('Rate limiting')).toBeInTheDocument();
    expect(screen.getByText('Eval gating')).toBeInTheDocument();
    expect(screen.getByText('Audit trail')).toBeInTheDocument();
  });

  it('renders group labels for all groups when "all" is selected', () => {
    render(<DemosGallery />);
    expect(screen.getByText('Core AI Platform')).toBeInTheDocument();
    expect(screen.getByText('Agentic Systems & Governance')).toBeInTheDocument();
    expect(screen.getAllByText('Labs').length).toBeGreaterThan(0);
  });

  it('renders the Constrained Generative UI card (regression: it was registered but missing from /demos)', () => {
    render(<DemosGallery />);
    expect(screen.getByText('Constrained Generative UI')).toBeInTheDocument();
  });

  it('clicking "Labs" filter shows only the Labs group', () => {
    render(<DemosGallery />);
    fireEvent.click(screen.getByRole('button', { name: 'Labs' }));
    expect(screen.queryByText('Core AI Platform')).not.toBeInTheDocument();
    expect(screen.getByText('Model Quantization')).toBeInTheDocument();
    expect(screen.queryByText('Multi-Agent System')).not.toBeInTheDocument();
  });

  it('clicking "Agentic" filter hides Core AI group label', () => {
    render(<DemosGallery />);
    fireEvent.click(screen.getByRole('button', { name: 'Agentic' }));
    expect(screen.queryByText('Core AI Platform')).not.toBeInTheDocument();
    expect(screen.getByText('Agentic Systems & Governance')).toBeInTheDocument();
  });

  it('module cards link to the correct href', () => {
    render(<DemosGallery />);
    const ragLink = screen.getByRole('link', { name: /RAG Pipeline/i });
    expect(ragLink.getAttribute('href')).toBe('/demos/rag-pipeline');
  });

  it('fires trackEvent when a module card is clicked', () => {
    render(<DemosGallery />);
    const links = screen.getAllByRole('link');
    // First link is the flagship card (governed-agent-platform)
    fireEvent.click(links[0]);
    expect(trackEvent).toHaveBeenCalledWith('demo_opened', { demo: 'governed-agent-platform' });
  });

  it('renders bottom CTA links', () => {
    render(<DemosGallery />);
    expect(screen.getByRole('link', { name: /Agent Marketplace/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Governance Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Platform Capabilities/i })).toBeInTheDocument();
  });

  it('shows module count for current filter', () => {
    render(<DemosGallery />);
    // With all 14 demos, should show "14 modules"
    expect(screen.getByText('14 modules')).toBeInTheDocument();
  });
});
