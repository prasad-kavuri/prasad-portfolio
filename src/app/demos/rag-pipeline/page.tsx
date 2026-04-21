'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { loadTransformersModule, preloadTransformersOnIdle } from '@/lib/transformers-loader';
import { useExecutionStrategy, INFERENCE_TIMEOUT_MS } from '@/hooks/useExecutionStrategy';
import { AdaptiveExecutionBadge } from '@/components/AdaptiveExecutionBadge';
import { CapabilityNotice } from '@/components/CapabilityNotice';
import { ExecutionModeToast } from '@/components/ExecutionModeToast';
import { withStabilityMonitor } from '@/lib/stability-monitor';

const KNOWLEDGE_BASE = [
  { id: 1, title: 'Kruti.ai — Agentic AI Platform', content: 'Led end-to-end architecture and delivery of India\'s first Agentic AI platform at Krutrim across multi-model orchestration, RAG pipelines, vector search, and real-time personalization. Drove 50% latency reduction and 40% cost savings through intelligent model routing.' },
  { id: 2, title: 'Krutrim — Platform Scale and Adoption', content: 'Built and scaled a 200+ global engineering organization delivering enterprise-grade 24/7 PaaS capabilities. Defined SDK/API integration strategy and launched domain-specific AI agents to expand the Kruti.ai ecosystem across partners.' },
  { id: 3, title: 'Ola Maps — Platform Transformation', content: 'Led platform transformation for Ola Maps by scaling cloud-native infrastructure, LLM-powered routing, and B2B APIs into a core mobility layer serving 13,000+ enterprise customers.' },
  { id: 4, title: 'Ola — Reliability, Cost, and Fleet AI', content: 'Delivered a 70% infrastructure cost reduction through a cloud-native overhaul while maintaining reliability across millions of daily API calls, and introduced AI-powered real-time route optimization for fleet management.' },
  { id: 5, title: 'HERE Technologies — Autonomous Driving', content: 'Led 85+ engineers across North America, Europe, and APAC at HERE Technologies. Delivered autonomous driving datasets for major OEMs while driving 50% cost reduction through cloud migration strategies.' },
  { id: 6, title: 'HERE Technologies — 18 Year Engineering Journey', content: 'Director of Engineering at HERE Technologies from 2005 to 2023. Progressed from Senior Engineer to Director managing global teams. Delivered mapping and geospatial solutions for automotive industry.' },
  { id: 7, title: 'Vector Search & Embeddings', content: 'Deep expertise in vector search, semantic embeddings, FAISS, ChromaDB, and retrieval-augmented generation. Built production RAG pipelines with transformer-based embedding models and hybrid search.' },
  { id: 8, title: 'Multi-Agent AI Systems', content: 'Architected multi-agent AI systems using CrewAI and LangGraph. Built specialized agents with tool use, memory, and inter-agent communication for complex enterprise workflows.' },
  { id: 9, title: 'Cloud & Infrastructure Leadership', content: 'Led cloud-native transformation across AWS, Azure, and GCP. Implemented Kubernetes microservices, CI/CD pipelines, and infrastructure-as-code resulting in 50-70% cost reductions.' },
  { id: 10, title: 'Executive Leadership & Team Building', content: 'Managed global teams of 200+ engineers across US, Europe, and India. P&L management, executive stakeholder management, strategic vendor partnerships, and cross-functional collaboration at scale.' },
];

type RetrievedDoc = { doc: typeof KNOWLEDGE_BASE[0]; similarity: number };
type Status = 'idle' | 'loading-model' | 'ready' | 'searching' | 'degraded';
type DemoMode = 'local' | 'sample';
type BrowserBackend = 'webgpu' | 'webnn' | 'wasm';
type InitErrorCode = 'backend_unavailable' | 'asset_fetch_failed' | 'initialization_failed';

interface BrowserInitError {
  code: InitErrorCode;
  message: string;
  backend?: BrowserBackend;
}

interface InitFailure {
  code: InitErrorCode;
  title: string;
  message: string;
}

const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';
const WASM_PATH_CANDIDATES = [
  'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/',
  'https://unpkg.com/onnxruntime-web/dist/',
] as const;

