// src/lib/guardrails.ts
// 2026 AI Governance Layer — Centralized, observable, testable

import { recordSkillInvocation, createTraceId, createSpanId, logAPIEvent } from './observability';
import type { AgentDefinition, AgentId } from '@/lib/agents/handoff-model';

export interface GuardrailResult {
  isSafe: boolean;
  score: number;        // 0-1, where 1 = fully safe
  issues: string[];
  sanitizedOutput?: string;
  traceId?: string;
}

// Competitors — AI assistant should not recommend alternatives
const COMPETITORS = new Set([
  'openai', 'anthropic', 'gemini', 'grok', 'xai',
  'perplexity', 'copilot', 'mistral'
]);

// Patterns that indicate inappropriate career advice
const UNSAFE_CAREER_PATTERNS = [
  /salary negotiation/i,
  /\bconfidential\b|\bproprietary\b|\bnda\b/i,
  /my (current|other) (employer|company)/i,
];

// 2026 prompt injection signatures
const INJECTION_SIGNATURES = [
  /ignore\s+(all\s+)?(previous\s+|prior\s+|above\s+)?instructions/i,
  /system:\s/i,
  /\[SYSTEM\]/i,
  /\[INST\]/i,
  /<\|im_start\|>/i,
  /forget\s+(everything|all)/i,
  /you are now/i,
  /reveal\s+(your\s+)?(system\s+)?prompt/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /new\s+personality/i,
  /jailbreak|DAN mode/i,
  /act\s+as\s+(a|an)?\s*(?:different|unrestricted|jailbroken|unfiltered|evil|unconstrained|liberated|unaligned|free\s+ai)\b/i,
];

export function detectPromptInjection(input: string): string[] {
  const issues: string[] = [];
  for (const pattern of INJECTION_SIGNATURES) {
    if (pattern.test(input)) {
      issues.push(`injection_attempt:${pattern.source.slice(0, 40)}`);
    }
  }
  // Template injection
  if (/<[^>]+>|{{|}}/.test(input)) {
    issues.push('template_injection');
  }
  return issues;
}

export function isPromptInjection(input: string): boolean {
  return detectPromptInjection(input).length > 0;
}

/** Strip script tags, event handlers, and javascript: URIs from LLM output server-side. */
export function sanitizeLLMOutput(text: string): string {
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');
}

export function checkInput(input: string): GuardrailResult {
  const issues = detectPromptInjection(input);
  if (issues.length > 0) {
    logAPIEvent({
      event: 'guardrails.injection_detected',
      route: 'checkInput',
      severity: 'warn',
      traceId: createTraceId(),
      issueCount: issues.length,
      issues: issues.join(','),
    });
  }
  return {
    isSafe: issues.length === 0,
    score: issues.length === 0 ? 1 : 0,
    issues,
    sanitizedOutput: input.trim().slice(0, 5000),
  };
}

export function checkOutput(
  output: string,
  traceId?: string
): GuardrailResult {
  const startTime = Date.now();
  const issues: string[] = [];
  let sanitized = output;
  const lower = output.toLowerCase();

  // 1. Competitor filtering
  const competitorFound = [...COMPETITORS].filter(c => lower.includes(c));
  if (competitorFound.length > 0) {
    issues.push(`competitor_mention:${competitorFound.join(',')}`);
    competitorFound.forEach(c => {
      sanitized = sanitized.replace(new RegExp(c, 'gi'), '[service]');
    });
  }

  // 2. Unsafe career advice
  for (const pattern of UNSAFE_CAREER_PATTERNS) {
    if (pattern.test(output)) {
      issues.push(`unsafe_career_pattern:${pattern.source.slice(0, 30)}`);
    }
  }

  // 3. Prompt leakage detection
  if (/system prompt|my instructions (say|tell|state)/i.test(output)) {
    issues.push('prompt_leakage');
    sanitized = sanitized.replace(
      /system prompt|my instructions (say|tell|state)/gi,
      '[filtered]'
    );
  }

  // 4. Hallucination signal (heuristic)
  // Long response about Prasad that doesn't mention key facts
  if (
    output.length > 500 &&
    !lower.includes('krutrim') &&
    !lower.includes('ola') &&
    !lower.includes('here') &&
    !lower.includes('prasad')
  ) {
    issues.push('possible_hallucination:missing_key_facts');
  }

  const score = Math.max(0, 1 - issues.length * 0.2);

  const result: GuardrailResult = {
    isSafe: score >= 0.6,
    score,
    issues,
    sanitizedOutput: sanitized,
    traceId,
  };

  recordSkillInvocation({
    traceId: createTraceId(traceId),
    spanId: createSpanId(),
    skillId: 'guardrails',
    skillName: 'Guardrails',
    demoId: 'unknown',
    triggeredAt: new Date().toISOString(),
    durationMs: Date.now() - startTime,
    outcome: issues.length > 0 ? 'filtered' : 'pass',
    meta: issues.length > 0 ? { issues } : undefined,
  });

  return result;
}

export function validateAgentHandoff(
  fromAgent: string,
  toAgent: string,
  output: string
): GuardrailResult {
  // Treat agent output as potential injection source
  const inputCheck = checkInput(output);
  const outputCheck = checkOutput(output);
  const issues = [
    ...inputCheck.issues.map(i => `[${fromAgent}→${toAgent}] ${i}`),
    ...outputCheck.issues,
  ];
  return {
    isSafe: issues.length === 0,
    score: Math.max(0, 1 - issues.length * 0.15),
    issues,
    sanitizedOutput: outputCheck.sanitizedOutput,
  };
}

