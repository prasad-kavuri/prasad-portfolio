import { scheduleIdleTask, type CancelScheduledTask } from '@/lib/client-scheduler';

type TransformersModule = typeof import('@huggingface/transformers');

let transformersModulePromise: Promise<TransformersModule> | null = null;

export async function loadTransformersModule(): Promise<TransformersModule> {
  if (!transformersModulePromise) {
    transformersModulePromise = import('@huggingface/transformers');
  }
  return transformersModulePromise;
}

export function preloadTransformersOnIdle(): CancelScheduledTask {
  return scheduleIdleTask(() => {
    void loadTransformersModule();
  });
}
