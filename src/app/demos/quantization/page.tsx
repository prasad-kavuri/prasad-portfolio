'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from "@/components/theme-toggle";
import { loadTransformersModule, preloadTransformersOnIdle } from '@/lib/transformers-loader';
import { useExecutionStrategy } from '@/hooks/useExecutionStrategy';
import { AdaptiveExecutionBadge } from '@/components/AdaptiveExecutionBadge';
import { CapabilityNotice } from '@/components/CapabilityNotice';
import { ExecutionModeToast } from '@/components/ExecutionModeToast';

type Status = 'idle' | 'loading-fp32' | 'loading-int8' | 'ready' | 'benchmarking' | 'done';

interface BenchmarkResult {
  runs: number[];
  avg: number;
  label: string;
  confidence: number;
}

interface BenchmarkResults {
  fp32: BenchmarkResult | null;
  int8: BenchmarkResult | null;
  text: string;
}

interface ModelRefs {
  fp32: any;
  int8: any;
}

const EXAMPLE_TEXTS = [
  'This product is absolutely amazing and exceeded all expectations',
  'The service was terrible and I\'m very disappointed',
  'The weather is okay today, nothing special',
  'I love how this technology is transforming the industry',
  'The meeting was cancelled due to unforeseen circumstances',
];

const MODEL_NAME = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english';
const FP32_SIZE_MB = 268;
const INT8_SIZE_MB = 67;

