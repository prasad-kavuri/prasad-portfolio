# ADR-0005: LLM Router dispatches to a single provider (Groq) — no multi-provider fan-out

**Status**: Accepted  
**Date**: 2026-06

## Context

The LLM Router demo (`/demos/llm-router`, `/api/llm-router`) selects the optimal
model for a query based on complexity scoring. A naive implementation would fan out to
multiple inference providers (Groq, OpenAI, Anthropic) and compare latency/cost in
real-time.

## Decision

The router sends exactly one request per query — always to Groq. The "routing" decision
is made by the complexity classifier, which picks among Groq-hosted models
(`llama-3.1-8b-instant`, `llama-3.3-70b-versatile`, `mixtral-8x7b-32768`). No other
inference provider is called.

## Alternatives considered

- **Fan-out to multiple providers**: Lets the router compare real responses. Rejected
  because it multiplies latency (waiting for the slowest provider), multiplies cost (N
  providers × tokens), and requires storing multiple API keys with different billing
  accounts — a significant ops burden for a portfolio demo.
- **OpenAI as secondary provider**: Adding `OPENAI_API_KEY` as a fallback. Rejected
  because it adds a secret rotation burden and has no UX benefit visible to a recruiter
  reviewing the demo.
- **Mock routing with canned responses**: Always fast, no API cost. Rejected because
  live Groq inference is the point — the demo proves real sub-second multi-model
  dispatch, not a simulation.

## Consequences

- `GROQ_API_KEY` is the only LLM secret required in Vercel.
- Adding a second provider in the future requires: a new env secret, `enforceRateLimit`
  extension for that route, a new `logAPIEvent` route key, and updates to the cost-
  control tracker.
- The router complexity score is deterministic per query — same input always routes to
  the same model tier (no randomness).
