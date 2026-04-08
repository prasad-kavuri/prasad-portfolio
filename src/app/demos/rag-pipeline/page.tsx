'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const KNOWLEDGE_BASE = [
  { id: 1, title: 'Kruti.ai — Agentic AI Platform', content: 'Led India\'s first Agentic AI platform at Krutrim with 200+ engineers. Achieved 50% latency reduction and 40% cost savings through multi-model LLM orchestration. Built domain-specific agents for mobility, payments, and content generation.' },
  { id: 2, title: 'Krutrim — LLM Ops & MLOps', content: 'Built enterprise-grade 24/7 PaaS capabilities with SDK/API integration at Krutrim. Implemented LLM Ops pipelines, RAG systems, and real-time inference infrastructure for production AI workloads.' },
  { id: 3, title: 'Ola Maps — B2B Platform Launch', content: 'Launched Ola Maps B2B platform with 150+ engineers acquiring 13,000+ customers. Created new recurring revenue channel and reduced infrastructure costs by 70% while scaling to millions of daily API calls.' },
  { id: 4, title: 'Ola — AI Route Optimization', content: 'Introduced AI-powered real-time route optimization improving ETA accuracy across millions of rides. Enabled predictive analytics for electric mobility operations and fleet management.' },
  { id: 5, title: 'HERE Technologies — Autonomous Driving', content: 'Led 85+ engineers across North America, Europe, and APAC at HERE Technologies. Delivered autonomous driving datasets for major OEMs while driving 50% cost reduction through cloud migration strategies.' },
  { id: 6, title: 'HERE Technologies — 18 Year Engineering Journey', content: 'Director of Engineering at HERE Technologies from 2005 to 2023. Progressed from Senior Engineer to Director managing global teams. Delivered mapping and geospatial solutions for automotive industry.' },
  { id: 7, title: 'Vector Search & Embeddings', content: 'Deep expertise in vector search, semantic embeddings, FAISS, ChromaDB, and retrieval-augmented generation. Built production RAG pipelines with transformer-based embedding models and hybrid search.' },
  { id: 8, title: 'Multi-Agent AI Systems', content: 'Architected multi-agent AI systems using CrewAI and LangGraph. Built specialized agents with tool use, memory, and inter-agent communication for complex enterprise workflows.' },
  { id: 9, title: 'Cloud & Infrastructure Leadership', content: 'Led cloud-native transformation across AWS, Azure, and GCP. Implemented Kubernetes microservices, CI/CD pipelines, and infrastructure-as-code resulting in 50-70% cost reductions.' },
  { id: 10, title: 'Executive Leadership & Team Building', content: 'Managed global teams of 200+ engineers across US, Europe, and India. P&L management, executive stakeholder management, strategic vendor partnerships, and cross-functional collaboration at scale.' },
];

type RetrievedDoc = { doc: typeof KNOWLEDGE_BASE[0]; similarity: number };
type Status = 'idle' | 'loading-model' | 'ready' | 'searching' | 'error';