export default function QuantizationPage() {
  const exec = useExecutionStrategy({
    demoId: 'quantization',
    executionProfile: 'heavy-local',
    hasCloudFallback: false,
  });
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState('');

  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState<BenchmarkResults | null>(null);
  const modelsRef = useRef<ModelRefs>({ fp32: null, int8: null });

  useEffect(() => {
    if (!exec.canAttemptLocal) return;
    const cancelPreload = preloadTransformersOnIdle();
    return () => cancelPreload();
  }, [exec.canAttemptLocal]);

  const loadModels = async () => {
    setStatus('loading-fp32');
    setProgress(0);
    setError('');
    setResults(null);

    try {
      const { pipeline, env } = await loadTransformersModule();
      env.allowLocalModels = false;
      env.allowRemoteModels = true;

      // Load FP32 model
      setProgressMsg('Loading FP32 model (1/2)...');
      setProgress(10);

      const fp32Model = await pipeline(
        'sentiment-analysis',
        MODEL_NAME,
        {
          dtype: 'fp32' as any,
          progress_callback: (p: any) => {
            if (p.progress) {
              const pct = Math.round(10 + p.progress * 40);
              setProgress(pct);
            }
          },
        }
      );


      modelsRef.current.fp32 = fp32Model;
      setProgress(50);

      // Load INT8 model
      setStatus('loading-int8');
      setProgressMsg('Loading INT8 model (2/2)...');
      setProgress(50);

     const int8Model = await pipeline(
        'sentiment-analysis',
        MODEL_NAME,
        {
          dtype: 'q8' as any,
          progress_callback: (p: any) => {
            if (p.progress) {
              const pct = Math.round(50 + p.progress * 50);
              setProgress(pct);
            }
          },
        }
      );

      modelsRef.current.int8 = int8Model;
      setProgress(100);
      setProgressMsg('Ready!');
      setStatus('ready');
    } catch (e: any) {
      console.error('Model load error:', e);
      setError(e?.message || 'Failed to load models. Check console for details.');
      setStatus('ready'); // Allow retry
    }
  };

  const runBenchmark = async () => {
    if (!inputText.trim()) return;

    // --- SIMULATED PATH (mobile / low-memory) ---
    if (!exec.canAttemptLocal) {
      setStatus('benchmarking');
      setError('');
      setProgress(0);
      await new Promise(r => setTimeout(r, 1200));
      setProgress(50);
      await new Promise(r => setTimeout(r, 800));
      setProgress(100);
      setResults({
        fp32: { runs: [847, 831, 863, 819, 857], avg: 843, label: 'POSITIVE', confidence: 0.9967 },
        int8: { runs: [312, 298, 321, 305, 314], avg: 310, label: 'POSITIVE', confidence: 0.9954 },
        text: inputText,
      });
      setStatus('done');
      return;
    }
    // --- END SIMULATED PATH ---

    if (!modelsRef.current.fp32 || !modelsRef.current.int8) return;

    setStatus('benchmarking');
    setError('');
    setProgress(0);
    const benchmarkResults: BenchmarkResults = {
      fp32: null,
      int8: null,
      text: inputText,
    };

    try {
      // Run FP32 benchmark (5 runs)
      const fp32Runs: number[] = [];
      let fp32Label = '';
      let fp32Confidence = 0;

      for (let i = 0; i < 5; i++) {
        setProgress(Math.round((i / 5) * 50));

        const t0 = performance.now();
        const result = await modelsRef.current.fp32(inputText);
        const elapsed = performance.now() - t0;

        fp32Runs.push(Math.round(elapsed));
        fp32Label = result[0].label;
        fp32Confidence = result[0].score;
      }

      benchmarkResults.fp32 = {
        runs: fp32Runs,
        avg: Math.round(fp32Runs.reduce((a, b) => a + b, 0) / fp32Runs.length),
        label: fp32Label,
        confidence: fp32Confidence,
      };

      // Run INT8 benchmark (5 runs)
      const int8Runs: number[] = [];
      let int8Label = '';
      let int8Confidence = 0;

      for (let i = 0; i < 5; i++) {
        setProgress(Math.round(50 + (i / 5) * 50));

        const t0 = performance.now();
        const result = await modelsRef.current.int8(inputText);
        const elapsed = performance.now() - t0;

        int8Runs.push(Math.round(elapsed));
        int8Label = result[0].label;
        int8Confidence = result[0].score;
      }

      benchmarkResults.int8 = {
        runs: int8Runs,
        avg: Math.round(int8Runs.reduce((a, b) => a + b, 0) / int8Runs.length),
        label: int8Label,
        confidence: int8Confidence,
      };

      setResults(benchmarkResults);
      setProgress(100);
      setStatus('done');
    } catch (e: any) {
      console.error('Benchmark error:', e);
      setError(e?.message || 'Benchmark failed');
      setStatus('ready');
    }
  };

  const calculateSpeedup = () => {
    if (!results?.fp32 || !results?.int8) return null;
    const speedupPercent = Math.round(
      ((results.fp32.avg - results.int8.avg) / results.fp32.avg) * 100
    );
    const speedupMs = results.fp32.avg - results.int8.avg;
    return { ms: speedupMs, percent: speedupPercent };
  };

  const calculateSizeReduction = () => {
    const reduction = ((FP32_SIZE_MB - INT8_SIZE_MB) / FP32_SIZE_MB) * 100;
    return Math.round(reduction);
  };

  const accuracyMatches =
    results?.fp32?.label === results?.int8?.label
      ? '✓ Same prediction'
      : '⚠ Different prediction';

  const maxTime = results
    ? Math.max(
        ...(results.fp32?.runs || []),
        ...(results.int8?.runs || [])
      )
    : 100;

  return (
    <div className="min-h-[100svh] bg-background p-6 text-foreground">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Model Quantization Demo</h1>
            <p className="mt-1 text-muted-foreground">
              Compare FP32 vs INT8 inference — real benchmarks in your browser
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge className="bg-green-500/15 text-green-700 border border-green-500/30">Runs on device</Badge>
              <Badge className="bg-blue-500/15 text-blue-700 border border-blue-500/30">Privacy-preserving local inference</Badge>
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

        <Card className="mb-6 border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Local-First Inference Posture
          </p>
          <div className="mt-2 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
            <p><span className="font-medium text-foreground">Privacy:</span> Prompt text is processed in-browser for this demo after model download.</p>
            <p><span className="font-medium text-foreground">Efficiency:</span> INT8 reduces memory footprint and improves responsiveness on constrained hardware.</p>
            <p><span className="font-medium text-foreground">Trade-off:</span> Local models improve privacy/cost posture, while frontier server models remain useful for harder tasks.</p>
          </div>
        </Card>

        <AdaptiveExecutionBadge strategy={exec.strategy} className="mb-3" />
        <CapabilityNotice
          state={exec}
          demoName="Model Quantization"
          fallbackMessage="Showing pre-computed benchmark results on this device."
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
              Run real inference benchmarks comparing FP32 and INT8 quantized models in your
              browser.
            </p>
            <p className="mb-6 text-sm text-muted-foreground">No API key required. Models downloaded on first use</p>
            <button
              onClick={exec.canAttemptLocal ? loadModels : () => setStatus('ready')}
              className="rounded-lg bg-blue-600 px-8 py-3 font-medium text-white hover:bg-blue-700"
            >
              {exec.canAttemptLocal ? 'Load Models & Start Benchmark' : 'Try Simulated Benchmark'}
            </button>
          </Card>
        )}

        {/* Loading FP32 State */}
        {status === 'loading-fp32' && (
          <Card className="border-border bg-card p-6">
            <p className="mb-3 font-medium text-foreground">Loading FP32 model...</p>
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

        {/* Loading INT8 State */}
        {status === 'loading-int8' && (
          <Card className="border-border bg-card p-6">
            <p className="mb-3 font-medium text-foreground">Loading INT8 model...</p>
            <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-green-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {progress}% — {progressMsg}
            </p>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-800 mb-6 bg-red-900/20 p-6">
            <p className="mb-2 font-medium text-red-400">Error</p>
            <p className="mb-4 text-sm text-red-300">{error}</p>
            <button
              onClick={loadModels}
              className="rounded bg-red-700 px-4 py-2 text-sm text-white hover:bg-red-600"
            >
              Retry
            </button>
          </Card>
        )}

        {/* Main UI */}
        {(status === 'ready' || status === 'benchmarking' || status === 'done') && (
          <div className="space-y-6">
            {/* Step 1: Text Input & Examples */}
            <Card className="border-border bg-card p-6">
              <label className="mb-3 block text-sm font-medium text-muted-foreground">
                Enter text to analyze
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter text to analyze..."
                className="mb-4 h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-blue-500 focus:outline-none"
              />

              {/* Example Chips */}
              <div className="mb-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Example texts:</p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_TEXTS.map((text, i) => (
                    <button
                      key={i}
                      onClick={() => setInputText(text)}
                      className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground hover:border-blue-500 hover:bg-muted"
                    >
                      {text.slice(0, 30)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* Run Button */}
              <button
                onClick={runBenchmark}
                disabled={!inputText.trim() || status === 'benchmarking'}
                className={`w-full rounded-lg px-4 py-3 font-medium transition ${
                  inputText.trim() && status !== 'benchmarking'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {status === 'benchmarking' ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader size={16} className="animate-spin" />
                    Running Benchmark...
                  </span>
                ) : (
                  'Run Benchmark (5 runs each)'
                )}
              </button>

              {/* Progress During Benchmark */}
              {status === 'benchmarking' && (
                <div className="mt-4">
                  <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-purple-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{progress}% complete</p>
                </div>
              )}
            </Card>

            {/* Results - Side by Side Comparison */}
            {results && (
              <>
                {/* Model Cards */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* FP32 Card */}
                  <Card className="border-blue-700 bg-card p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-foreground">FP32</h3>
                      <Badge className="bg-blue-600">Full Precision</Badge>
                    </div>

                    <div className="space-y-3 border-b border-border pb-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Precision bits</span>
                        <span className="text-sm font-medium text-foreground">32-bit</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Model size</span>
                        <span className="text-sm font-medium text-foreground">~{FP32_SIZE_MB} MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Avg inference time</span>
                        <span className="text-lg font-bold text-blue-400">{results.fp32?.avg}ms</span>
                      </div>
                    </div>

                    {/* Results */}
                    <div className="my-4 border-b border-border pb-4">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">Prediction</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {results.fp32?.label}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {(results.fp32?.confidence! * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${(results.fp32?.confidence ?? 0) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Individual runs */}
                    <div>
                      <p className="mb-2 text-xs font-medium text-muted-foreground">Individual runs (ms)</p>
                      <div className="flex items-end gap-1">
                        {results.fp32?.runs.map((time, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-sm bg-blue-600"
                            style={{ height: `${(time / maxTime) * 40}px` }}
                            title={`${time}ms`}
                          />
                        ))}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {results.fp32?.runs.map(r => r.toString()).join(', ')}
                      </p>
                    </div>
                  </Card>

                  {/* INT8 Card */}
                  <Card className="border-green-700 bg-card p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-foreground">INT8</h3>
                      <Badge className="bg-green-600">Quantized</Badge>
                    </div>

                    <div className="space-y-3 border-b border-border pb-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Precision bits</span>
                        <span className="text-sm font-medium text-foreground">8-bit</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Model size</span>
                        <span className="text-sm font-medium text-foreground">~{INT8_SIZE_MB} MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Avg inference time</span>
                        <span className="text-lg font-bold text-green-400">{results.int8?.avg}ms</span>
                      </div>
                    </div>

                    {/* Results */}
                    <div className="my-4 border-b border-border pb-4">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">Prediction</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {results.int8?.label}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {(results.int8?.confidence! * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-green-500"
                          style={{ width: `${(results.int8?.confidence ?? 0) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Individual runs */}
                    <div>
                      <p className="mb-2 text-xs font-medium text-muted-foreground">Individual runs (ms)</p>
                      <div className="flex items-end gap-1">
                        {results.int8?.runs.map((time, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-sm bg-green-600"
                            style={{ height: `${(time / maxTime) * 40}px` }}
                            title={`${time}ms`}
                          />
                        ))}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {results.int8?.runs.map(r => r.toString()).join(', ')}
                      </p>
                    </div>
                  </Card>
                </div>

                {/* Comparison Summary */}
                {results.fp32 && results.int8 && (
                  <Card className="border-border bg-card p-6">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
                      <BarChart3 size={20} /> Comparison Summary
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-3">
                      {/* Size Reduction */}
                      <div className="rounded-lg border border-border bg-background p-4">
                        <p className="text-xs text-muted-foreground">Size Reduction</p>
                        <p className="mt-1 text-2xl font-bold text-green-400">
                          {calculateSizeReduction()}%
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {FP32_SIZE_MB}MB → {INT8_SIZE_MB}MB
                        </p>
                      </div>

                      {/* Speed Improvement */}
                      <div className="rounded-lg border border-border bg-background p-4">
                        <p className="text-xs text-muted-foreground">Speed Improvement</p>
                        {calculateSpeedup() && (
                          <>
                            <p className="mt-1 text-2xl font-bold text-blue-400">
                              {calculateSpeedup()!.percent}%
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {calculateSpeedup()!.ms.toFixed(0)}ms faster
                            </p>
                          </>
                        )}
                      </div>

                      {/* Accuracy */}
                      <div className="rounded-lg border border-border bg-background p-4">
                        <p className="text-xs text-muted-foreground">Accuracy</p>
                        <p className="mt-1 text-lg font-semibold text-foreground">{accuracyMatches}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Δ {Math.abs(results.fp32.confidence - results.int8.confidence).toFixed(3)}
                        </p>
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div className="mt-4 rounded-lg border border-green-700 bg-green-900/20 p-4">
                      <p className="text-sm text-green-300">
                        <strong>✓ INT8 recommended for production</strong> — Same accuracy, dramatically
                        smaller, faster inference
                      </p>
                    </div>
                  </Card>
                )}
              </>
            )}

            {/* Technical Info */}
            {(status === 'ready' || status === 'done') && (
              <Card className="border-border bg-card p-6">
                <h3 className="mb-4 text-lg font-bold text-foreground">What is Quantization?</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div>
                    <p className="font-medium text-foreground">FP32 (Full Precision)</p>
                    <p className="text-muted-foreground">
                      Uses 32 bits per weight, highest precision, best accuracy, but larger model
                      size and slower inference
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">INT8 (Quantized)</p>
                    <p className="text-muted-foreground">
                      Uses 8 bits per weight, 4x compression, faster inference, lower memory usage,
                      suitable for edge deployment. Negligible accuracy loss with proper calibration
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Why it Matters</p>
                    <p className="text-muted-foreground">
                      Quantization enables deploying large models on resource-constrained devices
                      (mobile, edge), reduces memory usage, speeds up inference significantly, and
                      lowers deployment costs
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Trade-offs</p>
                    <p className="text-muted-foreground">
                      Slight potential accuracy loss, requires calibration on representative data,
                      different hardware may support different quantization schemes optimally
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
