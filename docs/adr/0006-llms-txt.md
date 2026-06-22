# ADR-0006: llms.txt is the canonical plain-text representation of the portfolio

**Status**: Accepted  
**Date**: 2026-06

## Context

LLM crawlers (ChatGPT's browse plugin, Perplexity, Claude.ai, Gemini) cannot reliably
parse structured HTML, JavaScript-rendered content, or JSON-LD for Q&A tasks. They
prefer plain text. The emerging `llms.txt` convention (analogous to `robots.txt`) is
supported by several crawlers as the preferred entry point for AI-readable site summaries.

## Decision

`public/llms.txt` is the authoritative plain-text portfolio summary. It is:
- Written in first-person, prose sections (not JSON, not HTML)
- Updated by hand when profile facts, demo list, or headline metrics change
- Listed in `sitemap.xml` and referenced in `robots.txt` Allow rules
- Structured with named sections matching recruiter query intents:
  `VERIFIED IMPACT METRICS`, `PLATFORM ARCHITECTURE`, `AI DEMOS`, `WHAT'S NEW`,
  `RECRUITER QUERIES`

`llms-full.txt` (future) will be a longer form with full experience narratives.

## Alternatives considered

- **JSON-LD only**: Already implemented (`@graph` in layout.tsx). Not sufficient alone —
  LLMs parsing JSON-LD for conversational Q&A tend to miss prose context and hallucinate
  field mappings.
- **Sitemap + page crawl**: Relies on the crawler rendering JS. Portfolio is Next.js
  App Router — many sections are client components. Not reliable.
- **No dedicated AI file**: Let crawlers parse the HTML. Rejected because unstructured
  HTML yields inconsistent Q&A results when recruiters ask ChatGPT "what has Prasad
  built?" — tested and confirmed degraded output quality without llms.txt.

## Consequences

- `llms.txt` must be updated any time: a new demo ships, a headline metric changes, a
  new role is added, or the profile title changes.
- `profile.personal.title` in `profile.json` and the title line in `llms.txt` must match.
- The file is publicly cached by Vercel CDN — Vercel redeploy is required after any edit
  (automatic via CI/CD on push to main).
- Linked from `ai-agent-manifest.json` as the `plain_text_url` field.
