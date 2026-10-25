# SPEC-0058: Distinguish protocol discovery from the natural-language demo

ai-profile.json currently labels /api/mcp-demo as mcp_endpoint despite explicitly
describing it as not an MCP server. Correct mcp_endpoint to /api/mcp, identify
MCP Streamable HTTP, and expose the JSON question endpoint separately as
natural_language_endpoint. Bump the profile schema version from 1.0 to 1.1
because the previously mislabelled field changes meaning.

Describe Bearer authentication as optional at entry but required with read:profile
for get_achievements. Preserve public get_experience/search_skills access.
Include auth.md guidance on both entries; do not claim OAuth login support.
Keep the natural-language example with its JSON request contract.

Scope: discovery route, tests and spec. No endpoint implementations, scopes,
manifest, identity facts, rate limits or caching behavior change. Clients that
used mcp_endpoint for plain JSON questions must use natural_language_endpoint.
Existing cached discovery responses may remain until their normal expiry.

Verify manifest/server alignment, distinct protocols, public/protected tool
descriptions and demo request shape; run typecheck, lint, coverage, build,
npm audit and API browser regressions. Rollback by reverting this commit.
