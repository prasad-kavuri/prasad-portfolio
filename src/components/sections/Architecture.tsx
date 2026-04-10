'use client';

import { useState } from 'react';

const colorMap = {
  indigo: {
    border: 'border-indigo-500/30',
    bg: 'bg-indigo-500/5',
    text: 'text-indigo-300',
    chipBg: 'bg-indigo-500/15',
    chipText: 'text-indigo-200',
  },
  violet: {
    border: 'border-violet-500/30',
    bg: 'bg-violet-500/5',
    text: 'text-violet-300',
    chipBg: 'bg-violet-500/15',
    chipText: 'text-violet-200',
  },
  blue: {
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/5',
    text: 'text-blue-300',
    chipBg: 'bg-blue-500/15',
    chipText: 'text-blue-200',
  },
  teal: {
    border: 'border-teal-500/30',
    bg: 'bg-teal-500/5',
    text: 'text-teal-300',
    chipBg: 'bg-teal-500/15',
    chipText: 'text-teal-200',
  },
  green: {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/5',
    text: 'text-emerald-300',
    chipBg: 'bg-emerald-500/15',
    chipText: 'text-emerald-200',
  },
};

const LAYERS = [
  {
    id: "users",
    number: "01",
    label: "Users & Channels",
    description: "How people interact with AI systems",
    color: "indigo",
    components: ["Customers", "Employees", "Recruiters", "Business Teams", "Web / Chat / Mobile"]
  },
  {
    id: "experience",
    number: "02",
    label: "AI Experience Layer",
    description: "User-facing AI applications for specific workflows",
    color: "indigo",
    components: ["Portfolio Assistant", "Resume Generator", "Multimodal Interface", "Workflow AI Apps", "Domain Agents"]
  },
  {
    id: "orchestration",
    number: "03",
    label: "Agentic Orchestration",
    description: "Coordinates tasks, agents, memory, and execution",
    color: "violet",
    components: ["Planner Agent", "Specialist Agents", "Multi-Agent Coordination", "Memory / Context", "Guardrails", "Human Approval"]
  },
  {
    id: "intelligence",
    number: "04",
    label: "Intelligence Layer",
    description: "Selects models, retrieves context, balances cost/latency/quality",
    color: "blue",
    components: ["LLM Router", "Multi-Model Inference", "RAG Pipeline", "Vector Search", "Prompt Engineering", "Classification"]
  },
  {
    id: "tools",
    number: "05",
    label: "Tools, Data & Enterprise Systems",
    description: "Connects AI to business systems and operational data",
    color: "teal",
    components: ["MCP Tools", "External APIs", "Knowledge Bases", "CRM / ERP", "Databases", "Analytics / Monitoring"]
  },
  {
    id: "outcomes",
    number: "06",
    label: "Business Outcomes",
    description: "Measurable enterprise value from AI transformation",
    color: "green",
    components: ["50% Latency Reduction", "70% Cost Savings", "13K+ Customers", "Faster Decisions", "Operational Automation", "AI at Scale"]
  }
];

export function Architecture() {
  const [activeLayer, setActiveLayer] = useState<string | null>(null);

  return (
    <section id="architecture" className="bg-slate-900 py-20">
      <div className="mx-auto max-w-5xl px-4">
        {/* Header */}
        <div className="mb-16">
          <p className="text-xs font-semibold tracking-widest text-indigo-400 uppercase mb-3">
            Enterprise AI Architecture
          </p>
          <h2 className="text-3xl font-semibold text-white mb-4">
            How I Build Enterprise AI Systems
          </h2>
          <p className="text-slate-400 max-w-2xl leading-relaxed">
            From user intent to production execution — connecting AI models, agents, tools, and workflows into real business systems.
          </p>
        </div>

        {/* Diagram */}
        <div className="space-y-1">
          {LAYERS.map((layer, idx) => (
            <div key={layer.id}>
              <div
                className={`relative rounded-xl border p-5 cursor-pointer transition-all duration-200
                  ${activeLayer === layer.id ? 'scale-[1.01] shadow-lg' : 'hover:scale-[1.005]'}
                  ${colorMap[layer.color as keyof typeof colorMap].border}
                  ${colorMap[layer.color as keyof typeof colorMap].bg}
                `}
                onMouseEnter={() => setActiveLayer(layer.id)}
                onMouseLeave={() => setActiveLayer(null)}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Left: number + label + description */}
                  <div className="md:w-64 flex-shrink-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-mono text-slate-500">{layer.number}</span>
                      <span className={`text-sm font-semibold ${colorMap[layer.color as keyof typeof colorMap].text}`}>
                        {layer.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {layer.description}
                    </p>
                  </div>

                  {/* Divider line */}
                  <div className="hidden md:block w-px h-10 bg-slate-700 flex-shrink-0" />

                  {/* Right: component chips */}
                  <div className="flex flex-wrap gap-2">
                    {layer.components.map((component) => (
                      <span
                        key={component}
                        className={`text-xs px-3 py-1 rounded-full border
                          ${colorMap[layer.color as keyof typeof colorMap].chipBg}
                          ${colorMap[layer.color as keyof typeof colorMap].chipText}
                          ${colorMap[layer.color as keyof typeof colorMap].border}
                        `}
                      >
                        {component}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Arrow between layers */}
              {idx < LAYERS.length - 1 && (
                <div className="flex justify-center my-1">
                  <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
                    <path
                      d="M10 0 L10 12 M5 8 L10 14 L15 8"
                      stroke="#4f46e5"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Caption */}
        <p className="text-center text-slate-400 text-sm mt-10 max-w-2xl mx-auto italic">
          "This architecture reflects how I think about enterprise AI: not as isolated
          models, but as connected systems that combine orchestration, retrieval, tool
          use, and workflow integration to drive real business outcomes."
        </p>
      </div>
    </section>
  );
}
