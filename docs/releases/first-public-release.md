# First Public Release Notes Template

Release tag: `v1.0.0`  
Release date: `<YYYY-MM-DD>`

## Summary

Production-grade AI engineering portfolio platform with unified governance controls, canonical routing, and discoverability hardening.

## Highlights

- Canonical demo index and legacy route cleanup
- Shared governance architecture across all demos
- Structured metadata improvements (SEO + JSON-LD)
- Recruiter-focused top-path improvements on homepage
- Strong testing and security posture with CI quality gates

## Notable Technical Details

- Next.js 16.2.3 App Router + Turbopack
- Centralized AI controls in `src/lib/` (guardrails, evals, drift, observability, rate limits)
- Canonical host: `https://www.prasadkavuri.com`
- Legacy `.html` routes redirected to canonical modern routes

## Verification Checklist

- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] `npm audit --audit-level=high`

## Migration / Compatibility Notes

- Legacy `.html` demo links are permanently redirected.
- Canonical demo discovery path is `/demos`.
