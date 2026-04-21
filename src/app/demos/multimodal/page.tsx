'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Upload, Loader } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from "@/components/theme-toggle";
import { loadTransformersModule, preloadTransformersOnIdle } from '@/lib/transformers-loader';
import { useExecutionStrategy } from '@/hooks/useExecutionStrategy';
import { AdaptiveExecutionBadge } from '@/components/AdaptiveExecutionBadge';
import { CapabilityNotice } from '@/components/CapabilityNotice';
import { ExecutionModeToast } from '@/components/ExecutionModeToast';

type Status = 'idle' | 'loading-model' | 'ready' | 'processing' | 'degraded';
type TaskType = 'classify' | 'zero-shot';
type BrowserBackend = 'webgpu' | 'webnn' | 'wasm';
type InitErrorCode = 'backend_unavailable' | 'asset_fetch_failed' | 'initialization_failed';

interface ClassificationResult {
  label: string;
  score: number;
}

interface InitFailure {
  code: InitErrorCode;
  title: string;
  message: string;
}

interface BrowserInitError {
  code: InitErrorCode;
  message: string;
  backend?: BrowserBackend;
}

const WASM_PATH_CANDIDATES = [
  'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/',
  'https://unpkg.com/onnxruntime-web/dist/',
] as const;

const CLASSIFY_MODEL_ID = 'Xenova/vit-base-patch16-224';
const CLIP_MODEL_ID = 'Xenova/clip-vit-base-patch32';

function isBrowserInitError(error: unknown): error is BrowserInitError {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    'message' in error
  );
}

function parseInitError(error: unknown, backend?: BrowserBackend): BrowserInitError {
  if (isBrowserInitError(error)) return error;
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (
    lower.includes('failed to fetch') ||
    lower.includes('no available backend') ||
    lower.includes('err: [wasm]') ||
    lower.includes('networkerror')
  ) {
    return {
      code: 'asset_fetch_failed',
      message,
      backend,
    };
  }

  if (
    lower.includes('backend') ||
    lower.includes('webgpu') ||
    lower.includes('webnn') ||
    lower.includes('wasm')
  ) {
    return {
      code: 'backend_unavailable',
      message,
      backend,
    };
  }

  return {
    code: 'initialization_failed',
    message,
    backend,
  };
}

function toInitFailure(error: BrowserInitError): InitFailure {
  if (error.code === 'asset_fetch_failed') {
    return {
      code: error.code,
      title: 'Local Inference Assets Unavailable',
      message: 'This browser session could not fetch model/backend assets for local inference. You can retry initialization or continue in simulated demo mode.',
    };
  }

  if (error.code === 'backend_unavailable') {
    return {
      code: error.code,
      title: 'No Compatible Browser Backend',
      message: 'A compatible local inference backend is not available in this browser/session. You can retry initialization or continue in simulated demo mode.',
    };
  }

  return {
    code: 'initialization_failed',
    title: 'Local Inference Startup Failed',
    message: 'The local model runtime did not initialize successfully. You can retry initialization or continue in simulated demo mode.',
  };
}

function logInit(
  event: string,
  details?: Record<string, unknown>,
) {
  if (process.env.NODE_ENV === 'test') return;
  if (details) {
    console.info('[multimodal:init]', event, details);
    return;
  }
  console.info('[multimodal:init]', event);
}

