# SPEC-0022: Phase 3 — executive layer (leadership-first IA, verified case studies, framework alignment)

**Status**: Implemented (case-study questionnaire pending with owner)
**Date**: 2026-09-23

## What

1. **Leadership-first information architecture.**
   - Primary nav: Leadership · Operating Model · Platform (flagship first, then catalog and deep dives) ·
     Perspectives · About & Contact · Resume. "For Recruiters" stays reachable from the footer and the
     recruiter pages, not the primary nav.
   - Homepage order: Hero → Experience → Case Studies → Transformation → AI Tools → Architecture →
     Expertise → Perspectives → Testimonials → Contact.
   - Hero: primary CTA is "Leadership & Case Studies"; the recruiter dashboard becomes a secondary
     "Executive Brief" link; the strip is "Executive Briefing"; the A2A chip points to the live A2A
     endpoint in the flagship (it previously credited the Multi-Agent demo, which does not speak A2A).
2. **Verified case studies.** Every line in `src/components/sections/CaseStudies.tsx` is grounded in
   `src/data/profile.json`. Removed: "~2-3x ROI within 12 months", "recurring revenue through B2B API
   subscriptions", "global engineering organization built from ground up", the HERE "200+ total org"
   phrasing, and key-decision rationale not in the resume record. New decision/trade-off content comes
   only from the owner questionnaire.
3. **Operating model: framework alignment.** `/enterprise-ai-operating-model` gains a NIST AI RMF 1.0
   (Govern / Map / Measure / Manage) × ISO/IEC 42001:2023 Annex A alignment map. Each row lists controls
   that are implemented and tested in this repo, with evidence links to code or live endpoints, and is
   labeled "an alignment map, not a certification". The page now has the site nav and footer.
4. **Perspectives index.** New `/perspectives` page (CollectionPage + ItemList JSON-LD) backed by
   `src/data/perspectives.ts`, which also feeds the sitemap.
5. **Title and job-seeking signals.** Demo metadata no longer says "by VP of AI Engineering"; the STORM
   research prompt assesses "an AI platform executive" instead of "a VP of AI Engineering candidate",
   and its default perspective "Executive Recruiter" is now "Chief Technology Officer".

## Why

Positioning target is VP AI Platform (CAIO stretch). Executive readers look for leadership outcomes,
operating model, and governance posture before demos; recruiter-first framing reads as job seeking.
Owner decisions: draft + questionnaire (nothing unverified goes live); Zip wording unchanged; no
Google-stack specifics.

## Scope boundaries

- Out of scope: Zip-specific content, new metrics, resume PDF filename (`prasad-kavuri-vp-ai-engineering-2026.pdf`,
  kept to avoid breaking inbound links), removal of the recruiter pages.
- Pending owner input: decisions and trade-offs per case study; confirmation of "$10M+ revenue launched"
  (used across discovery files but absent from profile.json).

## Verification

`tsc --noEmit`, `eslint`, `vitest --coverage`, `next build`, local smoke of `/`, `/perspectives`,
`/enterprise-ai-operating-model`.
