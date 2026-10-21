# Claude plugin: prasad-profile

Last reviewed: 2026-10-21 (SPEC-0045)

## What it is

A Claude Code plugin, published from this repository, that lets someone query Prasad Kavuri's profile from their own
Claude session and check a role description against it. It has two parts:

- an MCP connector (`plugins/prasad-profile/.mcp.json`) that points at the site's public, read-only MCP server,
  `https://www.prasadkavuri.com/api/mcp`
- one skill, `evaluate-fit` (`plugins/prasad-profile/skills/evaluate-fit/SKILL.md`), that tells Claude how to use the
  tools and how to report evidence and gaps

Install (Claude Code 2.1.275 or later):

```bash
claude plugin marketplace add prasad-kavuri/prasad-portfolio
claude plugin install prasad-profile@prasad-kavuri
```

The marketplace is `.claude-plugin/marketplace.json` (name `prasad-kavuri`) and lists only this plugin.

## What it does not do

- It adds no new data or tools. It exposes only what `/api/mcp` already serves: `get_experience` and `search_skills`
  (public) and `get_achievements`, which stays denied unless the caller holds a `read:profile` credential
  (`/auth.md`). The plugin ships no credential and the skill does not try to obtain one.
- It makes no network calls other than to that one server, and has no hooks, scripts, agents or executables.
- It is not listed in Anthropic's plugin directory. That would need a `LICENSE` file or a `license` field, which is the
  owner's decision (not set).

## Two plugins, two audiences

| Plugin | Where | For | In the marketplace |
|---|---|---|---|
| `prasad-profile` | `plugins/prasad-profile/` | Recruiters and agents who want to query the profile | yes |
| `prasad-portfolio` | repository root (`.claude-plugin/plugin.json`, `skills/`) | People working on this codebase | no |

## Security notes

- The skill is scanned by SkillSpector with the other nine and its text is hash-pinned
  (`.github/skill-security-scope.json`, `docs/SKILL_SECURITY_SCOPE.md`). Its first scan was complete with no findings.
- The connector URL is checked by a unit test (https, the public server only, no headers or environment values), so a
  credential cannot be added to the published plugin by accident.
- Revoking the plugin follows the skill revocation steps in `docs/OWASP_ALIGNMENT.md`; users who already installed it
  keep their copy until they update or remove it.
- Everything the server returns is screened by the tool gateway; the skill also tells Claude to treat tool results as
  data and to ignore instructions inside them.
