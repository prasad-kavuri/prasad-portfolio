# ADR-0002: Named exports only — no default exports from components or libs

**Status**: Accepted  
**Date**: 2026-06

## Context

Next.js page files require `export default`. Every other file in the codebase — components, hooks, lib utilities — could use either named or default exports. The choice affects import ergonomics, tree-shaking, refactoring safety, and IDE tooling.

## Decision

All components, hooks, and lib modules use named exports (`export function Foo`, `export const bar`). The only default exports permitted are Next.js page and layout files where the framework requires it.

## Alternatives considered

- **Default exports everywhere** (common React convention): Allows `import Foo from './Foo'` with any local name. Rejected because rename refactors silently break — the import name drifts from the export name with no compiler error.
- **Mixed (default for components, named for utils)**: Common in many codebases. Rejected for consistency — a single rule is easier to enforce and lint.

## Consequences

- `import { AIArchitecture } from '@/components/sections/AIArchitecture'` — always the pattern.
- ESLint `import/no-default-export` rule enforces this (except for pages/layouts).
- Any new component or hook must use `export function` or `export const`, not `export default`.
