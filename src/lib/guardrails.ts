/**
 * Guardrails — input/output safety checks and agent handoff validation.
 *
 * Used by all AI routes to enforce:
 *  - Prompt injection resistance
 *  - Output content policy (no PII leakage, no hallucinated credentials)
 *  - Agent handoff precondition checks
 */

export interface GuardrailResult {
  allowed: boolean;
  reason?: string;
  matchedPattern?: string;
}

// ---------------------------------------------------------------------------
// Injection patterns — ordered from most specific to most general
// ---------------------------------------------------------------------------
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|context)/i,
  /forget\s+(everything|all|your\s+instructions)/i,
  /you\s+are\s+(now|actually)\s+(a|an)\s+/i,
  /act\s+as\s+(if\s+you\s+(are|were)\s+)?(a|an)\s+/i,
  /\[system\]/i,
  /<<SYS>>/i,
  /\[INST\]/i,
  /reveal\s+(the\s+)?(system\s+prompt|instructions?|context|api\s+key)/i,
  /print\s+(the\s+)?(system\s+prompt|instructions?)/i,
  /what\s+(are|were)\s+your\s+(exact\s+)?instructions/i,
  /override\s+(safety|content|policy|filter)/i,
  /bypass\s+(filter|safety|policy|guardrail)/i,
  /jailbreak/i,
  /DAN\s+mode/i,
  /developer\s+mode\s+(enabled|on)/i,
];

// ---------------------------------------------------------------------------
// Output blocklist — patterns that must never appear in LLM responses
// ---------------------------------------------------------------------------
const OUTPUT_BLOCKLIST: RegExp[] = [
  // API keys / secrets
  /sk-[a-zA-Z0-9]{20,}/,
  /gsk_[a-zA-Z0-9]{20,}/,
  /GROQ_API_KEY\s*=\s*\S+/i,
  /ANTHROPIC_API_KEY\s*=\s*\S+/i,
  // System internals
  /COMPLETE PROFILE:/i,
  /knowledgeBase\[/,
  // Credential-like strings
  /Bearer\s+[a-zA-Z0-9._-]{20,}/,
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Check a user-supplied input string for injection attempts. */
export function checkInput(input: string): GuardrailResult {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return { allowed: false, reason: 'prompt_injection', matchedPattern: pattern.source };
    }
  }
  return { allowed: true };
}

/** Check LLM output for policy violations before forwarding to the client. */
export function checkOutput(output: string): GuardrailResult {
  for (const pattern of OUTPUT_BLOCKLIST) {
    if (pattern.test(output)) {
      return { allowed: false, reason: 'output_policy_violation', matchedPattern: pattern.source };
    }
  }
  return { allowed: true };
}

/**
 * Validate preconditions for agent-to-agent handoffs.
 * Ensures the upstream agent produced non-empty, non-error output before
 * passing work to the next agent.
 */
export function validateAgentHandoff(
  fromAgent: string,
  output: string,
  options: { minLength?: number } = {}
): GuardrailResult {
  const minLength = options.minLength ?? 20;

  if (!output || output.trim().length === 0) {
    return { allowed: false, reason: `${fromAgent} produced empty output` };
  }
  if (output.trim().length < minLength) {
    return { allowed: false, reason: `${fromAgent} output too short (${output.trim().length} < ${minLength})` };
  }
  if (/^\s*(error|failed|undefined|null)\s*$/i.test(output.trim())) {
    return { allowed: false, reason: `${fromAgent} output indicates failure` };
  }

  return { allowed: true };
}
