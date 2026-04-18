'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getDeviceCapability, getRoutingStrategy,
  type DeviceCapability, type RoutingStrategy, type DemoExecutionProfile,
  INFERENCE_TIMEOUT_MS, FALLBACK_RETRY_MAX,
} from '@/lib/device-intelligence';

export { INFERENCE_TIMEOUT_MS };

export interface ExecutionState {
  strategy: RoutingStrategy | null;
  capability: DeviceCapability | null;
  mode: 'local' | 'cloud' | 'hybrid' | 'simulated' | null;
  fallbackTriggered: boolean;
  fallbackReason: string | null;
  isRecovering: boolean;
  retryCount: number;
  isReady: boolean; // true once detection has run client-side
  canAttemptLocal: boolean;
}

interface UseExecutionStrategyOptions {
  demoId: string;
  executionProfile: DemoExecutionProfile;
  hasCloudFallback: boolean;
  requiresWebGPU?: boolean;
}

export function useExecutionStrategy(
  options: UseExecutionStrategyOptions,
): ExecutionState & {
  triggerFallback: (reason: string) => void;
  resetFallback: () => void;
} {
  const [state, setState] = useState<ExecutionState>({
    strategy: null, capability: null, mode: null,
    fallbackTriggered: false, fallbackReason: null,
    isRecovering: false, retryCount: 0, isReady: false,
    canAttemptLocal: false,
  });

  const retryCountRef = useRef(0);

  // Run capability detection client-side only (SSR-safe)
  useEffect(() => {
    const capability = getDeviceCapability();

    // If demo requires WebGPU and device lacks it, downgrade to simulated/cloud
    const effectiveProfile =
      options.requiresWebGPU && !capability.hasWebGPU
        ? ('heavy-local' as DemoExecutionProfile) // will route to cloud/simulated via score
        : options.executionProfile;

    const strategy = getRoutingStrategy(
      options.demoId,
      effectiveProfile,
      capability,
      options.hasCloudFallback,
    );

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(prev => ({
      ...prev,
      capability,
      strategy,
      mode: strategy.mode,
      canAttemptLocal: strategy.canAttemptLocal,
      isReady: true,
    }));
  }, [options.demoId, options.executionProfile,
      options.hasCloudFallback, options.requiresWebGPU]);

  const triggerFallback = useCallback((reason: string) => {
    if (retryCountRef.current >= FALLBACK_RETRY_MAX) return;
    retryCountRef.current += 1;
    setState(prev => ({
      ...prev,
      fallbackTriggered: true,
      fallbackReason: reason,
      isRecovering: true,
      retryCount: retryCountRef.current,
      mode: options.hasCloudFallback ? 'cloud' : 'simulated',
      canAttemptLocal: false,
    }));
    // Recovery state clears after a brief window
    setTimeout(() => {
      setState(prev => ({ ...prev, isRecovering: false }));
    }, 1_500);
  }, [options.hasCloudFallback]);

  const resetFallback = useCallback(() => {
    retryCountRef.current = 0;
    setState(prev => ({
      ...prev,
      fallbackTriggered: false,
      fallbackReason: null,
      isRecovering: false,
      retryCount: 0,
    }));
  }, []);

  return { ...state, triggerFallback, resetFallback };
}
