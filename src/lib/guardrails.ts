// src/lib/guardrails.ts
// 2026 AI Governance Layer — Centralized, observable, testable

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
  /\[INST\]/i,
  /<\|im_start\|>/i,
  /forget\s+(everything|all)/i,
  /you are now/i,
  /jailbreak|DAN mode/i,
  /act as (an? )?(different|unrestricted|jailbroken)/i,
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

  return {
    isSafe: score >= 0.6,
    score,
    issues,
    sanitizedOutput: sanitized,
    traceId,
  };
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
