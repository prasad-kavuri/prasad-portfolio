# Changelog

All notable changes to this project are documented in this file.

The format is based on Keep a Changelog and this project follows Semantic Versioning.

## [Unreleased]

## [1.0.0] - 2026-04-20

### Added
- Canonical `/demos` index route with collection metadata and structured data.
- Centralized site facts/config module for canonical URL and portfolio-wide metrics.
- Explicit legacy routing policy module for `.html` route canonicalization.
- Metadata layouts for governance, evaluation showcase, and enterprise control plane pages.
- Integration tests for legacy redirect behavior and canonical metadata coverage.
- Release prep docs for first public release.

### Changed
- Unified canonical URLs to `https://www.prasadkavuri.com` across metadata and tracked links.
- Updated homepage CTA hierarchy to emphasize recruiter path, signature system, and demos index.
- Normalized surfaced demo count and key metrics via shared configuration.
- Updated sitemap generation to derive demo entries from `src/data/demos.ts`.
- Refreshed README with durable quality/security posture guidance (removed brittle test-file counts).

### Fixed
- Redirected unknown legacy `.html` routes to canonical `/demos` instead of homepage fallback.
- Corrected non-`www` metadata URLs in demo metadata files.
- Converted `/demos/spatial-simulation` redirect to permanent redirect semantics.
