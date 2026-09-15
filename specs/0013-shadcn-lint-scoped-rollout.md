# SPEC-0013: Scoped @shadcn/lint rollout for the design system

**Status**: Implemented
**Date**: 2026-09-15

## What

Add `@shadcn/lint` (github.com/shadcn-ui/lint) as a dev dependency and wire it into
`eslint.config.mjs`, scoped to `src/components/ui/**` (the actual reusable component library —
button, card, badge, avatar, progress, separator, linkedin-cta, telemetry-disclosure) plus
`src/components/sections/Contact.tsx` (the one caller found restyling a `ui/` component).
`shadcn/no-restyle` and `shadcn/no-arbitrary-values` are `error`; `shadcn/no-inline-styles` and
`shadcn/require-static-classes` are `error` for `ui/**` only. Not applied elsewhere in `src/`.

Real violations fixed (not just silenced):
- `badge.tsx`: `focus-visible:ring-[3px]` → `focus-visible:ring-3` (matches the scale-token
  convention `button.tsx` already uses for the same 3px ring — this was a genuine inconsistency,
  zero visual change).
- `badge.tsx` + `telemetry-disclosure.tsx`: added a `warning` variant to `Badge` (identical amber
  colors to what was previously inlined) and switched `telemetry-disclosure.tsx` to
  `variant="warning"` instead of overriding `Badge`'s color classes directly — the exact violation
  the rule is designed to catch, fixed the way it's designed to be fixed.
- `card.tsx`: added an `interactive` boolean prop (adds `transition-shadow hover:shadow-md` when
  set) and switched `Contact.tsx`'s three link-wrapped cards to `<Card interactive>` instead of
  restyling `<Card>` directly with the same classes three times — additive, defaults to `false`,
  zero effect on any of the other ~40 existing `Card` usages elsewhere in the codebase.

Violations documented as intentional exceptions (via `eslint-disable-next-line` with a reason,
not silently ignored):
- `button.tsx`: `rounded-[min(var(--radius-md),Npx)]` and `text-[0.8rem]` on the `xs`/`sm`/
  `icon-xs`/`icon-sm` size variants — deliberate radius-clamping and an in-between text size, not
  drift.
- `card.tsx`: `grid-cols-[1fr_auto]` / `grid-rows-[auto_auto]` in `CardHeader` — structural grid
  template values, not themeable spacing/color.
- `progress.tsx`: inline `style={{ transform: ... }}` on the indicator — a genuinely dynamic
  runtime value (the progress percentage); no static class can express it.
- `LinkedInCTA.tsx`: `tracking-[0.16em]` — a deliberately tuned eyebrow-label letter-spacing.
- `linkedin-cta.tsx`: `text-[#0A66C2]` — LinkedIn's exact official brand blue; substituting a
  theme token would break brand accuracy.
- `Contact.tsx`: `gap-2 p-4` on the three `CardContent` instances — sizes a tight icon+label row
  differently from `CardContent`'s block-padding default; the rule's own suggested fix (move
  padding to a wrapper) would change the shipped, visually-verified layout for no functional
  benefit, so it's documented rather than "fixed."

Not touched: `no-raw-colors` is not enabled anywhere. The marketing/section pages
(`Architecture.tsx`, `CaseStudies.tsx`, `Transformation.tsx`, `DemosGallery.tsx`, etc.) use raw
Tailwind palette colors (indigo variants) as a deliberate section-to-section visual accent choice,
not accidental drift — forcing them onto a single theme token risked a visual regression on the
pages recruiters actually evaluate, for no functional gain. The 13 `opengraph-image.tsx` files and
the four browser-WASM/canvas demo pages are excluded entirely — they require inline styles
(Satori/`ImageResponse` rendering, canvas-driven visualizations) and would only produce permanent
false positives.

## Why

User asked me to assess github.com/shadcn-ui/lint for relevance, then — after a read-only trial run
against the full `src/` tree surfaced 2,931 warnings, ~65% of them false positives from
OG-image/canvas files — asked for my recommendation given the portfolio's actual risk profile:
not a production product with user traffic, but a "production public reach out" where the highest
cost is a visual regression on the page recruiters/executives evaluate, not downtime. Recommended
against full-repo enforcement (would mean re-litigating an intentional color/effects design across
15+ marketing files for a rule whose main beneficiary is future agent-driven edits, not human
readers of CI logs) in favor of scoping to the actual small, reusable design-system surface where
the rule's own component-contract logic applies cleanly. User approved the scoped version.

## Scope boundaries

- In scope: `src/components/ui/**`, `Contact.tsx` (the one caller with a real `no-restyle`
  violation), `eslint.config.mjs`, `package.json`, `DESIGN.md` rule 8.
- Out of scope: `no-raw-colors` anywhere; any enforcement on `src/components/sections/**` beyond
  `Contact.tsx`; any enforcement on `src/app/**` (demo pages, OG images); redesigning `Card` with a
  full CVA variant system (the `interactive` prop is a minimal additive prop, not a rewrite).

## Verification

- `npx eslint --config eslint.config.mjs "src/components/ui/**/*.{ts,tsx}" "src/components/sections/Contact.tsx"` → 0 errors, 0 warnings (confirmed in an isolated `/tmp` copy with the dependency installed; see Verification Commands below for the real-repo run the user should do after `npm install`).
- `npx tsc --noEmit` → 0 errors.
- Full `npm run build` and targeted `vitest` run for `Contact`, `Badge`, `Card`, `Progress` — pass.
- Visual check: `Badge`'s `warning` variant renders the identical amber colors `telemetry-disclosure.tsx`
  previously inlined; `Card interactive` renders identical `transition-shadow hover:shadow-md` to
  what `Contact.tsx` previously set directly — both are class-for-class equivalent, not
  approximations, so no visual diff is expected.

## Verification commands (for the person applying this)

```bash
npm install        # picks up @shadcn/lint from the updated package.json/lockfile
npx tsc --noEmit
npm run lint
npm run test
npm run build
```
