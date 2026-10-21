# SPEC-0045: A Claude plugin and marketplace for the portfolio

**Status**: Implemented (pending the PR's own CI run)
**Date**: 2026-10-21

## What

- `.claude-plugin/marketplace.json` (marketplace `prasad-kavuri`) listing one plugin, `prasad-profile`.
- `plugins/prasad-profile/`: a manifest, an MCP connector to the public profile server, and one skill, `evaluate-fit`.
- The repo's existing root plugin manifest is fixed (it was invalid) and stays out of the marketplace.
- The skill scan now covers `plugins/*/skills/*`; the unit tests also check the marketplace and plugin manifests.
- `docs/PLUGIN.md`, a README install block, and one line each in `llms.txt` and `llms-full.txt`.

## Why

Anthropic's `knowledge-work-plugins` repository shows the packaging pattern: skills, commands and connectors in
files. The portfolio already had the parts (a real MCP server, skills, a scan gate). A visitor plugin lets a recruiter
or agent use the profile inside their own Claude, which demonstrates MCP, skills and plugin packaging together.

## Findings that shaped it

- The existing `.claude-plugin/plugin.json` failed `claude plugin validate` (`skills: Invalid input`): it listed skills
  as `{name, path}` objects, but the manifest accepts only paths and scans `skills/` by default. Fixed by removing the
  key (version 1.0.1).
- Components must sit at the plugin root and paths must stay inside it, so the visitor plugin lives in its own folder
  rather than pointing into the maintainer skills.
- The validator (Claude Code 2.1.306) passes the marketplace and the plugin; a local add and install worked, and
  `claude plugin details` lists the skill and the MCP server.
- The live server answered initialize, tools/list and tools/call, and `get_achievements` is denied without a credential,
  as the skill's text says.

## Decisions

- Visitor plugin only in the marketplace; the maintainer skills are not offered to visitors.
- No credential in the plugin (a test forbids headers or env values in the connector).
- No `license` set: that is a legal choice for the owner, and it only matters for Anthropic's directory.
- `evaluate-fit` makes no claims beyond tool results and says where the profile is silent; it never ranks candidates.
- Skills are discovered, not listed, in the root manifest (no custom `skills` array).

## Limits

Claude Code users only. The `github` shorthand for `marketplace add` works only after this is merged to main; it is
checked after merge. The Anthropic directory needs a licence and an icon.

## Verification

25 unit tests; `claude plugin validate` on the repo, the plugin and the marketplace; local add/install; workflow
linted with actionlint. After merge: ten SkillSpector jobs plus `SkillSpector Scan` green, and a fresh
`claude plugin marketplace add prasad-kavuri/prasad-portfolio` followed by install.

## Rollback

Revert the pull request. Users who installed keep a copy until they remove it.
