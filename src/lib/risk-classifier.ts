// Adaptive AI Governance — runtime risk classification for model routing.
// Sits conceptually between the model router and the model itself: classifies
// a request's risk tier and returns the resulting route (standard, restricted +
// review, policy-approved + audit, or blocked) before any model is selected.

import { detectPromptInjection } from '@/lib/guardrails';

export type RiskTier = 'standard' | 'security_sensitive' | 'regulated' | 'blocked';

export type RiskRoute =
  | 'standard_model'
  | 'restricted_model_pending_review'
  | 'policy_approved_with_audit'
  | 'blocked';

export interface RiskClassification {
  tier: RiskTier;
  route: RiskRoute;
  requiresHumanApproval: boolean;
  auditRequired: boolean;
  matchedSignals: string[];
  rationale: string;
}

// Requests touching credentials, exploits, or system access — routed to a
// restricted model tier and flagged for human review before executing.
const SECURITY_SENSITIVE_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bpassword|credential|api[\s-]?key|secret[\s-]?token\b/i, label: 'credential_reference' },
  { pattern: /\bexploit|vulnerability|malware|bypass\s+(security|auth)|privilege\s+escalation\b/i, label: 'security_exploit_reference' },
  { pattern: /\bhack(ing)?\s+(into|a|the)\b/i, label: 'unauthorized_access_reference' },
  { pattern: /\bssn|social\s+security\s+number|credit\s+card\s+number\b/i, label: 'sensitive_identifier_reference' },
];

// Requests in regulated domains — not blocked, but routed through the policy
// engine with a mandatory audit trail (e.g. for compliance review later).
const REGULATED_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bmedical\s+diagnosis|prescribe|prescription\b/i, label: 'medical_advice_domain' },
  { pattern: /\blegal\s+advice|lawsuit|sue\s+(my|the)\b/i, label: 'legal_advice_domain' },
  { pattern: /\binvestment\s+advice|financial\s+advice|tax\s+advice\b/i, label: 'financial_advice_domain' },
  { pattern: /\bhipaa|gdpr|personal(ly)?\s+identifiable\s+information\b/i, label: 'regulated_compliance_domain' },
];

/**
 * Classifies a request's runtime risk tier before model routing occurs.
 * Pure and deterministic — no network calls, no side effects.
 */
export function classifyRequestRisk(prompt: string): RiskClassification {
  const injectionIssues = detectPromptInjection(prompt);
  if (injectionIssues.length > 0) {
    return {
      tier: 'blocked',
      route: 'blocked',
      requiresHumanApproval: false,
      auditRequired: true,
      matchedSignals: injectionIssues,
      rationale: 'Prompt injection signature detected — request blocked before reaching any model, audited.',
    };
  }

  const securitySignals = SECURITY_SENSITIVE_PATTERNS
    .filter(({ pattern }) => pattern.test(prompt))
    .map(({ label }) => label);

  if (securitySignals.length > 0) {
    return {
      tier: 'security_sensitive',
      route: 'restricted_model_pending_review',
      requiresHumanApproval: true,
      auditRequired: true,
      matchedSignals: securitySignals,
      rationale: 'Security-sensitive content detected — routed to a restricted model tier pending human review, audited.',
    };
  }

  const regulatedSignals = REGULATED_PATTERNS
    .filter(({ pattern }) => pattern.test(prompt))
    .map(({ label }) => label);

  if (regulatedSignals.length > 0) {
    return {
      tier: 'regulated',
      route: 'policy_approved_with_audit',
      requiresHumanApproval: false,
      auditRequired: true,
      matchedSignals: regulatedSignals,
      rationale: 'Regulated domain detected — approved to proceed under policy, with a mandatory audit trail entry.',
    };
  }

  return {
    tier: 'standard',
    route: 'standard_model',
    requiresHumanApproval: false,
    auditRequired: false,
    matchedSignals: [],
    rationale: 'No risk signals detected — proceeds through standard complexity-based routing.',
  };
}
