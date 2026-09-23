/**
 * Per-tool authorization for the profile query tools (SPEC-0020).
 *
 * Default deny: a tool that is not in the policy table is never executed. Each allowed tool
 * declares the scope a caller's credential must carry; `null` means callable without a credential.
 * Credentials come from the auth.md flow (/demos/agent-auth), which issues `read:profile`.
 */
export interface ToolPolicy {
  requiredScope: string | null;
  description: string;
}

export const TOOL_POLICIES: Record<string, ToolPolicy> = {
  get_experience: { requiredScope: null, description: 'Public work history' },
  search_skills: { requiredScope: null, description: 'Public skills catalog' },
  get_achievements: { requiredScope: 'read:profile', description: 'Quantified impact metrics — requires an agent credential' },
};

export type ToolAuthorization =
  | { allowed: true }
  | { allowed: false; reason: 'unknown_tool' | 'missing_scope'; requiredScope?: string };

export function authorizeToolCall(toolName: string, callerScopes: readonly string[] | null): ToolAuthorization {
  if (!Object.prototype.hasOwnProperty.call(TOOL_POLICIES, toolName)) {
    return { allowed: false, reason: 'unknown_tool' };
  }
  const { requiredScope } = TOOL_POLICIES[toolName];
  if (requiredScope && !(callerScopes ?? []).includes(requiredScope)) {
    return { allowed: false, reason: 'missing_scope', requiredScope };
  }
  return { allowed: true };
}

export function deniedToolResult(toolName: string, auth: Exclude<ToolAuthorization, { allowed: true }>): string {
  if (auth.reason === 'unknown_tool') return 'Tool not found';
  return `Access denied: ${toolName} requires the ${auth.requiredScope} scope. Obtain an agent credential via https://www.prasadkavuri.com/auth.md and send it as a Bearer token.`;
}
