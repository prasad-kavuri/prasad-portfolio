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
  /act as (an? )?(different|unrestricted|jailbroken)/i,
  /act\s+as\s+(a|an)\s+/i,
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

  if (/[{}[\]<>`;$]|(?:\.\.\/|\/\.\.)|(?:^|[^\w])(?:import|require|eval|process\.|__dirname)(?:$|[^\w])/i.test(contextSummary)) {
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
