---
version: "alpha"
name: "Prasad Kavuri Portfolio"
description: "Executive AI engineering portfolio — recruiter-first, agent-readable, production AI reference architecture."

colors:
  primary: "oklch(0.922 0 0)"
  secondary: "oklch(0.269 0 0)"
  accent: "oklch(0.65 0.22 264)"
  background: "oklch(0.145 0 0)"
  foreground: "oklch(0.985 0 0)"
  muted: "oklch(0.269 0 0)"
  border: "oklch(1 0 0 / 10%)"
  destructive: "oklch(0.704 0.191 22.216)"

typography:
  h1:
    fontFamily: "Geist Sans"
    fontSize: "1.875rem" # Tailwind text-3xl default; no local fontSize config found.
    fontWeight: "700"
  h2:
    fontFamily: "Geist Sans"
    fontSize: "1.125rem" # Tailwind text-lg default; no local fontSize config found.
  body-md:
    fontFamily: "Geist Sans"
    fontSize: "0.875rem" # Tailwind text-sm default used throughout recruiter/agent pages.
  label-sm:
    fontFamily: "Geist Sans"
    fontSize: "0.75rem" # Tailwind text-xs default used for labels and metadata.

rounded:
  sm: "calc(var(--radius) * 0.6)"
  md: "calc(var(--radius) * 0.8)"
  lg: "var(--radius)"

spacing:
  sm: "0.75rem" # Tailwind gap-3 default; no local spacing config found.
  md: "1rem" # Tailwind p-4 default; no local spacing config found.
  lg: "1.25rem" # Tailwind p-5 default; no local spacing config found.
  xl: "2.5rem" # Tailwind py-10/mb-10 default; no local spacing config found.

components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.background}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.md}"
  card:
    backgroundColor: "{colors.background}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.lg}"
  stat-card:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.background}"
    rounded: "{rounded.lg}"
  demo-card:
    backgroundColor: "{colors.background}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.lg}"
  callout:
    backgroundColor: "{colors.muted}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.md}"
---

## Overview

This portfolio is designed for executive clarity: it makes Prasad Kavuri's AI platform leadership, scale, and production rigor legible within seconds. The experience is recruiter-first while remaining deeply agent-readable through structured routes, JSON-LD, manifests, and consistent canonical values. It presents production AI reference architecture, not a generic developer portfolio. The dual audience is human recruiters evaluating VP / Head-level fit and AI agents extracting reliable machine-readable evidence.

## Brand Positioning

- Role: Head of AI Engineering / VP of AI Engineering
- Tone: Executive. Precise. Credible. Not startup-casual.
- Visual language: Professional, minimal, high-signal
- Anti-pattern: Do not introduce startup/hacker aesthetic, excessive animation, or decorative complexity

## Design Principles

- **Clarity over decoration** — Every element earns its place by aiding comprehension, trust, or action.
- **Recruiter-first density** — The homepage communicates role, scale, and impact within 5 seconds without scrolling.
- **Business value before mechanics** — Demo pages lead with the problem solved, not the technology used.
- **Executive signal above technical clutter** — Stat cards and outcome framing outrank code complexity.
- **Consistent identity** — Role title, email, metrics, and team scale must match canonical values everywhere.
- **Agent-safe editing** — Every page change must preserve JSON-LD metadata, machine-readable surfaces, and sitemap alignment.

## Recruiter UX Rules

1. Homepage must communicate role + scale + impact above the fold.
2. "/for-recruiters" must remain in primary navigation.
3. Stat cards (200+ engineers, 70%+ cost reduction, $10M+ impact) must appear on homepage and /for-recruiters.
4. CTA to resume/contact must be visible without scrolling.
5. Do not increase homepage content density.

## Demo Page Rules

1. Every demo card must display businessOutcome (executive 1-liner).
2. Demo pages must include JSON-LD CreativeWork structured data.
3. Lead with the business problem, then the architecture, then tech.
4. Governance and HITL patterns must be surfaced where present.
5. Do not remove benchmark data or production-derived callouts.

## Navigation Rules

1. Primary nav must include: Demos, For Recruiters, Governance, Capabilities (or equivalent).
2. Do not replace route-based links with section anchors.
3. /agent and /ai-profile.json must remain discoverable from footer or nav.
4. Adding nav items requires removing one — keep total <= 5 items.

## AI Agent Editing Rules

1. Before editing any UI copy, read: README.md, ai-profile.json, llms-full.txt, and homepage copy for canonical values.
2. Use canonical role: "Head of AI Engineering" for machine surfaces and "VP / Head of AI Engineering" for human pages.
3. Use canonical email: vbkpkavuri@gmail.com — nowhere else.
4. Use canonical metrics: 200+ engineers, 70%+ cost reduction, $10M+ revenue impact — do not alter these.
5. If modifying a demo page, verify JSON-LD structured data remains intact after your change.
6. If adding a new demo, it must have: demos.ts entry with businessOutcome, route page, JSON-LD, sitemap entry, tests.
7. If changing navigation, confirm /for-recruiters, /demos, /governance remain reachable within 1 click from homepage.
8. Do not introduce new Tailwind classes not present in the existing codebase.
9. Do not modify llms.txt, llms-full.txt, ai-profile.json, or ai-agent-manifest.json without explicit instruction.
10. Run npm run lint && npm run test && npm run build before committing any change.

## Content Consistency Rules

| Field | Canonical Value |
|---|---|
| Role (machine) | Head of AI Engineering |
| Role (human) | VP / Head of AI Engineering |
| Email | vbkpkavuri@gmail.com |
| Team size | 200+ |
| Cost metric | 70%+ AI infrastructure cost reduction |
| Revenue | $10M+ revenue impact |
| Demo count | 13 (dynamic — check demos.ts) |
| Portfolio | https://www.prasadkavuri.com |
| GitHub | github.com/prasad-kavuri/prasad-portfolio |

## Accessibility and Performance Rules

1. WCAG 2.2 AA minimum — validated via @axe-core/playwright in CI.
2. Color contrast: all text must pass AA ratio against background.
3. No layout shift on demo card load.
4. Lazy load images; never block LCP with non-critical assets.
5. Do not add client-side dependencies that increase bundle size without explicit justification.

## Anti-Patterns to Avoid

- Do NOT replace executive framing with developer-portfolio language.
- Do NOT add animations or transitions that delay content visibility.
- Do NOT increase homepage density (it is already calibrated).
- Do NOT remove businessOutcome copy from demo cards.
- Do NOT use anchor links (#section) in primary navigation.
- Do NOT introduce a second email address anywhere.
- Do NOT change team size, cost reduction %, or revenue metrics without documented evidence.
- Do NOT commit without running lint + test + build.

## Validation Checklist

Before merging any PR, confirm:

- [ ] Does this preserve recruiter comprehension within 10 seconds?
- [ ] Does this maintain canonical role/email/metrics?
- [ ] Are all machine-readable surfaces (JSON-LD, ai-profile.json, sitemap) unaffected or correctly updated?
- [ ] Does WCAG 2.2 AA compliance hold?
- [ ] Are no new Tailwind classes introduced outside the design system?
- [ ] Do npm run lint && npm run test && npm run build all pass?
- [ ] If a demo was changed, is JSON-LD still present and valid?
- [ ] If navigation changed, are /for-recruiters and /demos still reachable in <= 1 click?
