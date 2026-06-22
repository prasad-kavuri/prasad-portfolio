---
name: recruiter-review
description: Simulates a recruiter persona review of the portfolio for a specific target company. Use when the user wants feedback on how their portfolio reads to a hiring manager, executive recruiter, or CTO at a specific company. Input is a target company (e.g. OpenAI, Anthropic, Stripe, NVIDIA, Databricks, Zip). Output is strengths, weaknesses, missing keywords, missing demos, and an interview readiness score.
---

# Recruiter Review — Persona Simulation

Read `CONTEXT.md` before starting. Key terms: **recruiter experience**, **recruiter path**, **featured role**, **executive summary**, **leadership timeline**, **signature demo**, **outcome narrative**.

## Step 0 — Clarify

Ask: **"Which company should I simulate the recruiter from?"**

Supported target companies and their evaluation weights:
- **Anthropic** — safety depth, interpretability awareness, Constitutional AI alignment, systems thinking at scale
- **OpenAI** — deployment scale, model fine-tuning experience, RLHF / evals sophistication, product velocity
- **Google DeepMind** — research publications, ML systems, infrastructure scale, multimodal expertise
- **Stripe** — engineering discipline, API design, documentation quality, trust-first thinking, density of signal
- **NVIDIA** — GPU/CUDA proximity, inference optimization, hardware-aware ML, enterprise AI platform
- **Databricks** — data engineering depth, MLflow/MLOps, Spark scale, LLM serving infrastructure
- **Zip** (procurement AI) — AI in enterprise workflows, cost control, vendor management AI, mid-market SaaS
- **Microsoft / GitHub** — developer tooling, Copilot-adjacent, enterprise scale, Azure AI integration

If target company is not in this list, ask for the company's main AI product area and evaluate against those dimensions.

## Step 1 — Read the portfolio

Before writing feedback, read these files:
- `src/data/profile.json` — headline, experience, skills, education
- `public/llms.txt` — the plain-text portfolio as an LLM sees it
- `src/data/demos.ts` — full demo list with businessImpact and businessOutcome fields
- `src/components/sections/Experience.tsx` — featured role outcome narratives (OUTCOMES record)

## Step 2 — Apply persona

### CTO Persona
Evaluating: "Would I trust this person to own our AI platform engineering org?"

Review criteria:
- Does the executive summary show platform thinking (not just model usage)?
- Are team/org scale numbers present? (engineers led, seats automated, scale metrics)
- Is there evidence of independent judgment? (architectural decisions, tradeoffs made)
- Is the AI governance posture mature? (eval gating, drift monitoring, HITL, cost control)

### VP Engineering Persona
Evaluating: "Can this person run a 20-40 person AI engineering team that ships?"

Review criteria:
- Outcome narratives — are metrics concrete (%, $, scale numbers) or vague?
- Is cross-functional leadership visible? (PM, design, data, infra)
- Is there evidence of building teams, not just building systems?
- Tech stack currency — are the right tools present for this company's stack?

### Executive Recruiter Persona
Evaluating: "Can I place this candidate in a VP/Head of AI Engineering role at this company?"

Review criteria:
- Title match: "VP / Head of AI Engineering" — does it pattern-match the target JD level?
- ATS keyword coverage: check the target company's recent VP/Head of AI Engineering JDs and cross-reference keywords
- Notable company names in experience — do they carry signal for this target company?
- Portfolio clarity: Can I explain this person's background in 2 sentences to a hiring committee?

## Step 3 — Generate feedback report

```markdown
# Recruiter Review — <Target Company> — <Date>

## Target role
VP / Head of AI Engineering at <company>

## Persona assessments

### CTO (hiring committee)
**First impression**: <2-3 sentences>
**Confidence level**: High / Medium / Low
**Strengths**:
- <specific strength with evidence from portfolio>
- <specific strength with evidence from portfolio>
**Concerns**:
- <specific gap with suggested fix>
- <specific gap with suggested fix>

### VP Engineering
**First impression**: <2-3 sentences>
**Strengths**: ...
**Concerns**: ...

### Executive Recruiter
**ATS keyword match**: <N>/<total JD keywords checked> keywords present
**Missing keywords**: <list>
**Placement confidence**: High / Medium / Low
**2-sentence pitch**: "<pitch>"

## Missing demos for this company
<list demos that would close signal gaps for this target>

## Missing narratives
<list any experience stories that are absent but relevant>

## Interview readiness score: <X>/10

## Top 3 actions (highest ROI)
1. <action with expected impact>
2. <action with expected impact>
3. <action with expected impact>
```

## Step 4 — Optional: ATS keyword extraction

If the user provides a JD (job description), extract keywords and cross-reference:

```bash
# Paste JD text into a file, then check coverage
# Key sections to check: profile.json skills array, llms.txt, demos.ts tags
```

Common VP/Head of AI Engineering keywords to check (varies by company):
- LLM infrastructure, inference optimization, RAG, vector search, agent orchestration
- ML platform, MLOps, model evaluation, RLHF, Constitutional AI
- Enterprise AI, cost control, observability, safety, governance
- Cross-functional leadership, roadmap, stakeholder management
- Python, TypeScript, Kubernetes, PyTorch, vLLM, Triton
