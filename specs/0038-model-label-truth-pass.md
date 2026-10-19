# SPEC-0038: Model label truth pass

**Status**: Implemented (pending the PR's own CI run)
**Date**: 2026-10-18

## What

Page text that names models is brought in line with what the demos actually run and with sources checked on
2026-10-18. No model, route or behaviour changes.

## Why

The model inventory found text that was stale or unsupported:

1. The multi-agent page said "Qwen3.6-27B natively retains chain-of-thought..." with a "Qwen3.6-27B compatible" badge,
   but the demo runs GPT-OSS 120B on Groq, and Qwen3.6-27B has a successor (Qwen3.8-27B, Apache 2.0, Hugging Face
   model card checked 2026-10-18).
2. The LLM router page described a "Qwen 3.6 27B" card with "77.2% SWE-bench Verified" and an Unsloth Qwen3.6 GGUF
   link. The 77.2% figure is not on the Qwen3.8-27B card (which self-reports SWE-bench Pro 61.7), and the GGUF
   link was for the old model.
3. The architecture section listed "Florence-2 WebGPU" as inference tech; no code uses it.

## Decisions

- Multi-agent: describe preserved thinking as a property of models such as Qwen3.8-27B, state that the demo runs
  GPT-OSS 120B, and replace the badge with "Model-agnostic pattern".
- LLM router mid-tier card: rename to Qwen 3.8 27B; keep only claims the model card supports (Apache 2.0, preserved
  thinking, SWE-bench Pro 61.7 self-reported); link the official model card (it links quantized builds) instead of a
  third-party GGUF repo; context shown as 131,072 (Groq's listed window); VRAM shown as approximate. Drop the SWE-bench
  row from the dense-vs-MoE table, since the two figures came from different models and cannot be re-verified.
- The local MoE card and its API route keep Qwen3.6-35B-A3B but use one consistent name (it was spelled three ways).
- Architecture section: Florence-2 replaced by "WebGPU / WASM backends".

## Scope boundaries

- In scope: display text in llm-router, multi-agent, qwen-moe route labels, AIArchitecture, and the router test.
- Out of scope: the static Intel AutoRound reference on the quantization page (could not verify the artifact page);
  the browser model choices (SPEC-0039 trial); the Groq model catalog; historical docs.

## Verification

`npx vitest run src/__tests__/components src/__tests__/api` (514 passed), `tsc --noEmit`, eslint (0 errors).
