import { track } from '@vercel/analytics';

export const trackEvent = (name: string, props?: Record<string, string>) => {
  try { track(name, props); } catch {}
};
