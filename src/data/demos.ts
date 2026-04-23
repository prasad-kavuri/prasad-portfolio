import type { DemoExecutionProfile } from '@/lib/device-intelligence';

export type Demo = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  businessImpact: string;
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
    id: "rag-pipeline",
    emoji: "Database",
    title: "RAG Pipeline",
    description: "Real retrieval-augmented generation with Transformers.js embeddings and ChromaDB — runs entirely in your browser.",
    businessImpact: "Improves grounded enterprise knowledge retrieval and reduces unsupported AI answers in operational workflows",
    href: "/demos/rag-pipeline",
    tags: ["Transformers.js", "ChromaDB", "nomic-embed-text"],
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
    description: "Real multi-model routing across Llama 3.1 8B, 70B, and Mixtral — see live latency, cost, and quality trade-offs.",
    businessImpact: "Balances quality, latency, and spend across model tiers for production AI request routing",
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
    id: "vector-search",
    emoji: "Search",
    title: "Vector Search",
    description: "Semantic search with real sentence-BERT embeddings and UMAP visualisation of the embedding space.",
    businessImpact: "Enables semantic discovery and natural-language retrieval across enterprise content systems",
    href: "/demos/vector-search",
    tags: ["all-MiniLM-L6-v2", "UMAP", "Cosine similarity"],
    skills: [],
    desktopOnly: true,
    status: "live",
    mobileConfig: {
      executionProfile: 'heavy-local',
      supportsOffline: true,
      fallbackMode: 'cloud',
      cloudFallbackRoute: '/api/llm-router',
      fallbackMessage: 'Using cloud semantic search on this device.',
      capabilityNotes: 'Runs sentence-BERT embeddings via WASM',
    },
  },
  {
    id: "evaluation-showcase",
    emoji: "ShieldCheck",
    title: "AI Evaluation Showcase",
    description: "Closed-loop LLM evaluation pipeline — semantic fidelity, hallucination detection, guardrails, and CI gating in action. Production-derived eval thresholds — calibrated from real Krutrim deployment patterns.",
    businessImpact: "Improves release confidence through measurable quality gates and regression visibility before deployment",
    href: "/demos/evaluation-showcase",
    tags: ["LLM-as-Judge", "Semantic Fidelity", "Guardrails", "CI Gating"],
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
    description: "CrewAI-powered agents with real LLM calls via Groq — Analyzer, Researcher, and Strategist collaborating in real time.",
    businessImpact: "Coordinates specialized agent workflows with approvals and auditability for high-impact enterprise decisions",
    href: "/demos/multi-agent",
    tags: ["CrewAI", "Groq", "Llama 3.3"],
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
    description: "Model Context Protocol in action — watch an LLM discover and call tools to answer questions about Prasad's background.",
    businessImpact: "Improves reliability by standardizing tool access across agent workflows",
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
    href: "/demos/portfolio-assistant",
    tags: ["Vercel AI SDK", "Streaming", "Retrieval Grounding"],
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
    id: "resume-generator",
    emoji: "FileText",
    title: "AI Hiring Intelligence",
    description: "Paste a job description — get multi-dimension fit scoring, HITL-gated tailoring, and an ATS-optimized resume with drift detection.",
    businessImpact: "Reduces recruiting cycle time through faster candidate-role alignment",
    href: "/demos/resume-generator",
    tags: ["JD parsing", "Skill matching", "HITL", "Evaluation", "Multi-Agent"],
    skills: ['planning'],
    status: "live",
    mobileConfig: {
      executionProfile: 'cloud-preferred',
      supportsOffline: false,
      fallbackMode: 'cloud',
      cloudFallbackRoute: 'native',
    },
  },
  {
    id: "multimodal",
    emoji: "Eye",
    title: "Multimodal Assistant",
    description: "Florence-2 image captioning and OCR running in-browser via Transformers.js — no server, no API key.",
    businessImpact: "Lowers processing costs by running vision workflows closer to users",
    href: "/demos/multimodal",
    tags: ["Florence-2", "WebGPU", "In-browser"],
    skills: [],
    desktopOnly: true,
    status: "live",
    mobileConfig: {
      executionProfile: 'heavy-local',
      supportsOffline: false,
      fallbackMode: 'simulated',  // No server-side vision model available
      cloudFallbackRoute: null,
      fallbackMessage: 'Showing simulated walkthrough — WebGPU required for live inference.',
      capabilityNotes: 'Requires WebGPU for Florence-2 vision model',
    },
  },
  {
    id: "quantization",
    emoji: "Zap",
    title: "Model Quantization",
    description: "Live ONNX benchmark comparing INT8 vs FP32 inference — real file sizes, real latency, real quality diff.",
    businessImpact: "Reduces infrastructure overhead through smaller, faster production models",
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
    description: "Org-wide AI governance dashboard — RBAC, group spend limits with token-cost tracking, and OpenTelemetry observability feed.",
    businessImpact: "Operationalizes enterprise AI oversight with RBAC, spend controls, and traceable policy enforcement",
    href: "/demos/enterprise-control-plane",
    tags: ["Enterprise", "RBAC", "OpenTelemetry", "Token Analytics"],
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
    id: "browser-native-ai-skill",
    emoji: "MonitorCheck",
    title: "Native Browser AI Skill",
    description: "A reusable Chrome AI Skill that audits webpage accessibility using on-device Gemini Nano.",
    businessImpact: "0ms Latency and 100% Privacy (Edge-inference) for accessibility auditing workflows",
    href: "/demos/browser-native-ai-skill",
    tags: ["Chrome Prompt API", "Gemini Nano", "WASM"],
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
    id: "world-generation",
    emoji: "Cuboid",
    title: "Real-Time Spatial AI + World Modeling Engine",
    description:
      "Perception → reconstruction → agent reasoning. Precomputed 3D mesh playback with drift correction visualization and LLM spatial query layer.",
    businessImpact:
      "Accelerates logistics and spatial planning with policy-aware world artifacts that are explainable, reviewable, and simulation-ready",
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
];

// Named export alias for components that import as DEMOS
export const DEMOS = demos;
