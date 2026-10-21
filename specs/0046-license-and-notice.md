# SPEC-0046: MIT licence for the code, profile content reserved

**Status**: Implemented (pending the PR's own CI run)
**Date**: 2026-10-21

## What

`LICENSE` (MIT, copyright 2026 Prasad Kavuri), `NOTICE` (the licence covers source code; profile and personal content
stays all rights reserved), `license: "MIT"` in `package.json` and both plugin manifests, and a short README section.
A unit test keeps the files and manifests in agreement.

## Why

The repository was public with no licence, which legally means nobody could reuse the code, and the plugin directory
validator flagged `LICENSE_MISSING`. The owner chose MIT for code and to keep profile content reserved.

## Decisions

- Made by the owner (chosen from MIT, Apache-2.0 or no licence). This is not legal advice.
- The split (code versus content) is stated in `NOTICE` in plain words with example paths; it describes intent and does
  not list every file.
- No change to the application, dependencies or deployment.

## Verification

Unit tests; `claude plugin validate` no longer reports `LICENSE_MISSING` for either plugin.

## Rollback

Revert the pull request. Anyone who received the code while it was MIT-licensed keeps that grant for that copy.
