# ADR-0010: shadcn/ui is not used — Tailwind utilities only

**Status**: Accepted  
**Date**: 2026-06

## Context

shadcn/ui is a popular component library that provides accessible, composable React
components (Button, Dialog, Card, etc.) using Radix UI primitives and Tailwind classes.
Many Next.js/Tailwind projects adopt it to reduce component boilerplate.

## Decision

This portfolio uses only Tailwind CSS utilities for styling — no shadcn/ui, no Radix UI,
no Headless UI, no styled-components. All UI components are written from scratch as named
functional exports in `src/components/`.

## Alternatives considered

- **shadcn/ui**: Excellent accessibility primitives (ARIA, keyboard nav, focus traps).
  Rejected for two reasons: (1) shadcn/ui's component copy-paste model requires each
  component to be downloaded into the repo and maintained — adding friction to
  TypeScript 6 and Tailwind 4 upgrades; (2) the portfolio's visual identity is intentional
  and distinctive — generic shadcn card/button aesthetics would dilute it.
- **Radix UI primitives only (no shadcn)**: Gives accessibility without visual opinion.
  Evaluated. Rejected because the portfolio's interactive surface is small (a few toggles,
  filter buttons, one chat input) — rolling our own accessible components for this surface
  is tractable and keeps the bundle smaller.
- **Mantine or Chakra UI**: Full component libraries with theme systems. Rejected because
  they require a Provider wrapper and add significant CSS-in-JS or CSS module overhead
  incompatible with Tailwind 4's Oxide engine.

## Consequences

- All interactive components (`FadeUp`, `BrowserAIWarning`, layer toggle buttons, filter
  chips) must implement ARIA attributes manually (`aria-expanded`, `aria-pressed`,
  `aria-label`, `role`).
- Accessibility regression risk is higher — compensated by Playwright axe-core checks and
  manual a11y tests in the security-review skill.
- Adding shadcn/ui in the future is not blocked, but any PR doing so must: add the shadcn
  init config, audit for TypeScript 6 compat, add `@radix-ui` to the CSP `script-src`
  if any Radix portal scripts are used, and update this ADR.
- New components follow the naming and export conventions in ADR-0002 (named exports).
