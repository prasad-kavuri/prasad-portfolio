export type Demo = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  href: string;
  tags: string[];
  status: "live" | "upgrading" | "coming-soon";
};

export const demos: Demo[] = [
  {
    id: "rag-pipeline",
    emoji: "🚀",
    title: "RAG Pipeline",
    description: "Real retrieval-augmented generation with Transformers.js embeddings and ChromaDB — runs entirely in your browser.",
    href: "/demos/rag-pipeline",
    tags: ["Transformers.js", "ChromaDB", "nomic-embed-text"],
    status: "live",
  },
  {
    id: "multi-agent",
    emoji: "👥",
    title: "Multi-Agent System",
    description: "CrewAI-powered agents with real LLM calls via Groq — Analyzer, Researcher, and Strategist collaborating in real time.",
    href: "/demos/multi-agent",
    tags: ["CrewAI", "Groq", "Llama 3.3"],
    status: "upgrading",
  },
  {
    id: "llm-router",
    emoji: "🔄",
    title: "LLM Router",
    description: "Real multi-model routing across Llama 3.1 8B, 70B, and Mixtral — see live latency, cost, and quality trade-offs.",
    href: "/demos/llm-router",
    tags: ["Groq", "Multi-model", "Live latency"],
    status: "upgrading",
  },
  {
    id: "vector-search",
    emoji: "🔎",
    title: "Vector Search",
    description: "Semantic search with real sentence-BERT embeddings and UMAP visualisation of the embedding space.",
    href: "/demos/vector-search",
    tags: ["all-MiniLM-L6-v2", "UMAP", "Cosine similarity"],
    status: "live",
  },
  {
    id: "portfolio-assistant",
    emoji: "🤖",
    title: "AI Portfolio Assistant",
    description: "Streaming RAG-powered assistant over my experience — ask anything about my background and see retrieved context.",
    href: "/demos/portfolio-assistant",
    tags: ["Vercel AI SDK", "Streaming", "RAG"],
    status: "upgrading",
  },
  {
    id: "resume-generator",
    emoji: "📄",
    title: "Resume Generator",
    description: "Paste a job description, get a tailored resume with skill matching scores and selection reasoning.",
    href: "/demos/resume-generator",
    tags: ["JD parsing", "Skill matching", "PDF export"],
    status: "upgrading",
  },
  {
    id: "multimodal",
    emoji: "🎭",
    title: "Multimodal Assistant",
    description: "Florence-2 image captioning and OCR running in-browser via Transformers.js — no server, no API key.",
    href: "/demos/multimodal",
    tags: ["Florence-2", "WebGPU", "In-browser"],
    status: "upgrading",
  },
  {
    id: "quantization",
    emoji: "⚡",
    title: "Model Quantization",
    description: "Live ONNX benchmark comparing INT8 vs FP32 inference — real file sizes, real latency, real quality diff.",
    href: "/demos/quantization",
    tags: ["ONNX", "INT8 vs FP32", "Transformers.js"],
    status: "upgrading",
  },
];