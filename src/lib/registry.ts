/**
 * Tool Registry
 * 
 * Central registry for all AI tools and capabilities within the platform.
 * Supports the 'Tool Gateway' pattern for unified discovery, execution, and governance.
 */

export type ToolType = 
  | 'routing' 
  | 'orchestration' 
  | 'retrieval' 
  | 'evaluation' 
  | 'governance' 
  | 'utility' 
  | 'inference' 
  | 'transformation' 
  | 'spatial';

export type CostTier = 'free' | 'low' | 'medium' | 'high';
export type SecurityLevel = 'public' | 'standard' | 'enterprise' | 'critical';

export interface RegisteredTool {
  id: string;
  name: string;
  type: ToolType;
  path: string;
  cost_tier: CostTier;
  security_level: SecurityLevel;
  description: string;
}

export const TOOL_REGISTRY: RegisteredTool[] = [
  {
    id: 'llm-router',
    name: 'LLM Router',
    type: 'routing',
    path: '/demos/llm-router',
    cost_tier: 'low',
    security_level: 'standard',
    description: 'Intelligent model routing with real-time FinOps cost optimization.'
  },
  {
    id: 'multi-agent',
    name: 'Multi-Agent System',
    type: 'orchestration',
    path: '/demos/multi-agent',
    cost_tier: 'medium',
    security_level: 'enterprise',
    description: 'Orchestrated agents with human-in-the-loop (HITL) checkpoints.'
  },
  {
    id: 'rag-pipeline',
    name: 'RAG Pipeline',
    type: 'retrieval',
    path: '/demos/rag-pipeline',
    cost_tier: 'free',
    security_level: 'standard',
    description: 'Vector search with client-side WASM retrieval and visualization.'
  },
  {
    id: 'evaluation-showcase',
    name: 'AI Evaluation Showcase',
    type: 'evaluation',
    path: '/demos/evaluation-showcase',
    cost_tier: 'medium',
    security_level: 'enterprise',
    description: 'Closed-loop evaluation framework with LLM-as-Judge and drift detection.'
  },
  {
    id: 'enterprise-control-plane',
    name: 'Enterprise Control Plane',
    type: 'governance',
    path: '/demos/enterprise-control-plane',
    cost_tier: 'medium',
    security_level: 'enterprise',
    description: 'Unified gateway for discovery, RBAC, and observability.'
  },
  {
    id: 'mcp-demo',
    name: 'MCP Tool Demo',
    type: 'utility',
    path: '/demos/mcp-demo',
    cost_tier: 'low',
    security_level: 'standard',
    description: 'Standardized tool-use via Model Context Protocol (MCP).'
  },
  {
    id: 'vector-search',
    name: 'Vector Search',
    type: 'retrieval',
    path: '/demos/vector-search',
    cost_tier: 'free',
    security_level: 'standard',
    description: 'Client-side embedding visualization and similarity search.'
  },
  {
    id: 'portfolio-assistant',
    name: 'Portfolio Assistant',
    type: 'retrieval',
    path: '/demos/portfolio-assistant',
    cost_tier: 'low',
    security_level: 'standard',
    description: 'RAG-powered conversational assistant for portfolio interaction.'
  },
  {
    id: 'resume-generator',
    name: 'Resume Generator',
    type: 'transformation',
    path: '/demos/resume-generator',
    cost_tier: 'low',
    security_level: 'standard',
    description: 'Structured data generation for career artifacts.'
  },
  {
    id: 'multimodal',
    name: 'Multimodal Assistant',
    type: 'inference',
    path: '/demos/multimodal',
    cost_tier: 'free',
    security_level: 'standard',
    description: 'Browser-native vision and image analysis via WebGPU.'
  },
  {
    id: 'quantization',
    name: 'Model Quantization',
    type: 'inference',
    path: '/demos/quantization',
    cost_tier: 'free',
    security_level: 'standard',
    description: 'FP32 vs INT8 performance benchmarking on client-side engines.'
  },
  {
    id: 'browser-native-ai-skill',
    name: 'Browser-Native AI Skill',
    type: 'inference',
    path: '/demos/browser-native-ai-skill',
    cost_tier: 'free',
    security_level: 'standard',
    description: 'Client-side WASM inference for zero-cost, private processing.'
  },
  {
    id: 'world-generation',
    name: 'AI World Generation',
    type: 'spatial',
    path: '/demos/world-generation',
    cost_tier: 'high',
    security_level: 'enterprise',
    description: 'Governed spatial intelligence and procedural world generation.'
  }
];