export default function RAGPipelinePage() {
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RetrievedDoc[]>([]);
  const [queryTime, setQueryTime] = useState(0);

  const pipelineRef = useRef<any>(null);
  const embeddingsRef = useRef<Map<number, number[]>>(new Map());

  const cosineSimilarity = (a: number[], b: number[]) => {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  };

  const loadModel = async () => {
    setStatus('loading-model');
    setProgress(0);
    setError('');
    try {
      setProgressMsg('Importing Transformers.js...');
      setProgress(5);

      // @ts-ignore
      const { pipeline, env } = await import('@huggingface/transformers');
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
    if (!query.trim() || !pipelineRef.current) return;
    setStatus('searching');
    const t0 = performance.now();
    try {
      const out = await pipelineRef.current(query, { pooling: 'mean', normalize: true });
      const qVec = Array.from(out.data as Float32Array);
      const scored = KNOWLEDGE_BASE.map(doc => ({
        doc,
        similarity: cosineSimilarity(qVec, embeddingsRef.current.get(doc.id)!),
      })).sort((a, b) => b.similarity - a.similarity).slice(0, 3);
      setResults(scored);
      setQueryTime(Math.round(performance.now() - t0));
    } catch (e: any) {
      setError(e?.message || 'Search failed');
    } finally {
      setStatus('ready');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">RAG Pipeline Demo</h1>
            <p className="mt-1 text-slate-400">Retrieval-Augmented Generation with local embeddings</p>
          </div>
          <Link href="/" className="flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-slate-200 hover:bg-slate-600">
            <ArrowLeft size={16} /> Back
          </Link>
        </div>

        {/* Start button */}
        {status === 'idle' && (
          <Card className="border-slate-700 bg-slate-800 p-8 text-center">
            <p className="mb-4 text-slate-300">Click to load the embedding model in your browser. No API key required.</p>
            <button onClick={loadModel} className="rounded-lg bg-blue-600 px-8 py-3 font-medium text-white hover:bg-blue-700">
              Load Model & Start
            </button>
          </Card>
        )}

        {/* Loading */}
        {status === 'loading-model' && (
          <Card className="border-slate-700 bg-slate-800 p-6">
            <p className="mb-3 font-medium text-slate-200">Loading model...</p>
            <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-slate-700">
              <div className="h-2 rounded-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-sm text-slate-400">{progress}% — {progressMsg}</p>
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
            <Card className="mb-6 border-slate-700 bg-slate-800 p-6">
              <label className="mb-2 block text-sm font-medium text-slate-300">Query</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="e.g. What is Prasad's AI experience?"
                  className="flex-1 rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
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

            {results.length > 0 && (
              <>
                <div className="mb-4 grid grid-cols-3 gap-4">
                  <Card className="border-slate-700 bg-slate-800 p-4">
                    <p className="text-xs text-slate-400">Query time</p>
                    <p className="text-2xl font-bold text-blue-400">{queryTime}ms</p>
                  </Card>
                  <Card className="border-slate-700 bg-slate-800 p-4">
                    <p className="text-xs text-slate-400">Docs searched</p>
                    <p className="text-2xl font-bold text-green-400">{KNOWLEDGE_BASE.length}</p>
                  </Card>
                  <Card className="border-slate-700 bg-slate-800 p-4">
                    <p className="text-xs text-slate-400">Top similarity</p>
                    <p className="text-2xl font-bold text-purple-400">{(results[0].similarity * 100).toFixed(1)}%</p>
                  </Card>
                </div>
                <h2 className="mb-3 text-lg font-semibold text-white">Top 3 Retrieved Documents</h2>
                <div className="space-y-3">
                  {results.map((r, i) => (
                    <Card key={r.doc.id} className="border-slate-700 bg-slate-800 p-5">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-medium text-white">{i + 1}. {r.doc.title}</span>
                        <Badge className={r.similarity > 0.7 ? 'bg-green-600' : r.similarity > 0.5 ? 'bg-yellow-600' : 'bg-orange-600'}>
                          {(r.similarity * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-300">{r.doc.content}</p>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {results.length === 0 && status === 'ready' && (
              <Card className="border-slate-700 bg-slate-800 p-12 text-center">
                <p className="text-slate-400">Enter a query above and click Search</p>
              </Card>
            )}
          </>
        )}

        <Card className="mt-8 border-slate-700 bg-slate-800 p-5">
          <p className="mb-2 font-medium text-slate-200">How it works</p>
          <ul className="space-y-1 text-sm text-slate-400">
            <li>• Model runs entirely in your browser via WebAssembly — no server</li>
            <li>• Uses all-MiniLM-L6-v2 (32MB) for semantic embeddings</li>
            <li>• Cosine similarity ranks documents by semantic relevance</li>
            <li>• No API keys or server-side processing required</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}