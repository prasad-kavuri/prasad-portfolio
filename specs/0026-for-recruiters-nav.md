# SPEC-0026: Add "For Recruiters" to the primary nav

**Status**: Implemented
**Date**: 2026-10-12

## What

Add a "For Recruiters" link to the header nav (desktop and mobile drawer), between "About & Contact"
and "Resume". The executive-first order from SPEC-0022 is unchanged: Leadership, Operating Model,
Platform, Perspectives and About & Contact still come first.

## Why

SPEC-0022 kept the page out of the nav and left it in the footer. A review of the site (Oct 2026)
found that the recruiter page, which holds the verified metrics and booking link, was reachable only
from the footer, while recruiters and hiring managers are the main audience. The leadership-first
framing is kept by placement: the link is last before the resume, as plain text, not a button.

## Verification

`executive-layer.test.ts` asserts the relative order of the executive items and that "For Recruiters"
sits between "About & Contact" and "Resume". The mobile drawer picks the link up from the same list.

Not verified in a browser: the desktop nav now holds seven items at the `lg` breakpoint (1024px). Check the
Vercel preview at 1024px and 1100px for wrapping or overflow before merging; if it is tight, move the
breakpoint to `xl` for the inline nav.
