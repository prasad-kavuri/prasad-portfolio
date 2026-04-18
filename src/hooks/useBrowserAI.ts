'use client';

import { useState, useEffect } from 'react';

export type BrowserAICapability =
  | 'ready'           // Desktop, sufficient RAM, full inference
  | 'low-memory'      // Desktop but low RAM — attempt with warning
  | 'mobile-ios'      // iOS Safari — blob: worker blocked
  | 'mobile-android'  // Android — constrained WASM heap
  | 'no-webgpu'       // Desktop but no WebGPU (affects Multimodal only)
  | 'unsupported';    // No WebAssembly at all

export interface BrowserAIStatus {
  capability: BrowserAICapability;
  shouldAttemptLoad: boolean;
  warningTitle: string | null;
  warningDetail: string | null;
  deviceMemoryGB: number | undefined;
  isMobile: boolean;
  hasWebGPU: boolean;
}

export function useBrowserAI(requiresWebGPU = false): BrowserAIStatus {
  const [status, setStatus] = useState<BrowserAIStatus>({
    capability: 'ready',
    shouldAttemptLoad: false, // default false until detection runs
    warningTitle: null,
    warningDetail: null,
    deviceMemoryGB: undefined,
    isMobile: false,
    hasWebGPU: false,
  });

  useEffect(() => {
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    const isMobile = isIOS || isAndroid;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const wasmOK = typeof WebAssembly !== 'undefined';
    const hasWebGPU = 'gpu' in navigator;

    let next: BrowserAIStatus;

    if (!wasmOK) {
      next = { capability: 'unsupported', shouldAttemptLoad: false,
        warningTitle: 'Browser Not Supported',
        warningDetail: 'WebAssembly is required for browser-side AI inference. Please use Chrome 89+, Firefox 89+, or Safari 15+.',
        deviceMemoryGB: memory, isMobile, hasWebGPU };
    } else if (isIOS) {
      next = { capability: 'mobile-ios', shouldAttemptLoad: false,
        warningTitle: 'iOS Device — Showing Simulated Demo',
        warningDetail: 'iOS Safari restricts the Web Worker APIs this demo needs for on-device inference. A full simulated walkthrough is shown below so you can see the pipeline in action. For live model inference, open on desktop Chrome or Firefox.',
        deviceMemoryGB: memory, isMobile: true, hasWebGPU };
    } else if (isAndroid) {
      next = { capability: 'mobile-android', shouldAttemptLoad: false,
        warningTitle: 'Android Device — Showing Simulated Demo',
        warningDetail: 'Android browsers have constrained WebAssembly memory limits that make model loading unreliable. A simulated walkthrough is shown. For live inference, visit on a desktop browser.',
        deviceMemoryGB: memory, isMobile: true, hasWebGPU };
    } else if (requiresWebGPU && !hasWebGPU) {
      next = { capability: 'no-webgpu', shouldAttemptLoad: false,
        warningTitle: 'WebGPU Not Available — Showing Simulated Demo',
        warningDetail: "This demo uses WebGPU for accelerated vision model inference. Your browser doesn't support WebGPU yet. Enable it in chrome://flags or try Chrome 113+. A simulated output is shown below.",
        deviceMemoryGB: memory, isMobile: false, hasWebGPU: false };
    } else if (memory !== undefined && memory < 4) {
      next = { capability: 'low-memory', shouldAttemptLoad: false,
        warningTitle: `Low Memory (${memory}GB) — Showing Simulated Demo`,
        warningDetail: `This demo needs at least 4GB RAM for the AI model. Your device reports ${memory}GB available. A simulated walkthrough is shown.`,
        deviceMemoryGB: memory, isMobile: false, hasWebGPU };
    } else if (memory !== undefined && memory < 8) {
      next = { capability: 'low-memory', shouldAttemptLoad: true,
        warningTitle: `Limited Memory (${memory}GB) — May Load Slowly`,
        warningDetail: `8GB+ RAM recommended. The model will attempt to load but may be slow on large inputs.`,
        deviceMemoryGB: memory, isMobile: false, hasWebGPU };
    } else {
      next = { capability: 'ready', shouldAttemptLoad: true,
        warningTitle: null, warningDetail: null,
        deviceMemoryGB: memory, isMobile: false, hasWebGPU };
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus(next);
  }, [requiresWebGPU]);

  return status;
}
