---
name: redesign-portfolio
description: Complete Claude-native workflow for adding or redesigning a portfolio section. Covers component build, accessibility, security integration, tests, SEO/JSON-LD update, llms.txt sync, and PR summary. Use when the user wants to redesign a section, add a new UI section, update the visual design of existing components, or overhaul a page.
---

# Redesign Portfolio Section

Read `CONTEXT.md` before starting. Key terms: **accent brand**, **layer**, **featured role**, **module card**, **executive summary**, **agentic-seo**, **recruiter experience**, **profile fact**.

## Step 0 — Clarify before touching code

Ask one at a time, wait for answer:

1. Which section / component is being redesigned? (Hero, AIArchitecture, Experience, DemosGallery, Navbar, Footer, a demo page, or new?)
2. What is the visual or structural goal? (Examples: "add a metric ticker", "collapse mobile nav", "add a new tab group")
3. Does this change the recruiter experience path (see `CONTEXT.md`)? If yes, confirm the path still works end-to-end.
4. Are there executive summary implications — i.e. does this change what a VP sees above the fold?

Do NOT start implementation until answers 1 and 2 are confirmed.

## Step 1 — Plan (state before editing)

Write the agent operating contract:
- **Assumptions**: state what you believe is true
- **Scope**: what is in and out of scope
- **Files to change**: smallest expected set
- **Verification commands**: exact `npm` commands that prove it works
- **Rollback**: git sha or description of how to revert if needed

## Step 2 — Component implementation

Conventions (all mandatory — see ADR-0002, ADR-0010):
- Named exports only (`export function`, `export const`) — no `export default` except page files
- Tailwind utilities only — no custom CSS, no styled-components
- **accent brand** color via `style={{ color: 'var(--accent-brand)' }}` — never Tailwind arbitrary value
- Functional components — no class components, no Redux, no Zustand
- `FadeUp` from `@/components/ui/motion` for entrance animations
- `trackEvent` from `@/lib/analytics` for any interactive element
- `aria-label`, `aria-expanded`, `aria-pressed` on all interactive elements
- No `dangerouslySetInnerHTML` on LLM output — use `{text}` text nodes

For browser demos: wire `useBrowserAI` hook and `BrowserAIWarning`. See ADR-0004.
For server demos: wire `enforceRateLimit`, `enforceGuardrails`, `startTimer`, `logAPIEvent`. See ADR-0001.

## Step 3 — Accessibility check

For every interactive element added:
- [ ] `aria-label` or visible text label present
- [ ] Keyboard-navigable (Tab / Enter / Space)
- [ ] Focus ring visible (Tailwind `focus:ring-2` or equivalent)
- [ ] Color contrast ≥ 4.5:1 for normal text, 3:1 for large text
- [ ] `aria-expanded` on toggles, `aria-pressed` on filter buttons

Run: `npm run test:e2e -- --grep "accessibility"` to check automated axe assertions.

## Step 4 — Unit test

Create or update `src/__tests__/components/<ComponentName>.test.tsx`.

Required test cases:
- [ ] Component renders without throwing
- [ ] Heading / key copy appears in the DOM
- [ ] Interactive elements have correct ARIA attributes (initial state)
- [ ] CTA links point to correct `href`
- [ ] `trackEvent` is called on interaction (mock `@/lib/analytics`)

Mock pattern:
```typescript
vi.mock('@/components/ui/motion', () => ({
  FadeUp: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));
vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));
```

## Step 5 — SEO & structured data update

If the change adds, removes, or renames a page or major section:
- [ ] Update `src/app/layout.tsx`: `metadata.description`, `metadata.keywords`
- [ ] Update JSON-LD `@graph`: add/remove `SoftwareApplication` or `WebPage` entity
- [ ] Update `speakable.cssSelector` array if a new section id is added
- [ ] If a new demo: add `SoftwareApplication` entity (see ADR-0007)

## Step 6 — llms.txt + ai-agent-manifest sync

If profile facts, demo count, or headline metrics changed:
- [ ] Update `public/llms.txt`: `VERIFIED IMPACT METRICS`, `AI DEMOS` list, `WHAT'S NEW`
- [ ] Update `public/.well-known/ai-agent-manifest.json`: metrics object, new_in sections
- [ ] Validate manifest: `node -e "JSON.parse(require('fs').readFileSync('public/.well-known/ai-agent-manifest.json','utf8'))"`

See ADR-0006 for llms.txt ownership rules.

## Step 7 — Verify

```bash
npx tsc --noEmit                   # zero TypeScript errors
npm run lint                       # zero lint errors
npm run test                       # all unit tests pass
npm run build                      # production build succeeds
npm audit --audit-level=high       # 0 high/critical vulnerabilities
```

Optional (requires built server):
```bash
npm run test:e2e                   # Playwright smoke tests pass
```

## Step 8 — PR summary

Write a one-paragraph commit message:
- What changed (component name, section name)
- Why (recruiter signal, executive readiness, accessibility gap, SEO gap)
- What was verified (tsc, lint, tests, build)

Format: `feat(ui): <section> — <one-line description>`

Example: `feat(ui): DemosGallery — product module card grid with exec-model badges and filter tabs`
