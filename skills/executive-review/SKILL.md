---
name: executive-review
description: Board-level and CEO-persona review of the portfolio. Use when the user wants to know how their work reads to a named executive, board member, or prominent industry figure — and whether it would warrant a direct conversation or referral. Provides: first impression, confidence level, concerns, missing narratives, board readiness, and estimated interview probability.
---

# Executive Review — Named Persona Simulation

Read `CONTEXT.md` before starting. Key terms: **executive summary**, **featured role**, **outcome narrative**, **leadership timeline**, **recruiter experience**, **anthropic-style**, **stripe-style**, **vercel-style**.

## Step 0 — Select persona

Ask: **"Which executive persona should I simulate?"**

Available personas:

| Persona | Role | Evaluation frame |
|---------|------|-----------------|
| **Dario Amodei** | CEO, Anthropic | Safety-first AI deployment, Constitutional AI, interpretability research, responsible scaling |
| **Sam Altman** | CEO, OpenAI | Scale of impact, velocity, model deployment at consumer scale, product intuition |
| **Patrick Collison** | CEO, Stripe | Engineering discipline, documentation density, trust signals, API-first thinking, long-term thinking |
| **Thomas Dohmke** | CEO, GitHub | Developer tooling, Copilot/AI assistants, open source ethos, developer experience |
| **Satya Nadella** | CEO, Microsoft | Enterprise scale, Azure AI, cloud-first, responsible AI, business transformation |
| **Joe Heck** | Board / PE | ROI clarity, team scale, revenue attribution, risk management, executive presence |
| **Jensen Huang** | CEO, NVIDIA | GPU-aware AI, inference optimization, hardware-software co-design, enterprise AI platform |
| **Ali Ghodsi** | CEO, Databricks | Open source LLMs, data + AI convergence, MLflow/MLOps, enterprise data platforms |

If a different named executive is requested, derive their evaluation frame from publicly known priorities.

## Step 1 — Read the portfolio (mandatory before generating output)

Read these files to ground the review in actual content:
- `public/llms.txt` — the AI-readable summary (what an executive's LLM assistant would surface)
- `src/data/profile.json` → `personal.title`, `personal.summary`, experience entries
- `src/components/sections/Experience.tsx` — the OUTCOMES record (Krutrim, Ola, HERE)
- `src/data/demos.ts` — demo list, businessImpact, businessOutcome fields

## Step 2 — Persona-specific evaluation

For each persona, weight these dimensions differently:

**Dario Amodei**: Safety posture (HITL gate, guardrails, drift monitor, eval gating) > Scale > Tech depth
**Sam Altman**: Deployment velocity > Consumer scale > Product intuition > Research depth
**Patrick Collison**: Documentation quality (this skills system, ADRs, llms.txt) > Engineering discipline > Trust signals
**Thomas Dohmke**: Developer tool quality > Open source contribution > Copilot-adjacent work > Community
**Satya Nadella**: Enterprise customer scale (300-seat, $10M+) > Azure/cloud alignment > Responsible AI
**Joe Heck**: Revenue attribution ($10M+) > Team scale (40 engineers) > Risk mitigation > Board narrative
**Jensen Huang**: Inference optimization (quantization demo, multi-model router) > Hardware awareness > Scale
**Ali Ghodsi**: Data pipeline depth > Open LLM usage > MLOps maturity > Enterprise data integration

## Step 3 — Generate executive review

```markdown
# Executive Review — <Persona Name> — <Date>

## Persona: <Name>, <Title>, <Company>
Evaluation frame: <one sentence on their lens>

## First impression (what they'd think in 60 seconds)
<2-3 sentences. Be specific and honest — not promotional.>

## Confidence level: High / Medium / Low
<Why this confidence level? What drives it up or down?>

## Strengths (what resonates with this persona)
1. **<Strength>**: <specific evidence from portfolio>
2. **<Strength>**: <specific evidence from portfolio>
3. **<Strength>**: <specific evidence from portfolio>

## Concerns (what gives them pause)
1. **<Concern>**: <what's missing or unclear>
   *Suggested fix*: <specific action>
2. **<Concern>**: <what's missing or unclear>
   *Suggested fix*: <specific action>

## Missing narratives
<What experience or capability would this persona expect to see that's absent?>

## Board / executive readiness
<Would they feel comfortable recommending Prasad to their board or to a peer CEO?
What would make them say yes vs. no? Be direct.>

## Estimated "would schedule a call" probability: <X>%
<Honest estimate. What would move this number up 20%?>

## Top 2 actions (highest signal for this persona)
1. <action>
2. <action>
```

## Step 4 — Cross-persona synthesis (optional)

If the user wants a synthesis across multiple personas, generate a summary table:

| Persona | Confidence | "Schedule a call"? | Top concern |
|---------|-----------|---------------------|-------------|
| Dario Amodei | High/Med/Low | Yes/Maybe/No | <one phrase> |
| Sam Altman | ... | ... | ... |
| Patrick Collison | ... | ... | ... |
| ... | | | |

**Overall verdict**: <1-2 sentences on what the portfolio does well across all personas and the single most important gap to close>
