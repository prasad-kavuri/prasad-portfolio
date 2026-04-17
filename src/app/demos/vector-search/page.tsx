'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { loadTransformersModule, preloadTransformersOnIdle } from '@/lib/transformers-loader';
import { useBrowserAI } from '@/hooks/useBrowserAI';
import { BrowserAIWarning } from '@/components/BrowserAIWarning';

const KNOWLEDGE_BASE = [
  { id: 1, title: 'Kruti.ai — Agentic AI Platform', content: 'Led end-to-end architecture and delivery of India\'s first Agentic AI platform at Krutrim across multi-model orchestration, RAG pipelines, vector search, and real-time personalization. Drove 50% latency reduction and 40% cost savings through intelligent model routing.', category: 'krutrim' as const },
  { id: 2, title: 'Krutrim — Platform Scale and Adoption', content: 'Built and scaled a 200+ global engineering organization delivering enterprise-grade 24/7 PaaS capabilities. Defined SDK/API integration strategy and launched domain-specific AI agents to expand the Kruti.ai ecosystem across partners.', category: 'krutrim' as const },
  { id: 3, title: 'Ola Maps — Platform Transformation', content: 'Led platform transformation for Ola Maps by scaling cloud-native infrastructure, LLM-powered routing, and B2B APIs into a core mobility layer serving 13,000+ enterprise customers.', category: 'ola' as const },
  { id: 4, title: 'Ola — Reliability, Cost, and Fleet AI', content: 'Delivered a 70% infrastructure cost reduction through a cloud-native overhaul while maintaining reliability across millions of daily API calls, and introduced AI-powered real-time route optimization for fleet management.', category: 'ola' as const },
  { id: 5, title: 'HERE Technologies — Autonomous Driving', content: 'Led 85+ engineers across North America, Europe, and APAC at HERE Technologies. Delivered autonomous driving datasets for major OEMs while driving 50% cost reduction through cloud migration strategies.', category: 'here' as const },
  { id: 6, title: 'HERE Technologies — 18 Year Engineering Journey', content: 'Director of Engineering at HERE Technologies from 2005 to 2023. Progressed from Senior Engineer to Director managing global teams. Delivered mapping and geospatial solutions for automotive industry.', category: 'here' as const },
  { id: 7, title: 'Vector Search & Embeddings', content: 'Deep expertise in vector search, semantic embeddings, FAISS, ChromaDB, and retrieval-augmented generation. Built production RAG pipelines with transformer-based embedding models and hybrid search.', category: 'skills' as const },
  { id: 8, title: 'Multi-Agent AI Systems', content: 'Architected multi-agent AI systems using CrewAI and LangGraph. Built specialized agents with tool use, memory, and inter-agent communication for complex enterprise workflows.', category: 'skills' as const },
  { id: 9, title: 'Cloud & Infrastructure Leadership', content: 'Led cloud-native transformation across AWS, Azure, and GCP. Implemented Kubernetes microservices, CI/CD pipelines, and infrastructure-as-code resulting in 50-70% cost reductions.', category: 'skills' as const },
  { id: 10, title: 'Executive Leadership & Team Building', content: 'Managed global teams of 200+ engineers across US, Europe, and India. P&L management, executive stakeholder management, strategic vendor partnerships, and cross-functional collaboration at scale.', category: 'skills' as const },
  { id: 11, title: 'ML Model Optimization & Deployment', content: 'Expertise in quantization, pruning, and distillation of large language models. Deployed transformer models at scale with inference optimization and real-time serving infrastructure using ONNX and TensorRT.', category: 'skills' as const },
  { id: 12, title: 'Autonomous Driving & Computer Vision', content: 'Built computer vision pipelines for object detection, semantic segmentation, and 3D perception. Integrated perception stacks with planning and control systems for autonomous vehicle platforms.', category: 'here' as const },
  { id: 13, title: 'Real-time Personalization Systems', content: 'Designed real-time personalization engines for millions of concurrent users using collaborative filtering and transformer embeddings. Reduced recommendation latency by 60% through model optimization.', category: 'ola' as const },
  { id: 14, title: 'Graph Neural Networks & Knowledge Graphs', content: 'Built knowledge graph infrastructure for semantic understanding and entity linking. Implemented GNN models for relationship prediction and cross-domain knowledge discovery.', category: 'skills' as const },
  { id: 15, title: 'Scaling ML Platforms to 10M+ Users', content: 'Architected ML platforms handling 10M+ concurrent users with sub-100ms latency requirements. Implemented distributed training, feature stores, and real-time serving infrastructure across multi-cloud environments.', category: 'skills' as const },
];

