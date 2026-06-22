# ADR-0004: useBrowserAI hook is mandatory for all browser demos

**Status**: Accepted  
**Date**: 2026-06

## Context

Browser demos load large WASM binaries (up to ~400MB heap) and GPU-accelerated models. On mobile devices and low-memory machines, unconditionally loading these models causes tab crashes, out-of-memory kills, or silent hangs with no user feedback.

## Decision

Every browser demo must call `useBrowserAI(requiresWebGPU?)` from `src/hooks/useBrowserAI.ts` before loading any model. The hook detects mobile UA and available memory and returns `{ shouldUseAI, isMobile, isLowMemory }`. When `shouldUseAI` is false, the demo renders `<BrowserAIWarning />` instead of attempting inference.

## Alternatives considered

- **Unconditional model load with try/catch**: Simpler — no hook needed. Rejected because tab crashes are not catchable; the user sees a white screen with no explanation.
- **Device detection in each demo separately**: Each demo re-implements detection. Rejected because inconsistency crept in — some demos checked UA, others checked memory, creating different fallback behaviors.
- **Server-side UA check and redirect**: Rejected because it adds a server round-trip before the demo renders, hurting perceived performance on desktop.

## Consequences

- Every new browser demo must import and call `useBrowserAI` before any model load.
- Pass `true` to `useBrowserAI(true)` for WebGPU-required demos (Multimodal); `false` or omit for WASM-only demos.
- `BrowserAIWarning` must be rendered when `shouldUseAI === false`. Skipping it is a bug.
- Mobile fallback paths use simulated output — they never call the real model or a server API.
