/**
 * Per-tool authorization (SPEC-0020, extended in SPEC-0021).
 *
 * Default deny: a tool that is not in the policy table is never executed. Each allowed tool
 * declares the scope a caller's credential must carry (`null` means callable without a
 * credential) and whether it additionally needs a recorded human approval before it can run.
 * Credentials come from the auth.md flow (/demos/agent-auth).
 */
export interface ToolPolicy {
  requiredScope: string | null;
  /** Consequential actions also require a server-recorded approval reference. */
  requiresApproval?: boolean;
  description: string;
}

/** Read-only profile tools (natural-language demo, MCP server, A2A profile skill). */
export const TOOL_POLICIES: Record<string, ToolPolicy> = {
  get_experience: { requiredScope: null, description: 'Public work history' },
  search_skills: { requiredScope: null, description: 'Public skills catalog' },
  get_achievements: { requiredScope: 'read:profile', description: 'Quantified impact metrics — requires an agent credential' },
};

/** Synthetic finance-operations tools used by the flagship payment-exception agent. */
export const FINANCE_TOOL_POLICIES: Record<string, ToolPolicy> = {
  lookup_vendor: { requiredScope: 'finance:sandbox', description: 'Read a (fictional) vendor record' },
  check_duplicate_payment: { requiredScope: 'finance:sandbox', description: 'Check whether an invoice was already paid' },
  get_payment_policy: { requiredScope: 'finance:sandbox', description: 'Read the approval threshold for a spend category' },
  release_payment: {
    requiredScope: 'payments:release',
    requiresApproval: true,
    description: 'Release a payment — the agent acts under its own authority and only with a recorded approval above threshold',
  },
};

export type ToolAuthorization =
  | { allowed: true }
  | { allowed: false; reason: 'unknown_tool' | 'missing_scope' | 'approval_required'; requiredScope?: string };

export interface AuthorizeOptions {
  policies?: Record<string, ToolPolicy>;
  /** Id of a server-recorded approval, required for tools with `requiresApproval`. */
  approvalRef?: string | null;
}

export function authorizeToolCall(
  toolName: string,
  callerScopes: readonly string[] | null,
  options: AuthorizeOptions = {},
): ToolAuthorization {
  const policies = options.policies ?? TOOL_POLICIES;
  if (!Object.prototype.hasOwnProperty.call(policies, toolName)) {
    return { allowed: false, reason: 'unknown_tool' };
  }
  const { requiredScope, requiresApproval } = policies[toolName];
  if (requiredScope && !(callerScopes ?? []).includes(requiredScope)) {
    return { allowed: false, reason: 'missing_scope', requiredScope };
  }
  if (requiresApproval && !options.approvalRef) {
    return { allowed: false, reason: 'approval_required' };
  }
  return { allowed: true };
}

export function deniedToolResult(toolName: string, auth: Exclude<ToolAuthorization, { allowed: true }>): string {
  if (auth.reason === 'unknown_tool') return 'Tool not found';
  if (auth.reason === 'approval_required') return `Access denied: ${toolName} requires a recorded human approval.`;
  return `Access denied: ${toolName} requires the ${auth.requiredScope} scope. Obtain an agent credential via https://www.prasadkavuri.com/auth.md and send it as a Bearer token.`;
}