export default function MultimodalPage() {
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState('');
  const [initFailure, setInitFailure] = useState<InitFailure | null>(null);
  const [demoMode, setDemoMode] = useState<'local' | 'simulated'>('local');
  const [selectedBackend, setSelectedBackend] = useState<BrowserBackend | null>(null);

  const [imageData, setImageData] = useState<string | null>(null);
  const [result, setResult] = useState<ClassificationResult[] | null>(null);
  const [processingTime, setProcessingTime] = useState(0);
  const [activeTask, setActiveTask] = useState<TaskType>('classify');
  const [zeroShotLabels, setZeroShotLabels] = useState('cat, dog, car, person, building');

  const exec = useExecutionStrategy({
    demoId: 'multimodal',
    executionProfile: 'heavy-local',
    hasCloudFallback: false,
    requiresWebGPU: true,
  });

  const classifyPipelineRef = useRef<any>(null);
  const clipPipelineRef = useRef<any>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const dragOverRef = useRef(false);
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

  const resetPipelines = () => {
    classifyPipelineRef.current = null;
    clipPipelineRef.current = null;
    setSelectedBackend(null);
  };

  const getBackendCandidates = (): BrowserBackend[] => {
    const nav = (globalThis as any).navigator;
    const candidates: BrowserBackend[] = [];
    if (nav?.gpu) candidates.push('webgpu');
    if (nav?.ml) candidates.push('webnn');
    candidates.push('wasm');
    return [...new Set(candidates)];
  };

  const resolveWasmPath = async (): Promise<string | null> => {
    for (const base of WASM_PATH_CANDIDATES) {
      const probeUrl = `${base}ort-wasm-simd-threaded.wasm`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      try {
        const response = await fetch(probeUrl, {
          method: 'HEAD',
          signal: controller.signal,
        });
        if (response.ok) {
          return base;
        }
      } catch {
        // Try next candidate
      } finally {
        clearTimeout(timeoutId);
      }
    }
    return null;
  };

  const initWithBackend = async (
    pipeline: (...args: any[]) => Promise<any>,
    backend: BrowserBackend,
    attemptId: number,
  ) => {
    const device = backend;
    setProgressMsg(`Loading classifier (1/2) via ${backend}...`);
    setProgress(10);

    const classifyPipe = await pipeline(
      'image-classification',
      CLASSIFY_MODEL_ID,
      {
        device,
        progress_callback: (p: any) => {
          if (!isMountedRef.current || initAttemptRef.current !== attemptId) return;
          if (p.progress) {
            const pct = Math.round(10 + p.progress * 30);
            setProgress(pct);
          }
        },
      },
    );

    if (!isMountedRef.current || initAttemptRef.current !== attemptId) return;
    setProgress(40);
    setProgressMsg(`Loading CLIP (2/2) via ${backend}...`);

    const clipPipe = await pipeline(
      'zero-shot-image-classification',
      CLIP_MODEL_ID,
      {
        device,
        progress_callback: (p: any) => {
          if (!isMountedRef.current || initAttemptRef.current !== attemptId) return;
          if (p.progress) {
            const pct = Math.round(40 + p.progress * 60);
            setProgress(pct);
          }
        },
      },
    );

    if (!isMountedRef.current || initAttemptRef.current !== attemptId) return;
    classifyPipelineRef.current = classifyPipe;
    clipPipelineRef.current = clipPipe;
    setSelectedBackend(backend);
  };

  const loadModels = async () => {
    if (isInitInFlightRef.current) return;
    const attemptId = initAttemptRef.current + 1;
    initAttemptRef.current = attemptId;

    resetPipelines();
    setError('');
    setInitFailure(null);
    setResult(null);

    if (!exec.canAttemptLocal) {
      console.warn('[multimodal] simulation mode activated', { reason: 'canAttemptLocal=false', crossOriginIsolated: globalThis.crossOriginIsolated });
      setDemoMode('simulated');
      setStatus('ready');
      return;
    }

    isInitInFlightRef.current = true;
    setDemoMode('local');
    setStatus('loading-model');
    setProgress(0);

    logInit('init_start', {
      canAttemptLocal: exec.canAttemptLocal,
      crossOriginIsolated: globalThis.crossOriginIsolated === true,
    });

    try {
      setProgressMsg('Importing Transformers.js...');
      setProgress(5);

      const { pipeline, env } = await loadTransformersModule();
      env.allowLocalModels = false;
      env.allowRemoteModels = true;

      const preferredWasmPath = await resolveWasmPath();
      activeWasmPathRef.current = preferredWasmPath;
      if (env.backends?.onnx?.wasm && preferredWasmPath) {
        env.backends.onnx.wasm.wasmPaths = preferredWasmPath;
      }

      logInit('asset_resolution', {
        wasmPath: preferredWasmPath ?? 'default',
      });

      const backends = getBackendCandidates();
      logInit('backend_candidates', { backends });

      let lastError: BrowserInitError | null = null;
      for (const backend of backends) {
        if (!isMountedRef.current || initAttemptRef.current !== attemptId) return;
        try {
          logInit('backend_init_start', { backend });
          await initWithBackend(pipeline, backend, attemptId);
          if (!isMountedRef.current || initAttemptRef.current !== attemptId) return;
          setProgress(100);
          setProgressMsg('Ready!');
          setStatus('ready');
          logInit('backend_init_success', { backend });
          return;
        } catch (error) {
          resetPipelines();
          lastError = parseInitError(error, backend);
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
    } catch (error) {
      if (!isMountedRef.current || initAttemptRef.current !== attemptId) return;
      const parsed = parseInitError(error);
      const failure = toInitFailure(parsed);
      setInitFailure(failure);
      setError(parsed.message);
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

  const switchToSimulatedMode = () => {
    console.warn('[multimodal] simulation mode activated', { reason: 'manual switch', crossOriginIsolated: globalThis.crossOriginIsolated });
    initAttemptRef.current += 1;
    isInitInFlightRef.current = false;
    resetPipelines();
    setInitFailure(null);
    setError('');
    setDemoMode('simulated');
    setStatus('ready');
    logInit('switch_to_simulated', {
      previousBackend: selectedBackend,
      wasmPath: activeWasmPathRef.current,
    });
  };

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    setError('');
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageData(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleURLInput = async (url: string) => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }
    try {
      setResult(null);
      setError('');
      // Fetch image as blob and create object URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to load image from URL');
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setImageData(objectUrl);
    } catch {
      setError('Could not load URL — try uploading the image directly instead');
      setImageData(null);
    }
  };

  const runClassify = async () => {
    if (!imageData) return;

    // --- SIMULATED PATH (mobile / no-webgpu / low-memory) ---
    if (!exec.canAttemptLocal || demoMode === 'simulated') {
      setStatus('processing');
      setResult(null);
      await new Promise(r => setTimeout(r, 900));
      if (!isMountedRef.current) return;
      setProcessingTime(312);
      setResult([
        { label: 'person', score: 0.94 },
        { label: 'business attire', score: 0.88 },
        { label: 'indoor', score: 0.81 },
        { label: 'portrait', score: 0.76 },
        { label: 'professional', score: 0.71 },
      ]);
      setStatus('ready');
      return;
    }
    // --- END SIMULATED PATH ---

    if (!classifyPipelineRef.current) {
      setError('Local inference is not initialized yet. Retry initialization or use simulated mode.');
      return;
    }

    setStatus('processing');
    setResult(null);
    setError('');
    const t0 = performance.now();

    try {
      const results = await classifyPipelineRef.current(imageData, {
        topk: 5,
      });
      if (!isMountedRef.current) return;

      setProcessingTime(Math.round(performance.now() - t0));
      setResult(results);
      setStatus('ready');
    } catch (e: any) {
      console.error('Classification error:', e);
      setError(e?.message || 'Classification failed');
      setStatus('ready');
    }
  };

  const runZeroShot = async () => {
    if (!imageData) return;

    const labels = zeroShotLabels
      .split(',')
      .map((label) => label.trim())
      .filter((label) => label.length > 0);

    if (labels.length === 0) {
      setError('Please enter at least one label');
      return;
    }

    // --- SIMULATED PATH (mobile / no-webgpu / low-memory) ---
    if (!exec.canAttemptLocal || demoMode === 'simulated') {
      setStatus('processing');
      setResult(null);
      await new Promise(r => setTimeout(r, 700));
      if (!isMountedRef.current) return;
      setProcessingTime(284);
      setResult(labels.map((label, i) => ({ label, score: Math.max(0.05, 0.91 - i * 0.12) })));
      setStatus('ready');
      return;
    }
    // --- END SIMULATED PATH ---

    if (!clipPipelineRef.current) {
      setError('Local inference is not initialized yet. Retry initialization or use simulated mode.');
      return;
    }

    setStatus('processing');
    setResult(null);
    setError('');
    const t0 = performance.now();

    try {
      const results = await clipPipelineRef.current(imageData, labels);
      if (!isMountedRef.current) return;

      setProcessingTime(Math.round(performance.now() - t0));
      setResult(results);
      setStatus('ready');
    } catch (e: any) {
      console.error('Zero-shot error:', e);
      setError(e?.message || 'Zero-shot classification failed');
      setStatus('ready');
    }
  };

  return (
    <div className="min-h-[100svh] bg-background p-6 text-foreground max-w-full overflow-x-hidden">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Multimodal AI Assistant</h1>
            <p className="mt-1 text-muted-foreground">Run vision models in your browser</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge className="bg-green-500/15 text-green-700 border border-green-500/30">In-browser inference</Badge>
              <Badge className="bg-blue-500/15 text-blue-700 border border-blue-500/30">Image analysis stays local after load</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-muted-foreground hover:bg-muted"
            >
              <ArrowLeft size={16} /> Back
            </Link>
          </div>
        </div>

        <AdaptiveExecutionBadge strategy={exec.strategy} className="mb-3" />
        <CapabilityNotice
          state={exec}
          demoName="Multimodal Assistant"
          fallbackMessage="Showing simulated walkthrough — WebGPU required for live inference."
        />
        <ExecutionModeToast
          show={exec.fallbackTriggered && exec.isRecovering}
          message="Switched to simulated mode."
          onDismiss={exec.resetFallback}
        />

        {/* Idle State */}
        {status === 'idle' && (
          <Card className="border-border bg-card p-8 text-center">
            <p className="mb-4 text-muted-foreground">
              Load vision models to classify images in your browser. No API key required.
            </p>
            <p className="mb-6 text-sm text-muted-foreground">
              Note: Models will download on first use
            </p>
            <button
              onClick={loadModels}
              className="min-h-[44px] rounded-lg bg-blue-600 px-8 py-3 font-medium text-white hover:bg-blue-700"
            >
              {exec.canAttemptLocal ? 'Load Models & Start' : 'Try Simulated Demo'}
            </button>
          </Card>
        )}

        {/* Loading State */}
        {status === 'loading-model' && (
          <Card className="border-border bg-card p-6">
            <p className="mb-3 font-medium text-foreground">Loading models...</p>
            <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {progress}% — {progressMsg}
            </p>
          </Card>
        )}

        {/* Degraded Recovery State */}
        {status === 'degraded' && initFailure && (
          <Card className="border-border bg-card p-6">
            <p className="mb-2 font-medium text-foreground">{initFailure.title}</p>
            <p className="mb-4 text-sm text-muted-foreground">{initFailure.message}</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={loadModels}
                className="min-h-[44px] rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Retry Initialization
              </button>
              <button
                onClick={switchToSimulatedMode}
                className="min-h-[44px] rounded-lg border border-border bg-muted px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
              >
                Switch to Simulated Demo
              </button>
            </div>
          </Card>
        )}

        {/* Main UI */}
        {(status === 'ready' || status === 'processing') && (
          <>
            {demoMode === 'simulated' && (
              <Card className="mb-4 border-border bg-card p-4">
                <p className="text-sm text-muted-foreground">
                  Simulated demo mode is active because local inference is unavailable in this session.
                </p>
                {exec.canAttemptLocal && (
                  <button
                    onClick={loadModels}
                    className="mt-3 min-h-[44px] rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Retry Initialization
                  </button>
                )}
              </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
            {/* Left: Image Upload & Preview */}
            <div className="space-y-4">
              {/* Upload Area */}
              <Card
                className={`border-2 border-dashed border-border bg-card p-8 text-center transition ${
                  dragOverRef.current ? 'border-blue-500 bg-blue-900/20' : ''
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  dragOverRef.current = true;
                }}
                onDragLeave={() => {
                  dragOverRef.current = false;
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  dragOverRef.current = false;
                  const file = e.dataTransfer.files[0];
                  if (file) handleImageUpload(file);
                }}
              >
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  className="hidden"
                />
                <Upload size={32} className="mx-auto mb-2 text-muted-foreground" />
                <p className="mb-2 text-muted-foreground">Drag & drop an image or click to browse</p>
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="rounded bg-muted px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
                >
                  Browse Files
                </button>
              </Card>

              {/* URL Input */}
              <Card className="border-border bg-card p-4">
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  Or load from URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleURLInput(e.currentTarget.value);
                      }
                    }}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={(e) => {
                      const url = (e.currentTarget.previousElementSibling as HTMLInputElement)
                        .value;
                      handleURLInput(url);
                    }}
                    className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                  >
                    Load
                  </button>
                </div>
              </Card>

              {/* Image Preview */}
              {imageData && (
                <Card className="border-border bg-card overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageData} alt="Preview" className="w-full" />
                </Card>
              )}

              {!imageData && (
                <Card className="border-border bg-card p-8 text-center">
                  <p className="text-muted-foreground">No image loaded</p>
                </Card>
              )}
            </div>

            {/* Right: Tasks & Results */}
            <div className="space-y-4">
              {/* Task Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setActiveTask('classify');
                    setResult(null);
                  }}
                  className={`flex-1 rounded-lg px-4 py-2 font-medium transition ${
                    activeTask === 'classify'
                      ? 'bg-blue-600 text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted'
                  }`}
                  disabled={status === 'processing'}
                >
                  Classify
                </button>
                <button
                  onClick={() => {
                    setActiveTask('zero-shot');
                    setResult(null);
                  }}
                  className={`flex-1 rounded-lg px-4 py-2 font-medium transition ${
                    activeTask === 'zero-shot'
                      ? 'bg-blue-600 text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted'
                  }`}
                  disabled={status === 'processing'}
                >
                  Zero-Shot
                </button>
              </div>

              {/* Classify Tab Content */}
              {activeTask === 'classify' && (
                <div className="space-y-3">
                  <button
                    onClick={runClassify}
                    disabled={!imageData || status === 'processing'}
                    className={`w-full rounded-lg px-4 py-3 font-medium transition ${
                      imageData && status !== 'processing'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {status === 'processing' ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader size={16} className="animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      'Classify Image'
                    )}
                  </button>
                </div>
              )}

              {/* Zero-Shot Tab Content */}
              {activeTask === 'zero-shot' && (
                <div className="space-y-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Labels (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={zeroShotLabels}
                      onChange={(e) => setZeroShotLabels(e.currentTarget.value)}
                      placeholder="e.g. cat, dog, car, person"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={runZeroShot}
                    disabled={!imageData || status === 'processing'}
                    className={`w-full rounded-lg px-4 py-3 font-medium transition ${
                      imageData && status !== 'processing'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {status === 'processing' ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader size={16} className="animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      'Classify Image'
                    )}
                  </button>
                </div>
              )}

              {/* Results - Bar Chart */}
              {result && result.length > 0 && (
                <Card className="border-border bg-card p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">Results</p>
                    <span className="text-xs text-muted-foreground">{processingTime}ms</span>
                  </div>
                  <div className="space-y-3">
                    {result.map((item, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">{item.label}</p>
                          <p className="text-sm font-medium text-foreground">
                            {(item.score * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${item.score * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Error message in results area */}
              {!result && error && (
                <Card className="border-red-800 bg-red-900/20 p-4">
                  <p className="text-sm text-red-300">{error}</p>
                </Card>
              )}

              {/* Prompt when no result */}
              {!result && !error && imageData && (
                <Card className="border-border bg-card p-8 text-center">
                  <p className="text-muted-foreground">
                    {activeTask === 'classify'
                      ? 'Click "Classify Image" to analyze'
                      : 'Enter labels and click "Classify Image" to analyze'}
                  </p>
                </Card>
              )}
            </div>
            </div>
          </>
        )}

        {/* Info Footer */}
        {(status === 'ready' || status === 'processing') && (
          <Card className="mt-8 border-border bg-card p-5">
            <p className="mb-2 font-medium text-foreground">How it works</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>
                • <strong>Classify:</strong> Predicts top 5 image classes using Vision
                Transformer (ViT)
              </li>
              <li>
                • <strong>Zero-Shot:</strong> Classify images using custom labels you define,
                powered by CLIP
              </li>
              <li>• Upload images via drag-and-drop or URL</li>
              <li>• All processing happens entirely in your browser</li>
              <li>• No API keys or server-side processing required</li>
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