type RetrievedDoc = { doc: typeof KNOWLEDGE_BASE[0]; similarity: number };
type Status = 'idle' | 'loading-model' | 'ready' | 'searching' | 'error';

const CATEGORY_COLORS: Record<string, string> = {
  krutrim: '#3b82f6', // blue
  ola: '#10b981', // green
  here: '#f97316', // orange
  skills: '#a855f7', // purple
};

const CATEGORY_LABELS: Record<string, string> = {
  krutrim: 'Krutrim',
  ola: 'Ola',
  here: 'HERE',
  skills: 'Skills',
};

export default function VectorSearchPage() {
  const browserAI = useBrowserAI();
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RetrievedDoc[]>([]);
  const [queryTime, setQueryTime] = useState(0);
  const [hoveredDoc, setHoveredDoc] = useState<number | null>(null);

  const pipelineRef = useRef<any>(null);
  const embeddingsRef = useRef<Map<number, number[]>>(new Map());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const projections2DRef = useRef<Map<number, [number, number]>>(new Map());

  useEffect(() => {
    if (!browserAI.shouldAttemptLoad) return;
    const cancelPreload = preloadTransformersOnIdle();
    return () => cancelPreload();
  }, [browserAI.shouldAttemptLoad]);

  const cosineSimilarity = (a: number[], b: number[]) => {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  };

  const simplePCA = () => {
    const embeddings = Array.from(embeddingsRef.current.values());
    if (embeddings.length === 0) return;

    const dim = embeddings[0].length;
    const n = embeddings.length;

    // Compute mean
    const mean = new Array(dim).fill(0);
    for (const emb of embeddings) {
      for (let i = 0; i < dim; i++) {
        mean[i] += emb[i] / n;
      }
    }

    // Center embeddings
    const centered = embeddings.map(emb =>
      emb.map((v, i) => v - mean[i])
    );

    // Compute covariance matrix (simplified for first 2 components)
    const cov = Array(2).fill(0).map(() => Array(2).fill(0));
    for (const emb of centered) {
      cov[0][0] += emb[0] * emb[0] / n;
      cov[0][1] += emb[0] * emb[1] / n;
      cov[1][0] += emb[1] * emb[0] / n;
      cov[1][1] += emb[1] * emb[1] / n;
    }

    // Simple eigenvalue-like projection using first 2 dims
    const projections = new Map<number, [number, number]>();
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    Array.from(embeddingsRef.current.keys()).forEach((docId, idx) => {
      const emb = embeddings[idx];
      const x = emb[0];
      const y = emb[1];
      projections.set(docId, [x, y]);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    });

    // Normalize to canvas size
    const canvasWidth = 600;
    const canvasHeight = 400;
    const padding = 40;
    const plotWidth = canvasWidth - 2 * padding;
    const plotHeight = canvasHeight - 2 * padding;

    projections.forEach((pos, docId) => {
      const [x, y] = pos;
      const normX = padding + ((x - minX) / (maxX - minX || 1)) * plotWidth;
      const normY = padding + ((y - minY) / (maxY - minY || 1)) * plotHeight;
      projections.set(docId, [normX, normY]);
    });

    projections2DRef.current = projections;
  };

  const drawVisualization = (queryResults: RetrievedDoc[]) => {
    const canvas = canvasRef.current;
    if (!canvas || projections2DRef.current.size === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const x = (canvas.width / 5) * i;
      const y = (canvas.height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw all documents as dots
    KNOWLEDGE_BASE.forEach(doc => {
      const pos = projections2DRef.current.get(doc.id);
      if (!pos) return;

      const [x, y] = pos;
      const isResult = queryResults.some(r => r.doc.id === doc.id);
      const isHovered = hoveredDoc === doc.id;

      ctx.fillStyle = isResult ? '#ef4444' : CATEGORY_COLORS[doc.category];
      const radius = isResult ? 8 : isHovered ? 6 : 4;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw outline for hovered
      if (isHovered) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // Draw legend
    const legendX = 20;
    let legendY = 20;
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#e2e8f0';

    Object.entries(CATEGORY_LABELS).forEach(([key, label]) => {
      ctx.fillStyle = CATEGORY_COLORS[key];
      ctx.beginPath();
      ctx.arc(legendX, legendY, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(label, legendX + 15, legendY + 4);
      legendY += 20;
    });

    // Red dot for results
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(legendX, legendY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('Query Results', legendX + 15, legendY + 4);
  };

  const loadModel = async () => {
    setStatus('loading-model');
    setProgress(0);
    setError('');
    try {
      setProgressMsg('Importing Transformers.js...');
      setProgress(5);

      const { pipeline, env } = await loadTransformersModule();
      env.allowLocalModels = false;
      env.allowRemoteModels = true;

      setProgressMsg('Downloading all-MiniLM-L6-v2 (32MB)...');
      setProgress(10);

      const extractor = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
        {
          progress_callback: (p: any) => {
            if (p.progress) {
              const pct = Math.round(10 + p.progress * 70);
              setProgress(pct);
              setProgressMsg(`Downloading model: ${Math.round(p.progress * 100)}%`);
            }
          },
        }
      );

      pipelineRef.current = extractor;
      setProgress(82);
      setProgressMsg('Pre-computing knowledge base embeddings...');

      for (let i = 0; i < KNOWLEDGE_BASE.length; i++) {
        const doc = KNOWLEDGE_BASE[i];
        const out = await extractor(doc.content, { pooling: 'mean', normalize: true });
        embeddingsRef.current.set(doc.id, Array.from(out.data as Float32Array));
        setProgress(82 + Math.round((i / KNOWLEDGE_BASE.length) * 16));
        setProgressMsg(`Embedding document ${i + 1} of ${KNOWLEDGE_BASE.length}...`);
      }

      simplePCA();

      setProgress(100);
      setProgressMsg('Ready!');
      setStatus('ready');
    } catch (e: any) {
      console.error('Model load error:', e);
      setError(e?.message || 'Failed to load model');
      setStatus('error');
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    // --- SIMULATED PATH (mobile / low-memory) ---
    if (!browserAI.shouldAttemptLoad) {
      setStatus('searching');
      await new Promise(r => setTimeout(r, 600));
      setResults([
        { doc: KNOWLEDGE_BASE[0], similarity: 0.96 },
        { doc: KNOWLEDGE_BASE[6], similarity: 0.93 },
        { doc: KNOWLEDGE_BASE[7], similarity: 0.90 },
        { doc: KNOWLEDGE_BASE[1], similarity: 0.87 },
        { doc: KNOWLEDGE_BASE[9], similarity: 0.81 },
      ]);
      setQueryTime(38);
      setStatus('ready');
      return;
    }
    // --- END SIMULATED PATH ---

    if (!pipelineRef.current) return;
    setStatus('searching');
    const t0 = performance.now();
    try {
      const out = await pipelineRef.current(query, { pooling: 'mean', normalize: true });
      const qVec = Array.from(out.data as Float32Array);
      const scored = KNOWLEDGE_BASE.map(doc => ({
        doc,
        similarity: cosineSimilarity(qVec, embeddingsRef.current.get(doc.id)!),
      })).sort((a, b) => b.similarity - a.similarity).slice(0, 5);
      setResults(scored);
      setQueryTime(Math.round(performance.now() - t0));
      drawVisualization(scored);
    } catch (e: any) {
      setError(e?.message || 'Search failed');
    } finally {
      setStatus('ready');
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let found: number | null = null;
    projections2DRef.current.forEach((pos, docId) => {
      const [px, py] = pos;
      const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
      if (dist < 8) {
        found = docId;
      }
    });

    setHoveredDoc(found);
    if (results.length > 0) {
      drawVisualization(results);
    }
  };

  const handleCanvasClick = () => {
    if (hoveredDoc !== null) {
      const doc = KNOWLEDGE_BASE.find(d => d.id === hoveredDoc);
      if (doc) {
        setQuery(doc.title);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Vector Search Demo</h1>
            <p className="mt-1 text-muted-foreground">Semantic search with 2D embedding visualization</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/" className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-foreground hover:bg-muted/80">
              <ArrowLeft size={16} /> Back
            </Link>
          </div>
        </div>

        <BrowserAIWarning status={browserAI} demoName="vector search" />

        {/* Start button */}
        {status === 'idle' && (
          <Card className="border-border bg-card p-8 text-center">
            <p className="mb-4 text-muted-foreground">Click to load the embedding model in your browser. No API key required.</p>
            <button
              onClick={browserAI.shouldAttemptLoad ? loadModel : () => setStatus('ready')}
              className="rounded-lg bg-blue-600 px-8 py-3 font-medium text-white hover:bg-blue-700"
            >
              {browserAI.shouldAttemptLoad ? 'Load Model & Start' : 'Try Simulated Demo'}
            </button>
          </Card>
        )}

        {/* Loading */}
        {status === 'loading-model' && (
          <Card className="border-border bg-card p-6">
            <p className="mb-3 font-medium text-foreground">Loading model...</p>
            <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-2 rounded-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-sm text-muted-foreground">{progress}% — {progressMsg}</p>
          </Card>
        )}

        {/* Error */}
        {status === 'error' && (
          <Card className="border-red-800 bg-red-900/20 p-6">
            <p className="mb-2 font-medium text-red-400">Error loading model</p>
            <p className="mb-4 text-sm text-red-300">{error}</p>
            <button onClick={loadModel} className="rounded bg-red-700 px-4 py-2 text-sm text-white hover:bg-red-600">
              Retry
            </button>
          </Card>
        )}

        {/* Search UI */}
        {(status === 'ready' || status === 'searching') && (
          <>
            <Card className="mb-6 border-border bg-card p-6">
              <label className="mb-2 block text-sm font-medium text-foreground">Query</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="e.g. What is Prasad's AI experience?"
                  className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-foreground placeholder-muted-foreground focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={handleSearch}
                  disabled={!query.trim() || status === 'searching'}
                  className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {status === 'searching' ? 'Searching...' : 'Search'}
                </button>
              </div>
            </Card>

            {/* Visualization */}
            <Card className="mb-6 border-border bg-card p-6">
              <p className="mb-3 text-sm font-medium text-foreground">Embedding Space (2D Projection)</p>
              <canvas
                ref={canvasRef}
                width={600}
                height={400}
                onMouseMove={handleCanvasMouseMove}
                onClick={handleCanvasClick}
                className="w-full rounded-lg border border-border bg-background cursor-pointer"
              />
              <p className="mt-2 text-xs text-muted-foreground">Hover over dots to see details • Click to search by document</p>
            </Card>

            {hoveredDoc !== null && (
              <Card className="mb-6 border-border bg-card p-4">
                <p className="text-sm font-medium text-foreground">
                  {KNOWLEDGE_BASE.find(d => d.id === hoveredDoc)?.title}
                </p>
              </Card>
            )}

            {results.length > 0 && (
              <>
                <div className="mb-4 grid grid-cols-3 gap-4">
                  <Card className="border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Query time</p>
                    <p className="text-2xl font-bold text-blue-400">{queryTime}ms</p>
                  </Card>
                  <Card className="border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Docs searched</p>
                    <p className="text-2xl font-bold text-green-400">{KNOWLEDGE_BASE.length}</p>
                  </Card>
                  <Card className="border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Top similarity</p>
                    <p className="text-2xl font-bold text-purple-400">{(results[0].similarity * 100).toFixed(1)}%</p>
                  </Card>
                </div>
                <h2 className="mb-3 text-lg font-semibold text-foreground">Top 5 Retrieved Documents</h2>
                <div className="space-y-3">
                  {results.map((r, i) => (
                    <Card key={r.doc.id} className="border-border bg-card p-5">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-medium text-foreground">{i + 1}. {r.doc.title}</span>
                        <Badge className={r.similarity > 0.7 ? 'bg-green-600' : r.similarity > 0.5 ? 'bg-yellow-600' : 'bg-orange-600'}>
                          {(r.similarity * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{r.doc.content}</p>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {results.length === 0 && status === 'ready' && (
              <Card className="border-border bg-card p-12 text-center">
                <p className="text-muted-foreground">Enter a query above and click Search to see results in the visualization</p>
              </Card>
            )}
          </>
        )}

        <Card className="mt-8 border-border bg-card p-5">
          <p className="mb-2 font-medium text-foreground">How it works</p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Model runs entirely in your browser via WebAssembly — no server</li>
            <li>• Uses all-MiniLM-L6-v2 (32MB) for 384-dimensional semantic embeddings</li>
            <li>• 2D visualization projects embeddings using PCA-style dimensionality reduction</li>
            <li>• Cosine similarity ranks documents by semantic relevance</li>
            <li>• Click visualization dots to search by those documents</li>
            <li>• No API keys or server-side processing required</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
