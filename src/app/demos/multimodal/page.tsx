'use client';

import { useRef, useState } from 'react';
import { ArrowLeft, Upload, Loader } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

type Status = 'idle' | 'loading-model' | 'ready' | 'processing' | 'error';
type TaskType = 'classify' | 'zero-shot';

interface ClassificationResult {
  label: string;
  score: number;
}

export default function MultimodalPage() {
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState('');

  const [imageData, setImageData] = useState<string | null>(null);
  const [result, setResult] = useState<ClassificationResult[] | null>(null);
  const [processingTime, setProcessingTime] = useState(0);
  const [activeTask, setActiveTask] = useState<TaskType>('classify');
  const [zeroShotLabels, setZeroShotLabels] = useState('cat, dog, car, person, building');

  const classifyPipelineRef = useRef<any>(null);
  const clipPipelineRef = useRef<any>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const dragOverRef = useRef(false);

  const loadModels = async () => {
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

      // Check for WebGPU
      if (!(globalThis as any).navigator?.gpu) {
        setProgressMsg('WebGPU not available, using CPU (slower)...');
      }

      // Load classifier (1/2)
      setProgressMsg('Loading classifier (1/2)...');
      setProgress(10);

      const classifyPipe = await pipeline(
        'image-classification',
        'Xenova/vit-base-patch16-224',
        {
          progress_callback: (p: any) => {
            if (p.progress) {
              const pct = Math.round(10 + p.progress * 30);
              setProgress(pct);
            }
          },
        }
      );

      classifyPipelineRef.current = classifyPipe;
      setProgress(40);

      // Load CLIP (2/2)
      setProgressMsg('Loading CLIP (2/2)...');
      setProgress(40);

      const clipPipe = await pipeline(
        'zero-shot-image-classification',
        'Xenova/clip-vit-base-patch32',
        {
          progress_callback: (p: any) => {
            if (p.progress) {
              const pct = Math.round(40 + p.progress * 60);
              setProgress(pct);
            }
          },
        }
      );

      clipPipelineRef.current = clipPipe;
      setProgress(100);
      setProgressMsg('Ready!');
      setStatus('ready');
    } catch (e: any) {
      console.error('Model load error:', e);
      setError(e?.message || 'Failed to load models. Check console for details.');
      setStatus('error');
    }
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
    } catch (e: any) {
      setError('Could not load URL — try uploading the image directly instead');
      setImageData(null);
    }
  };

  const runClassify = async () => {
    if (!imageData || !classifyPipelineRef.current) return;

    setStatus('processing');
    setResult(null);
    setError('');
    const t0 = performance.now();

    try {
      const results = await classifyPipelineRef.current(imageData, {
        topk: 5,
      });

      setProcessingTime(Math.round(performance.now() - t0));
      setResult(results);
      setStatus('ready');
    } catch (e: any) {
      console.error('Classification error:', e);
      setError(e?.message || 'Classification failed');
      setStatus('error');
    }
  };

  const runZeroShot = async () => {
    if (!imageData || !clipPipelineRef.current) return;

    const labels = zeroShotLabels
      .split(',')
      .map((label) => label.trim())
      .filter((label) => label.length > 0);

    if (labels.length === 0) {
      setError('Please enter at least one label');
      return;
    }

    setStatus('processing');
    setResult(null);
    setError('');
    const t0 = performance.now();

    try {
      const results = await clipPipelineRef.current(imageData, labels);

      setProcessingTime(Math.round(performance.now() - t0));
      setResult(results);
      setStatus('ready');
    } catch (e: any) {
      console.error('Zero-shot error:', e);
      setError(e?.message || 'Zero-shot classification failed');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6 text-white">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Multimodal AI Assistant</h1>
            <p className="mt-1 text-slate-400">Run vision models in your browser</p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-slate-200 hover:bg-slate-600"
          >
            <ArrowLeft size={16} /> Back
          </Link>
        </div>

        {/* Idle State */}
        {status === 'idle' && (
          <Card className="border-slate-700 bg-slate-800 p-8 text-center">
            <p className="mb-4 text-slate-300">
              Load vision models to classify images in your browser. No API key required.
            </p>
            <p className="mb-6 text-sm text-slate-400">
              Note: Models will download on first use
            </p>
            <button
              onClick={loadModels}
              className="rounded-lg bg-blue-600 px-8 py-3 font-medium text-white hover:bg-blue-700"
            >
              Load Models & Start
            </button>
          </Card>
        )}

        {/* Loading State */}
        {status === 'loading-model' && (
          <Card className="border-slate-700 bg-slate-800 p-6">
            <p className="mb-3 font-medium text-slate-200">Loading models...</p>
            <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-slate-400">
              {progress}% — {progressMsg}
            </p>
          </Card>
        )}

        {/* Error State */}
        {status === 'error' && (
          <Card className="border-red-800 bg-red-900/20 p-6">
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
        {(status === 'ready' || status === 'processing') && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left: Image Upload & Preview */}
            <div className="space-y-4">
              {/* Upload Area */}
              <Card
                className={`border-2 border-dashed border-slate-600 bg-slate-800 p-8 text-center transition ${
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
                <Upload size={32} className="mx-auto mb-2 text-slate-400" />
                <p className="mb-2 text-slate-300">Drag & drop an image or click to browse</p>
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="rounded bg-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-600"
                >
                  Browse Files
                </button>
              </Card>

              {/* URL Input */}
              <Card className="border-slate-700 bg-slate-800 p-4">
                <label className="mb-2 block text-sm font-medium text-slate-300">
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
                    className="flex-1 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={(e) => {
                      const url = (e.currentTarget.previousElementSibling as HTMLInputElement)
                        .value;
                      handleURLInput(url);
                    }}
                    className="rounded-lg bg-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-600"
                  >
                    Load
                  </button>
                </div>
              </Card>

              {/* Image Preview */}
              {imageData && (
                <Card className="border-slate-700 bg-slate-800 overflow-hidden">
                  <img src={imageData} alt="Preview" className="w-full" />
                </Card>
              )}

              {!imageData && (
                <Card className="border-slate-700 bg-slate-800 p-8 text-center">
                  <p className="text-slate-400">No image loaded</p>
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
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
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
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
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
                        : 'bg-slate-700 text-slate-400'
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
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Labels (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={zeroShotLabels}
                      onChange={(e) => setZeroShotLabels(e.currentTarget.value)}
                      placeholder="e.g. cat, dog, car, person"
                      className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={runZeroShot}
                    disabled={!imageData || status === 'processing'}
                    className={`w-full rounded-lg px-4 py-3 font-medium transition ${
                      imageData && status !== 'processing'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-slate-700 text-slate-400'
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
                <Card className="border-slate-700 bg-slate-800 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-300">Results</p>
                    <span className="text-xs text-slate-400">{processingTime}ms</span>
                  </div>
                  <div className="space-y-3">
                    {result.map((item, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-300">{item.label}</p>
                          <p className="text-sm font-medium text-slate-200">
                            {(item.score * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
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
                <Card className="border-slate-700 bg-slate-800 p-8 text-center">
                  <p className="text-slate-400">
                    {activeTask === 'classify'
                      ? 'Click "Classify Image" to analyze'
                      : 'Enter labels and click "Classify Image" to analyze'}
                  </p>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Info Footer */}
        {(status === 'ready' || status === 'processing') && (
          <Card className="mt-8 border-slate-700 bg-slate-800 p-5">
            <p className="mb-2 font-medium text-slate-200">How it works</p>
            <ul className="space-y-1 text-sm text-slate-400">
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
