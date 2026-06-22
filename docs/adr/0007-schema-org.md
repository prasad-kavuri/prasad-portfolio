# ADR-0007: JSON-LD uses a single @graph with multiple typed entities

**Status**: Accepted  
**Date**: 2026-06

## Context

Search engines (Google, Bing) and LLM crawlers use structured data to build knowledge
graphs about people, products, and sites. There are two common JSON-LD patterns:
(1) one `<script type="application/ld+json">` per page per entity type, or (2) a single
`@graph` array containing all entities.

## Decision

All JSON-LD lives in a single `<script type="application/ld+json">` tag in
`src/app/layout.tsx` with a `@graph` array. The graph currently includes:
- `Person` — Prasad Kavuri identity node
- `WebSite` — site-level entity with `potentialAction` SearchAction
- `CollectionPage` — for the `/demos` route
- `SoftwareApplication` — one entity per demo (15 entities)
- `WebPage` — for the root URL

All entities use `@id` values of the form `https://www.prasadkavuri.com/#<type>`.

## Alternatives considered

- **One script per page in each page.tsx**: Lets page-level metadata be co-located with
  the page. Rejected because the majority of entities (Person, demos) apply site-wide
  and would need to be duplicated or imported into every page file — high maintenance
  surface.
- **Separate script per entity type**: E.g. Person in one tag, SoftwareApplication in
  another. Rejected because Google's structured data guidelines favor a single coherent
  graph over fragmented blocks — the rich result validator produces fewer errors with
  a unified graph.
- **No JSON-LD, rely on OpenGraph only**: OG tags are for social sharing previews, not
  knowledge graph indexing. Rejected because OG alone does not enable Google's AI
  Overviews or ChatGPT browse enrichment for entity recognition.

## Consequences

- Adding a new demo requires a new `SoftwareApplication` entity in `layout.tsx`
  (documented in `add-demo` skill Step 0 checklist).
- Changing `profile.personal.title` in `profile.json` requires updating the `jobTitle`
  field in the `Person` entity in `layout.tsx` — these are not auto-synced.
- Validate after any JSON-LD edit: `node -e "JSON.parse(require('fs').readFileSync('src/app/layout.tsx','utf8').match(/<script.*?>([\s\S]*?)<\/script>/)?.[1] ?? '')"`
  (or use Google Rich Results Test).
- `SameAs` links on the `Person` entity (LinkedIn, GitHub) must use HTTPS and match the
  user's actual profile URLs.