function logInit(event: string, details?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'test') return;
  if (details) {
    console.info('[rag-pipeline:init]', event, details);
    return;
  }
  console.info('[rag-pipeline:init]', event);
}

function isBrowserInitError(error: unknown): error is BrowserInitError {
  return Boolean(error && typeof error === 'object' && 'code' in error && 'message' in error);
}

function parseInitError(error: unknown, backend?: BrowserBackend): BrowserInitError {
  if (isBrowserInitError(error)) return error;
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (
    lower.includes('failed to fetch') ||
    lower.includes('no available backend') ||
    lower.includes('err: [webgpu]') ||
    lower.includes('err: [wasm]') ||
    lower.includes('networkerror')
  ) {
    return { code: 'asset_fetch_failed', message, backend };
  }

  if (
    lower.includes('backend') ||
    lower.includes('webgpu') ||
    lower.includes('webnn') ||
    lower.includes('wasm')
  ) {
    return { code: 'backend_unavailable', message, backend };
  }

  return { code: 'initialization_failed', message, backend };
}

function toInitFailure(error: BrowserInitError): InitFailure {
  if (error.code === 'asset_fetch_failed') {
    return {
      code: error.code,
      title: 'Local Retrieval Model Unavailable',
      message: 'Local retrieval embeddings could not be downloaded in this browser session. Retry initialization or continue with fallback demo mode.',
    };
  }

  if (error.code === 'backend_unavailable') {
    return {
      code: error.code,
      title: 'Local Retrieval Model Unavailable',
      message: 'A compatible browser backend was not available for local retrieval embeddings. Retry initialization or continue with fallback demo mode.',
    };
  }

  return {
    code: 'initialization_failed',
    title: 'Local Retrieval Model Unavailable',
    message: 'Local retrieval embeddings failed to initialize in this browser session. Retry initialization or continue with fallback demo mode.',
  };
}

function createSampleVector(text: string): number[] {
  const lower = text.toLowerCase();
  const keywords = [
    'ai', 'agent', 'platform', 'leadership', 'cloud', 'search', 'vector',
    'autonomous', 'maps', 'infrastructure', 'cost', 'optimization', 'model', 'team', 'rag',
  ];

  const vec = keywords.map((keyword) => {
    const matches = lower.split(keyword).length - 1;
    return Math.min(3, matches);
  });

  vec.push(Math.min(8, lower.length / 80));
  return vec;
}

