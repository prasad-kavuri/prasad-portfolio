---
name: add-demo
description: Add a new production AI demo to the portfolio. Use when the user wants to add a demo, create a new demo page, build a new AI showcase, or wire up a new demo route. Covers both browser demos (WASM/WebGPU) and server demos (Groq API).
---

# Add a New Demo

Read `CONTEXT.md` before starting. Key terms: **browser demo**, **server demo**, **exec model**, **module card**, **demo group**, **guardrail check**, **observability event**.

## Step 0 — Clarify before touching code

Ask (one question at a time, wait for answer):

1. What is the demo `id`? (kebab-case, e.g. `my-new-demo`)
2. Is this a **browser demo** (WASM/WebGPU) or a **server demo** (Groq API)?
3. What **demo group** does it belong to? (`core`, `agentic`, or `apps`)
4. What is the `businessImpact` — one sentence, why this matters to an enterprise AI leader?
5. What is the `businessOutcome` — one sentence, what it *proves* about platform capability?
6. What **exec model** label should the module card show? (Browser WASM / Server API / WebGPU / On-Device AI / Edge + Cloud / Three.js + API)

Do NOT start implementation until all 6 answers are confirmed.

## Step 1 — Add the demo entry to `src/data/demos.ts`

Add a new entry to the `demos` array. Required fields:
- `id`, `emoji`, `title`, `description`, `businessImpact`, `businessOutcome`
- `href: "/demos/<id>"`
- `tags: string[]` (3-6 tags)
- `status: "live"`
- `mobileConfig` (see existing entries for shape)

For **browser demos**: set `executionProfile: 'heavy-local'`, `supportsOffline: true/false`, `fallbackMode: 'simulated'`, `cloudFallbackRoute: null`.
For **server demos**: set `executionProfile: 'cloud-preferred'`, `supportsOffline: false`, `fallbackMode: 'cloud'`, `cloudFallbackRoute: '/api/<id>'`.

## Step 2 — Register in both display components

**AITools** (homepage grid) — add the demo `id` to the correct `DEMO_GROUPS` array in `src/components/sections/AITools.tsx`.

**DemosGallery** (demos page) — add the demo `id` to the correct `ids` array in the `GROUPS` const in `src/components/sections/DemosGallery.tsx`, and add an entry to `EXEC_MODEL` and `DEMO_ICONS`.

Both registrations are required. Missing one means the demo is silently skipped in that view.

## Step 3 — Create the demo page

Create `src/app/demos/<id>/page.tsx`.

Required:
- `'use client'` at top
- Export `metadata` (title, description, canonical)
- Named export for the page component (no default export — see ADR-0002)

**For browser demos**:
```typescript
const { shouldUseAI, isMobile } = useBrowserAI(/* true if WebGPU required */);
if (!shouldUseAI) return <BrowserAIWarning isMobile={isMobile} />;
```

**For server demos**: no `useBrowserAI` needed.

## Step 4 — Create the API route (server demos only)

Create `src/app/api/<id>/route.ts`.

Every server demo route must include all four of these — no exceptions (see ADR-0001):

```typescript
// 1. Rate limiting
const rateLimitResult = await enforceRateLimit(request, '<id>');
if (!rateLimitResult.success) return jsonError('Rate limit exceeded', 429);

// 2. Guardrail check
const guardrailResult = await enforceGuardrails(input);
if (!guardrailResult.safe) return jsonError(guardrailResult.reason, 400);

// 3. Observability — start timer
const timer = startTimer();

// ... do the LLM call ...

// 4. Observability — log event
logAPIEvent({ route: '<id>', duration: timer(), tokens: tokenCount });
```

## Step 5 — Write the unit test

Create `src/__tests__/components/<PascalCaseName>Page.test.tsx` or `src/__tests__/app/<id>.test.tsx`.

Follow the pattern in `src/__tests__/components/AITools.test.tsx`:
- `vi.mock('next/link', ...)` 
- `vi.mock('@/data/demos', ...)` with minimal demo objects
- `vi.mock('@/lib/analytics', ...)`
- Use `render(<Component />)` and RTL assertions
- Test: page renders, key copy appears, CTAs link correctly

## Step 6 — Verify

```bash
npx tsc --noEmit                        # zero errors required
npm run lint                            # zero lint errors
node -e "require('./src/data/demos')"   # demos.ts loads without error
```

Check:
- [ ] Demo entry in `demos.ts`
- [ ] `id` added to `DEMO_GROUPS` in `AITools.tsx`
- [ ] `id` added to `GROUPS`, `EXEC_MODEL`, and `DEMO_ICONS` in `DemosGallery.tsx`
- [ ] Page at `src/app/demos/<id>/page.tsx` exists
- [ ] API route at `src/app/api/<id>/route.ts` exists (server demos)
- [ ] `useBrowserAI` + `BrowserAIWarning` wired (browser demos)
- [ ] Unit test exists and passes
- [ ] tsc clean