export function validateHandoff(
  from: AgentId,
  to: AgentId,
  definitions: Record<AgentId, AgentDefinition>
): { valid: boolean; reason?: string } {
  if (!definitions || typeof definitions !== 'object') {
    return { valid: false, reason: 'handoff definitions unavailable' };
  }

  const fromDefinition = definitions[from];
  const toDefinition = definitions[to];

  if (!fromDefinition || !toDefinition) {
    const reason = 'invalid agent id in handoff';
    logAPIEvent({
      event: 'guardrails.handoff_blocked',
      route: '/demos/multi-agent',
      severity: 'warn',
      traceId: createTraceId(),
      fromAgent: String(from),
      toAgent: String(to),
      reason,
    });
    return { valid: false, reason };
  }

  if (!fromDefinition.canHandoffTo.includes(to)) {
    const reason = `handoff destination ${to} is not allowed for ${from}`;
    logAPIEvent({
      event: 'guardrails.handoff_blocked',
      route: '/demos/multi-agent',
      severity: 'warn',
      traceId: createTraceId(),
      fromAgent: from,
      toAgent: to,
      reason,
    });
    return { valid: false, reason };
  }

  return { valid: true };
}

export function validateHandoffContext(contextSummary: string): {
  safe: boolean;
  reason?: string;
} {
  if (contextSummary.length >= 1000) {
    return { safe: false, reason: 'context summary exceeds 1000 character limit' };
  }

  if (isPromptInjection(contextSummary)) {
    return { safe: false, reason: 'context summary failed prompt-injection checks' };
  }

  if (
    /[{}[\]<>`;$]|(?:\.\.\/|\/\.\.)|(?:\bimport\s+[\w*{]|(?:^|[^\w])require\s*\(|\beval\s*\(|\bprocess\.\w+|\b__dirname\b)/i.test(
      contextSummary
    )
  ) {
    return { safe: false, reason: 'context summary contains blocked code-like patterns' };
  }

  if (/(?:\/etc\/|\/proc\/|\/var\/|[a-zA-Z]:\\)/.test(contextSummary)) {
    return { safe: false, reason: 'context summary contains blocked path traversal patterns' };
  }

  return { safe: true };
}

export function validateRefinementInstruction(instruction: string): { safe: boolean; reason?: string } {
  if (!instruction || instruction.trim().length === 0) {
    return { safe: false, reason: 'instruction cannot be empty' };
  }
  if (instruction.length > 500) {
    return { safe: false, reason: 'instruction blocked by guardrail' };
  }
  if (isPromptInjection(instruction)) {
    return { safe: false, reason: 'instruction blocked by guardrail' };
  }
  // Block code-like patterns: brackets, semicolons, script tags, system paths
  if (/[{}\[\];<>]/.test(instruction)) {
    return { safe: false, reason: 'instruction blocked by guardrail' };
  }
  if (/\b(?:system|process|exec|eval|require|import|__dirname)\b/i.test(instruction) ||
      /\/etc\/|\/proc\//i.test(instruction)) {
    return { safe: false, reason: 'instruction blocked by guardrail' };
  }
  return { safe: true };
}

// Single entry point for all routes
export function enforceGuardrails(
  input: string,
  output: string,
  traceId?: string
): GuardrailResult {
  const inputCheck = checkInput(input);
  if (!inputCheck.isSafe) {
    return { ...inputCheck, traceId };
  }
  return checkOutput(output, traceId);
}

// ---------------------------------------------------------------------------
// Tool-output screening (tool poisoning defense)
// ---------------------------------------------------------------------------

export const BLOCKED_TOOL_OUTPUT =
  '[blocked: tool output failed injection screening and was withheld from the model]';

/**
 * Tool results and remote-agent outputs are untrusted data: a poisoned tool can smuggle
 * instructions into the model's context. Screen them with the same injection signatures used for
 * user input before they reach a model or a user.
 */
export function screenToolOutput(output: string): { safe: boolean; issues: string[] } {
  const issues = detectPromptInjection(output).filter((issue) => issue !== 'template_injection');
  return { safe: issues.length === 0, issues };
}

// ---------------------------------------------------------------------------
// Structured PII detection (server-side re-check of client-redacted payloads)
// ---------------------------------------------------------------------------

export type StructuredPiiType = 'EMAIL' | 'PHONE' | 'SSN' | 'CREDIT_CARD' | 'ACCOUNT_NUMBER';

const PII_PATTERNS: { type: StructuredPiiType; pattern: RegExp }[] = [
  { type: 'EMAIL', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/ },
  { type: 'SSN', pattern: /\b\d{3}-\d{2}-\d{4}\b/ },
  { type: 'PHONE', pattern: /(?:\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/ },
  { type: 'ACCOUNT_NUMBER', pattern: /\bACC-[A-Z0-9-]+\b|\b\d{9,17}\b/ },
];

function passesLuhn(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

/**
 * Structural PII the server can detect reliably with patterns. Names and other free-text PII
 * cannot be caught this way — they depend on the edge NER model — so this is a backstop, not a
 * replacement, for client-side redaction.
 */
export function detectStructuredPII(text: string): StructuredPiiType[] {
  const found = new Set<StructuredPiiType>();
  for (const { type, pattern } of PII_PATTERNS) {
    if (pattern.test(text)) found.add(type);
  }
  for (const match of text.matchAll(/\b(?:\d[ -]?){13,19}\b/g)) {
    const digits = match[0].replace(/[ -]/g, '');
    if (digits.length >= 13 && digits.length <= 19 && passesLuhn(digits)) found.add('CREDIT_CARD');
  }
  return [...found];
}