export default function RAGPipelinePage() {
  const exec = useExecutionStrategy({
    demoId: 'rag-pipeline',
    executionProfile: 'heavy-local',
    hasCloudFallback: true,
  });
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RetrievedDoc[]>([]);
  const [queryTime, setQueryTime] = useState(0);
  const [demoMode, setDemoMode] = useState<DemoMode>('local');
  const [initFailure, setInitFailure] = useState<InitFailure | null>(null);
  const [selectedBackend, setSelectedBackend] = useState<BrowserBackend | null>(null);

  const pipelineRef = useRef<any>(null);
  const embeddingsRef = useRef<Map<number, number[]>>(new Map());
  const isMountedRef = useRef(false);
  const initAttemptRef = useRef(0);
  const isInitInFlightRef = useRef(false);
  const activeWasmPathRef = useRef<string | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      initAttemptRef.current += 1;
      isInitInFlightRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!exec.canAttemptLocal) return;
    const cancelPreload = preloadTransformersOnIdle();
    return () => cancelPreload();
  }, [exec.canAttemptLocal]);

  const cosineSimilarity = (a: number[], b: number[]) => {
    let dot = 0;
    let magA = 0;
    let magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  };

  const resetPipeline = () => {
    pipelineRef.current = null;
    embeddingsRef.current = new Map();
    setSelectedBackend(null);
  };

  const getBackendCandidates = (): BrowserBackend[] => {
    const nav = (globalThis as any).navigator;
    const candidates: BrowserBackend[] = [];

    if (nav?.gpu && globalThis.isSecureContext !== false) {
      candidates.push('webgpu');
    }

    if (nav?.ml) {
      candidates.push('webnn');
    }

    candidates.push('wasm');
    return [...new Set(candidates)];
  };

  const resolveWasmPath = async (): Promise<string | null> => {
    for (const base of WASM_PATH_CANDIDATES) {
      const probeUrl = `${base}ort-wasm-simd-threaded.wasm`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      try {
        const response = await fetch(probeUrl, { method: 'HEAD', signal: controller.signal });
        if (response.ok) return base;
      } catch {
        // Try next candidate.
      } finally {
        clearTimeout(timeoutId);
      }
    }

    return null;
  };

  const initializeSampleEmbeddings = () => {
    const sampleMap = new Map<number, number[]>();
    for (const doc of KNOWLEDGE_BASE) {
      sampleMap.set(doc.id, createSampleVector(`${doc.title} ${doc.content}`));
    }
    embeddingsRef.current = sampleMap;
  };

  const activateSampleMode = (reason: string | null) => {
    console.warn('[rag-pipeline] simulation mode activated', { reason, crossOriginIsolated: globalThis.crossOriginIsolated });
    initAttemptRef.current += 1;
    isInitInFlightRef.current = false;
    resetPipeline();
    setDemoMode('sample');
    setError('');
    setResults([]);
    setProgress(0);
    setProgressMsg('');

    if (reason) {
      setInitFailure({
        code: 'initialization_failed',
        title: 'Local Retrieval Model Unavailable',
        message: reason,
      });
    }

    initializeSampleEmbeddings();
    setStatus('ready');
    logInit('fallback_activated', {
      reason: reason ?? 'manual_fallback_mode',
      previousBackend: selectedBackend,
      wasmPath: activeWasmPathRef.current,
    });
  };

  const initializeWithBackend = async (
    pipeline: (...args: any[]) => Promise<any>,
    backend: BrowserBackend,
    attemptId: number,
  ) => {
    setProgressMsg(`Downloading ${MODEL_ID} via ${backend}...`);
    setProgress(10);

    const extractor = await pipeline(
      'feature-extraction',
      MODEL_ID,
      {
        device: backend,
        progress_callback: (p: any) => {
          if (!isMountedRef.current || initAttemptRef.current !== attemptId) return;
          if (p.progress) {
            const pct = Math.round(10 + p.progress * 70);
            setProgress(pct);
            setProgressMsg(`Downloading model: ${Math.round(p.progress * 100)}%`);
          }
        },
      },
    );

    if (!isMountedRef.current || initAttemptRef.current !== attemptId) return;
    pipelineRef.current = extractor;
    setSelectedBackend(backend);

    setProgress(82);
    setProgressMsg('Pre-computing knowledge base embeddings...');

    const nextEmbeddings = new Map<number, number[]>();
    for (let i = 0; i < KNOWLEDGE_BASE.length; i++) {
      if (!isMountedRef.current || initAttemptRef.current !== attemptId) return;
      const doc = KNOWLEDGE_BASE[i];
      const out = await extractor(doc.content, { pooling: 'mean', normalize: true });
      nextEmbeddings.set(doc.id, Array.from(out.data as Float32Array));
      setProgress(82 + Math.round(((i + 1) / KNOWLEDGE_BASE.length) * 16));
      setProgressMsg(`Embedding document ${i + 1} of ${KNOWLEDGE_BASE.length}...`);
    }

    if (!isMountedRef.current || initAttemptRef.current !== attemptId) return;
    embeddingsRef.current = nextEmbeddings;
  };

  // Root-cause note: production hard-fail happened because WebGPU/WASM/model fetch failures
  // bubbled into a terminal error state. We now try backends safely and degrade to fallback mode.
  const startInitialization = async () => {
    if (isInitInFlightRef.current) return;

    const attemptId = initAttemptRef.current + 1;
    initAttemptRef.current = attemptId;

    resetPipeline();
    setError('');
    setResults([]);
    setInitFailure(null);

    if (!exec.canAttemptLocal) {
      activateSampleMode('Local retrieval inference is unavailable on this device. Using fallback demo mode.');
      return;
    }

    isInitInFlightRef.current = true;
    setDemoMode('local');
    setStatus('loading-model');
    setProgress(0);
    setProgressMsg('Importing Transformers.js...');

    logInit('init_start', {
      canAttemptLocal: exec.canAttemptLocal,
      crossOriginIsolated: globalThis.crossOriginIsolated === true,
      secureContext: globalThis.isSecureContext === true,
    });

    try {
      const { pipeline, env } = await loadTransformersModule();
      env.allowLocalModels = false;
      env.allowRemoteModels = true;

      const wasmPath = await resolveWasmPath();
      activeWasmPathRef.current = wasmPath;
      if (env.backends?.onnx?.wasm && wasmPath) {
        env.backends.onnx.wasm.wasmPaths = wasmPath;
      }

      logInit('asset_resolution', {
        modelId: MODEL_ID,
        wasmPath: wasmPath ?? 'default',
      });

      const backends = getBackendCandidates();
      logInit('backend_candidates', { backends });

      let lastError: BrowserInitError | null = null;
      for (const backend of backends) {
        if (!isMountedRef.current || initAttemptRef.current !== attemptId) return;
        try {
          logInit('backend_init_start', { backend });
          await initializeWithBackend(pipeline, backend, attemptId);
          if (!isMountedRef.current || initAttemptRef.current !== attemptId) return;

          setProgress(100);
          setProgressMsg('Ready!');
          setStatus('ready');
          logInit('backend_init_success', { backend });
          return;
        } catch (err) {
          resetPipeline();
          lastError = parseInitError(err, backend);
          logInit('backend_init_failed', {
            backend,
            code: lastError.code,
            message: lastError.message,
          });
        }
      }

      throw (
        lastError ?? {
          code: 'backend_unavailable',
          message: 'No browser backend could be initialized.',
        }
      );
    } catch (err) {
      if (!isMountedRef.current || initAttemptRef.current !== attemptId) return;
      const parsed = parseInitError(err);
      setError(parsed.message);
      setInitFailure(toInitFailure(parsed));
      setStatus('degraded');
      logInit('fallback_activated', {
        code: parsed.code,
        message: parsed.message,
      });
    } finally {
      if (initAttemptRef.current === attemptId) {
        isInitInFlightRef.current = false;
      }
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    if (!exec.canAttemptLocal || demoMode === 'sample') {
      setStatus('searching');
      await new Promise((r) => setTimeout(r, 450));
      if (!isMountedRef.current) return;

      if (embeddingsRef.current.size === 0) {
        initializeSampleEmbeddings();
      }

      const qVec = createSampleVector(query);
      const scored = KNOWLEDGE_BASE.map((doc) => ({
        doc,
        similarity: cosineSimilarity(qVec, embeddingsRef.current.get(doc.id) ?? createSampleVector(doc.content)),
      }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3);

      setResults(scored);
      setQueryTime(43);
      setStatus('ready');
      return;
    }

    if (!pipelineRef.current || embeddingsRef.current.size === 0) {
      setError('Local retrieval model is not initialized. Retry initialization or use fallback demo mode.');
      return;
    }

    setStatus('searching');
    const t0 = performance.now();
    setError('');

    try {
      const out = await pipelineRef.current(query, { pooling: 'mean', normalize: true });
      const qVec = Array.from(out.data as Float32Array);
      const scored = KNOWLEDGE_BASE.map((doc) => ({
        doc,
        similarity: cosineSimilarity(qVec, embeddingsRef.current.get(doc.id) ?? qVec),
      }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3);

      setResults(scored);
      setQueryTime(Math.round(performance.now() - t0));
    } catch {
      setError('Search failed in this browser session. Retry initialization or use fallback demo mode.');
    } finally {
      setStatus('ready');
    }
  };

  const handleStartClick = () => {
    void withStabilityMonitor(startInitialization, {
      timeoutMs: INFERENCE_TIMEOUT_MS,
      onFallback: exec.triggerFallback,
    });
  };

  return (
    <div className="min-h-[100svh] bg-background p-6 text-foreground">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">RAG Pipeline Demo</h1>
            <p className="mt-1 text-muted-foreground">Retrieval-Augmented Generation with local embeddings</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge className="bg-green-500/15 text-green-700 border border-green-500/30">Runs in Browser</Badge>
              <Badge className="bg-blue-500/15 text-blue-700 border border-blue-500/30">Privacy-preserving local retrieval</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/" className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-foreground hover:bg-muted/80">
              <ArrowLeft size={16} /> Back
            </Link>
          </div>
        </div>

        <AdaptiveExecutionBadge strategy={exec.strategy} className="mb-3" />
        <CapabilityNotice
          state={exec}
          demoName="RAG Pipeline"
          fallbackMessage="Routing to cloud AI for a reliable experience on your device."
        />
        <ExecutionModeToast
          show={exec.fallbackTriggered && exec.isRecovering}
          message={exec.strategy?.mode === 'cloud'
            ? 'Switched to cloud inference for stability on this device.'
            : 'Switched to simulated mode.'}
          onDismiss={exec.resetFallback}
        />

        {status === 'idle' && (
          <Card className="border-border bg-card p-8 text-center">
            <p className="mb-4 text-muted-foreground">Click to load the embedding model in your browser. No API key required.</p>
            <button
              onClick={handleStartClick}
              className="min-h-[44px] rounded-lg bg-blue-600 px-8 py-3 font-medium text-white hover:bg-blue-700"
            >
              {exec.canAttemptLocal ? 'Load Model & Start' : 'Try Simulated Demo'}
            </button>
          </Card>
        )}

        {status === 'loading-model' && (
          <Card className="border-border bg-card p-6">
            <p className="mb-3 font-medium text-foreground">Loading model...</p>
            <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-2 rounded-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-sm text-muted-foreground">{progress}% — {progressMsg}</p>
          </Card>
        )}

        {status === 'degraded' && initFailure && (
          <Card className="border-border bg-card p-6">
            <p className="mb-2 font-medium text-foreground">{initFailure.title}</p>
            <p className="mb-4 text-sm text-muted-foreground">{initFailure.message}</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleStartClick}
                className="min-h-[44px] rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Retry Initialization
              </button>
              <button
                onClick={() => activateSampleMode('Fallback retrieval demo mode is active for this session.')}
                className="min-h-[44px] rounded-lg border border-border bg-muted px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
              >
                Use Fallback Demo Mode
              </button>
            </div>
          </Card>
        )}

        {(status === 'ready' || status === 'searching') && (
          <>
            {demoMode === 'sample' && (
              <Card className="mb-4 border-border bg-card p-4">
                <p className="text-sm text-muted-foreground">
                  Fallback demo mode is active. Retrieval uses deterministic precomputed embeddings in this browser session.
                </p>
                {exec.canAttemptLocal && (
                  <button
                    onClick={handleStartClick}
                    className="mt-3 min-h-[44px] rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Retry Initialization
                  </button>
                )}
              </Card>
            )}

            {error && (
              <Card className="mb-4 border-border bg-card p-4">
                <p className="text-sm text-muted-foreground">{error}</p>
              </Card>
            )}

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
                <h2 className="mb-3 text-lg font-semibold text-foreground">Top 3 Retrieved Documents</h2>
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
                <p className="text-muted-foreground">Enter a query above and click Search</p>
              </Card>
            )}
          </>
        )}

        <Card className="mt-8 border-border bg-card p-5">
          <p className="mb-2 font-medium text-foreground">How it works</p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Prefers WebGPU when available, then falls back to other browser backends</li>
            <li>• Uses all-MiniLM-L6-v2 (32MB) for semantic embeddings</li>
            <li>• Cosine similarity ranks documents by semantic relevance</li>
            <li>• No API keys or server-side processing required</li>
          </ul>
        </Card>

        <Card className="mt-4 border-border bg-card p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Why this matters</p>
          <p className="text-sm text-muted-foreground">
            Enterprise teams use RAG to ground responses in approved knowledge sources. This demo shows retrieval quality, fallback behavior, and operational reliability as platform concerns, not just model output quality.
          </p>
        </Card>
      </div>
    </div>
  );
}
