import type { DemoExecutionProfile } from '@/lib/device-intelligence';

export type Demo = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  businessImpact: string;
  businessOutcome?: string;
  href: string;
  tags: string[];
  status: "live" | "upgrading" | "coming-soon";
  skills?: string[];
  desktopOnly?: boolean;
  mobileConfig: {
    executionProfile: DemoExecutionProfile;
    supportsOffline: boolean;          // true = WASM works offline once loaded
    fallbackMode: 'cloud' | 'simulated' | 'disabled';
    cloudFallbackRoute: string | null; // e.g. '/api/portfolio-assistant'
    fallbackMessage?: string;          // shown in the UI when routing to fallback
    capabilityNotes?: string;          // shown in the badge tooltip
  };
};

export const demos: Demo[] = [
  {
    id: "governed-agent-platform",
    emoji: "Workflow",
    title: "Governed Agent Platform",
    description: "One synthetic finance-ops task end to end on real protocol endpoints: an A2A v1.0 agent, an MCP server, a policy-enforcing tool gateway, human approval, poisoned-data defense, a gateway trace, and a release gate driven by trajectory evaluation.",
    businessImpact: "Shows the controls that make enterprise agents deployable: identity, per-tool authorization, approval, traceability, and evaluation-gated releases",
    businessOutcome: "A working reference for how an enterprise agent platform discovers, authorizes, supervises, evaluates, and safely releases agents — not a slide.",
    href: "/demos/governed-agent-platform",
    tags: ["A2A v1.0", "MCP", "Tool Gateway", "Human Approval", "Trajectory Eval", "Canary Rollback"],
    skills: ['hitl', 'guardrails', 'observability', 'eval-engine'],
    status: "live",
    mobileConfig: {
      executionProfile: 'cloud-preferred',
      supportsOffline: false,
      fallbackMode: 'cloud',
      cloudFallbackRoute: 'native',
    },
  },
  {
    id: "rag-pipeline",
    emoji: "Database",
    title: "RAG Pipeline",
    description: "Retrieval-augmented generation with Transformers.js embeddings (all-MiniLM-L6-v2) over an in-memory vector index — runs entirely in your browser.",
    businessImpact: "Improves grounded enterprise knowledge retrieval and reduces unsupported AI answers in operational workflows",
    businessOutcome: "Shows how enterprise knowledge can be retrieved with source traceability, relevance controls, and citation — not hallucination.",
    href: "/demos/rag-pipeline",
    tags: ["Transformers.js", "all-MiniLM-L6-v2", "In-browser retrieval"],
    skills: ['observability'],
    status: "live",
    mobileConfig: {
      executionProfile: 'heavy-local',
      supportsOffline: true,
      fallbackMode: 'cloud',
      cloudFallbackRoute: '/api/portfolio-assistant',
      fallbackMessage: 'Routing to cloud AI for a reliable experience on your device.',
      capabilityNotes: 'Runs Transformers.js all-MiniLM-L6-v2 (WASM, ~80MB heap)',
    },
  },
  {
    id: "llm-router",
    emoji: "GitBranch",
    title: "LLM Router",
    description: "Multi-model routing across fast and large Groq-hosted models — see live latency, cost, and quality trade-offs per request.",
    businessImpact: "Balances quality, latency, and spend across model tiers for production AI request routing",
    businessOutcome: "Routes each AI request to the right model tier for its complexity — demonstrating LLM FinOps and cost/latency/quality decision-making at the platform level.",
    href: "/demos/llm-router",
    tags: ["Groq", "Multi-model", "Live latency"],
    skills: ['guardrails', 'eval-engine', 'drift-monitor'],
    status: "live",
    mobileConfig: {
      executionProfile: 'cloud-preferred',
      supportsOffline: false,
      fallbackMode: 'cloud',
      cloudFallbackRoute: 'native',
    },
  },
  {
    id: "evaluation-showcase",
    emoji: "ShieldCheck",
    title: "AI Evaluation Showcase",
    description: "Evaluation pipeline walkthrough — deterministic rubric scoring (required-coverage and forbidden-topic checks), guardrail screening, and pass/fail release gating. Deterministic eval suites run in CI on every change.",
    businessImpact: "Improves release confidence through measurable quality gates and regression visibility before deployment",
    businessOutcome: "Catches quality regressions before they reach production — the governance layer that separates AI experiments from AI platforms.",
    href: "/demos/evaluation-showcase",
    tags: ["Rubric Scoring", "Guardrails", "Release Gating", "CI Evals"],
    skills: [],
    status: "live",
    mobileConfig: {
      executionProfile: 'cloud-preferred',
      supportsOffline: false,
      fallbackMode: 'cloud',
      cloudFallbackRoute: 'native',
    },
  },
  {
    id: "multi-agent",
    emoji: "Users",
    title: "Multi-Agent System",
    description: "Three specialized agents — Analyzer, Researcher, and Strategist — with real LLM calls via Groq, handing off in sequence; the Strategist's recommendation is released only through a server-recorded, single-use approval.",
    businessImpact: "Coordinates specialized agent workflows with approvals and auditability for high-impact enterprise decisions",
    businessOutcome: "Demonstrates governed agentic workflows with human-in-the-loop approval checkpoints, audit trails, and role-based orchestration — safe for enterprise deployment.",
    href: "/demos/multi-agent",
    tags: ["Groq", "Llama 3.3", "Handoff Architecture", "Audit Trail", "Agent Orchestration"],
    skills: ['planning', 'hitl', 'guardrails', 'observability', 'eval-engine', 'drift-monitor'],
    status: "live",
    mobileConfig: {
      executionProfile: 'cloud-preferred',
      supportsOffline: false,
      fallbackMode: 'cloud',
      cloudFallbackRoute: 'native',
    },
  },
  {
    id: "mcp-demo",
    emoji: "Plug",
    title: "MCP Tool Demo",
    description: "MCP-style tool use with per-tool authorization — watch an LLM select and call JSON-Schema-defined tools (via Groq function calling); calls without the required scope are denied and tool outputs are screened for injected instructions.",
    businessImpact: "Improves reliability by standardizing tool access across agent workflows",
    businessOutcome: "Shows how standardized tool protocols reduce integration overhead and make agent capabilities composable across enterprise systems.",
    href: "/demos/mcp-demo",
    tags: ["MCP", "Tool Use", "Groq API"],
    skills: ['observability', 'guardrails'],
    status: "live",
    mobileConfig: {
      executionProfile: 'cloud-preferred',
      supportsOffline: false,
      fallbackMode: 'cloud',
      cloudFallbackRoute: 'native',
    },
  },
  {
    id: "portfolio-assistant",
    emoji: "Bot",
    title: "AI Portfolio Assistant",
    description: "Streaming full-context assistant over my experience with optional retrieval-enhanced grounding and cited context cues.",
    businessImpact: "Cuts expert lookup time by making organizational knowledge instantly accessible",
    businessOutcome: "Demonstrates conversational AI grounded in structured knowledge — RAG + LLM working together on a real corpus.",
    href: "/demos/portfolio-assistant",
    tags: ["Groq", "Streaming", "Retrieval Grounding"],
    skills: ['guardrails', 'observability', 'eval-engine'],
    status: "live",
    mobileConfig: {
      executionProfile: 'cloud-preferred',
      supportsOffline: false,
      fallbackMode: 'cloud',
      cloudFallbackRoute: 'native',
    },
  },
  {
    id: "quantization",
    emoji: "Zap",
    title: "Model Quantization",
    description: "Live ONNX benchmark comparing INT8 vs FP32 inference — real file sizes, real latency, real quality diff.",
    businessImpact: "Reduces infrastructure overhead through smaller, faster production models",
    businessOutcome: "Benchmarks INT8 vs FP32 inference on the same model — model size, latency, and output quality side by side — the cost lever most teams overlook.",
    href: "/demos/quantization",
    tags: ["ONNX", "INT8 vs FP32", "Transformers.js"],
    skills: [],
    desktopOnly: true,
    status: "live",
    mobileConfig: {
      executionProfile: 'heavy-local',
      supportsOffline: false,
      fallbackMode: 'simulated',  // Benchmarks are inherently local
      cloudFallbackRoute: null,
      fallbackMessage: 'Showing pre-computed benchmark results on this device.',
      capabilityNotes: 'ONNX FP32 vs INT8 benchmarks — CPU-intensive',
    },
  },
  {
    id: "enterprise-control-plane",
    emoji: "Building2",
    title: "Enterprise Control Plane",
    description: "Org-wide AI governance dashboard — RBAC, group spend limits with token-cost tracking, and structured observability feed (deterministic seeded data).",
    businessImpact: "Operationalizes enterprise AI oversight with RBAC, spend controls, and traceable policy enforcement",
    businessOutcome: "Operational guardrails for enterprise AI: RBAC, spend analytics, token budgets, and structured observability in a single control surface.",
    href: "/demos/enterprise-control-plane",
    tags: ["Enterprise", "RBAC", "Structured Observability", "Token Analytics"],
    skills: [],
    status: "live",
    mobileConfig: {
      executionProfile: 'cloud-preferred',
      supportsOffline: false,
      fallbackMode: 'cloud',
      cloudFallbackRoute: 'native',
    },
  },
  {
    id: "edge-agent-collaboration",
    emoji: "Layers",
    title: "Edge Agent + Cloud Agent Collaboration",
    description: "Three-tier privacy-first AI pipeline: BERT NER redacts PII in the browser via Transformers.js ONNX, the server re-checks the payload and holds it behind a single-use approval, and Groq produces an executive summary from the approved payload only.",
    businessImpact: "Redacts PII on the device before any cloud call, so the cloud model only receives the sanitized payload",
    businessOutcome: "Demonstrates the governance-first agentic handoff pattern enterprises need for regulated AI workflows: edge extraction, explicit HITL approval, and auditable cloud orchestration.",
    href: "/demos/edge-agent-collaboration",
    tags: ["edge-ai", "browser-agent", "local-inference", "privacy-first-ai", "tool-gateway", "agentic-ai", "governance", "sovereign-ai"],
    skills: ['hitl', 'guardrails', 'observability'],
    status: "live",
    mobileConfig: {
      executionProfile: 'heavy-local',
      supportsOffline: false,
      fallbackMode: 'cloud',
      cloudFallbackRoute: '/api/edge-agent',
      fallbackMessage: 'Edge inference requires desktop — showing cloud-only path on this device.',
      capabilityNotes: 'Runs Transformers.js BERT NER via WASM (~440MB, desktop recommended)',
    },
  },
  {
    id: "agent-auth",
    emoji: "KeyRound",
    title: "Agent Auth Demo",
    description: "Live auth.md protocol implementation — AI agents register anonymously, claim with email + OTP, then call MCP tools with a Bearer credential.",
    businessImpact: "Eliminates bespoke agent onboarding by implementing the emerging open standard for agent identity",
    businessOutcome: "Demonstrates agent-native authentication: anonymous registration, email claim, OTP upgrade, and authenticated tool access — the identity primitive every agentic platform needs.",
    href: "/demos/agent-auth",
    tags: ["auth.md", "OAuth", "MCP", "Bearer token", "Agent Identity"],
    skills: ['observability', 'guardrails'],
    status: "live",
    mobileConfig: {
      executionProfile: 'cloud-preferred',
      supportsOffline: false,
      fallbackMode: 'cloud',
      cloudFallbackRoute: 'native',
    },
  },
  {
    id: "storm-research",
    emoji: "Telescope",
    title: "STORM Research Agent",
    description: "Multi-perspective AI research inspired by Stanford STORM — discover expert lenses, generate questions, research each angle, and synthesize an executive brief in real time.",
    businessImpact: "Accelerates strategic research by orchestrating multiple AI expert perspectives into a single structured executive report",
    businessOutcome: "Demonstrates STORM-style multi-agent research orchestration: perspective discovery, parallel question generation, sequential LLM research, and live report synthesis.",
    href: "/demos/storm-research",
    tags: ["Groq", "Multi-Agent", "Llama 3.3 70B", "Research Synthesis", "Streaming"],
    skills: ['observability', 'guardrails'],
    status: "live",
    mobileConfig: {
      executionProfile: 'cloud-preferred',
      supportsOffline: false,
      fallbackMode: 'cloud',
      cloudFallbackRoute: 'native',
    },
  },
  {
    id: "world-generation",
    emoji: "Cuboid",
    title: "Real-Time Spatial AI + World Modeling Engine",
    description:
      "Perception → reconstruction → agent reasoning. Precomputed 3D mesh playback with drift correction visualization and LLM spatial query layer. Controllable parametric spatial design — refine generated scenes with natural-language instructions. Changes are validated, diffed, and auditable.",
    businessImpact:
      "Accelerates logistics and spatial planning with policy-aware world artifacts that are explainable, reviewable, and simulation-ready",
    businessOutcome: "Brings LLM reasoning into spatial and operational planning — policy-aware world models that are auditable, diffable, and simulation-ready.",
    href: "/demos/world-generation",
    tags: [
      "World Generation",
      "Spatial AI",
      "Three.js",
      "GLB Export",
      "Governance",
      "Simulation-Ready",
      "Desktop-Friendly",
      "World Model",
      "Perception",
      "Parametric Refinement",
      "Instruction-Led Editing",
      "Scene Diff",
    ],
    skills: [],
    desktopOnly: true,
    status: "live",
    mobileConfig: {
      executionProfile: 'cloud-preferred',
      supportsOffline: false,
      fallbackMode: 'cloud',
      cloudFallbackRoute: 'native',
    },
  },
  {
    id: "generative-ui",
    emoji: "LayoutTemplate",
    title: "Constrained Generative UI",
    description: "Ask about Prasad's background — the model can only emit JSON for a fixed component catalog, validated server-side before anything renders.",
    businessImpact: "Demonstrates safe generative UI for production: eliminates unvalidated AI-generated markup as an attack surface while keeping responses dynamic",
    businessOutcome: "Shows a catalog-constrained, schema-validated generative UI pattern (inspired by Vercel's json-render) applied server-side with this repo's existing guardrails, rate limiting, and observability.",
    href: "/demos/generative-ui",
    tags: ["Groq", "Generative UI", "Schema Validation", "Guardrails"],
    skills: ['guardrails', 'observability'],
    status: "live",
    mobileConfig: {
      executionProfile: 'cloud-preferred',
      supportsOffline: false,
      fallbackMode: 'cloud',
      cloudFallbackRoute: 'native',
    },
  },
];

// Named export alias for components that import as DEMOS
export const DEMOS = demos;
