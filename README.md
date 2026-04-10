# Prasad Kavuri — AI Engineering Portfolio

> Live at [prasadkavuri.com](https://prasadkavuri.com)

AI Engineering Executive Portfolio — 9 live AI demos showcasing 
agentic AI, multi-model orchestration, RAG, MCP tool use, and 
open-source model inference. Built with Next.js 16, Tailwind v4, 
Groq, and Hugging Face.

## Live Demos

| Demo | Tech Stack | Status |
|------|-----------|--------|
| RAG Pipeline | Transformers.js, all-MiniLM-L6-v2, ChromaDB | Live |
| Vector Search + 2D Viz | Transformers.js, PCA projection, Canvas | Live |
| LLM Router | Groq API, Llama 3.1/3.3, Qwen3, Llama 4 | Live |
| AI Portfolio Assistant | Groq, Llama 3.1 8B, RAG, Streaming | Live |
| Resume Generator | Groq, Llama 3.3 70B, ATS optimization | Live |
| Multimodal Assistant | ViT-base, CLIP zero-shot, Transformers.js | Live |
| Model Quantization | ONNX, FP32 vs INT8 benchmark, Transformers.js | Live |
| Multi-Agent System | Three specialized AI agents (Analyzer, Researcher, Strategist) collaborate via Groq — powered by FastAPI backend on Hugging Face Spaces | Live |
| MCP Tool Demo | Model Context Protocol, Groq tool calling, JSON-RPC 2.0 | Live |

## Architecture

Organized into 3 demo groups: **Core AI Infrastructure** (RAG, Vector Search, Quantization), **Agentic Systems** (Multi-Agent, LLM Router), and **AI Applications** (Portfolio Assistant, Resume Generator, Multimodal, MCP Tool Demo).

```
prasad-portfolio/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main portfolio page
│   │   ├── layout.tsx            # Root layout + ThemeProvider
│   │   ├── demos/                # Individual demo pages
│   │   │   ├── rag-pipeline/
│   │   │   ├── vector-search/
│   │   │   ├── llm-router/
│   │   │   ├── portfolio-assistant/
│   │   │   ├── resume-generator/
│   │   │   ├── multimodal/
│   │   │   └── quantization/
│   │   └── api/                  # Server-side API routes
│   │       ├── llm-router/       # Groq multi-model routing
│   │       ├── portfolio-assistant/ # RAG + streaming chat
│   │       └── resume-generator/ # JD parsing + ATS optimization
│   ├── components/
│   │   ├── layout/               # Navbar, Footer
│   │   ├── sections/             # Hero, AITools, Expertise, Experience, Contact
│   │   └── ui/                   # shadcn components
│   ├── data/
│   │   ├── profile.json          # Single source of truth for all profile data
│   │   └── demos.ts              # Demo card definitions
│   └── lib/
│       └── utils.ts
├── public/
│   └── profile-photo.jpg
└── ...config files
```

## Tech Stack

**Frontend**
- Next.js 16 (App Router, Turbopack)
- TypeScript
- Tailwind CSS v4 (no config file)
- shadcn/ui (Nova preset, Radix primitives)
- Framer Motion
- next-themes (dark mode)

**AI / ML**
- @huggingface/transformers v3 (browser-side ONNX inference)
- Groq SDK (llama-3.1-8b-instant, llama-3.3-70b-versatile, llama-4-scout, qwen3-32b)
- Vercel AI SDK (streaming)
- Models: all-MiniLM-L6-v2, ViT-base-patch16-224, CLIP ViT-base-patch32
- HuggingFace Spaces (FastAPI Docker backend for Multi-Agent)
- MCP (Model Context Protocol) — Linux Foundation standard

**Infrastructure**
- Vercel (deployment, edge functions, analytics)
- GitHub (source control, CI/CD via Vercel integration)

## Key Design Decisions

**Browser-first AI**: RAG pipeline, vector search, multimodal, and quantization 
demos run entirely in-browser via WebAssembly — no server, no API key for visitors.

**Single source of truth**: All profile data lives in `src/data/profile.json`. 
Update once, propagates to Hero, Portfolio Assistant, Resume Generator, and all sections.

**Real inference, not simulation**: Every demo uses actual model inference — 
real embeddings, real LLM calls, real latency measurements. No hardcoded fake outputs.

**Server-side API keys**: Groq API calls go through Next.js API routes — 
keys never exposed to the browser.

## Local Development

```bash
# Clone
git clone https://github.com/prasad-kavuri/prasad-portfolio.git
cd prasad-portfolio

# Install
npm install

# Environment variables
cp .env.local.example .env.local
# Add your GROQ_API_KEY to .env.local

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes (for LLM demos) | Groq API key from console.groq.com |

Browser-only demos (RAG, Vector Search, Multimodal, Quantization) work without any API key.

## Profile Data

All professional information is centralized in `src/data/profile.json`:

```json
{
  "personal": { ... },
  "stats": [ ... ],
  "experience": [ ... ],
  "education": [ ... ],
  "skills": { ... },
  "achievements": [ ... ],
  "knowledgeBase": [ ... ]
}
```

To update your profile, edit this file — changes propagate automatically.

## Deployment

Deployed on Vercel with automatic deployments on push to `main`.

```bash
# Deploy manually
npx vercel --prod
```

## License

MIT
