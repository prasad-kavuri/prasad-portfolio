# SPEC-0040: Repo-wide model reference sweep

**Status**: Implemented (pending the PR's own CI run)
**Date**: 2026-10-18

## What

Every place that names a model, a model backend or an inference engine is checked against what actually runs, and
corrected. Documentation only (plus one display string); no behaviour change.

## Why

SPEC-0029 to SPEC-0039 moved the demos to GPT-OSS 20B/120B and Qwen3.8 27B and reviewed the browser models. A
repo-wide search (llama, qwen, gpt-oss, gemma, deepseek, crewai, florence, bert, minilm, groq) found text that still
described older setups, and some docs that named no models at all.

## Changes

- README and `docs/ARCHITECTURE.md`: new "Models" section (which model runs where, one source of truth in
  `src/lib/groq-models.ts`, weekly health check, links to SPEC-0029/0039); demo rows name the models.
- `public/architecture-diagram.svg`: layer boxes now name the models; "CrewAI backend" removed; "vision + ONNX" under
  Browser ML replaced (no vision model is used).
- `public/readme-multi-agent-workflow-proof.svg`: "CrewAI" chip replaced by "GPT-OSS 120B". Verified: the Space's
  `app.py`, `requirements.txt` and Dockerfile are plain FastAPI plus the Groq SDK; CrewAI is not used there.
- `CLAUDE.md`, `skills/prasad-portfolio/SKILL.md`, `CONTEXT.md`, `public/llms-full.txt`: engine tables updated; the
  Florence-2 "Multimodal" row and mention removed (no demo uses it). The pinned skill's SHA-256 in
  `.github/skill-security-scope.json` is refreshed on purpose; SkillSpector must pass on the PR.
- `src/data/demos.ts`: edge-agent capability note said "~440MB"; the default WASM download is the 109 MB q8 file
  (431 MB is the FP32 file), so it now says "~110MB download".
- `CHANGELOG.md`: Unreleased entry. `docs/RELEASE_v1.0.0.md` and `docs/releases/first-public-release.md` keep their
  original text (history) with a note pointing to the README.

## Left as is, on purpose

- `docs/adr/*` and `specs/*`: dated records.
- DeepSeek DSpark text (a news item), Gemma/Gemini mentions in profile and certification data (employment and
  credentials, not this site's models), CrewAI/LangGraph as skills on the profile and in the RAG demo's sample
  document (Prasad's experience, not this site's stack).
- The layer description text that runs underneath the boxes in the architecture diagram (pre-existing overlap).

## Verification

Full vitest (1322 passed), `tsc --noEmit`, skill index check, SVG rendered in Chromium and checked for overflow.
