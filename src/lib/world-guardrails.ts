import { detectPromptInjection } from '@/lib/guardrails';
import {
  DEFAULT_WORLD_CONSTRAINTS,
  WORLD_OBJECTIVE_OPTIONS,
  WORLD_REGION_OPTIONS,
  WORLD_STYLE_OPTIONS,
  type WorldConstraintProfile,
  type WorldObjective,
  type WorldRegion,
  type WorldStyle,
} from '@/lib/world-prompts';

export const WORLD_UPLOAD_LIMITS = {
  maxBytes: 4 * 1024 * 1024,
  maxDimension: 4096,
  allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'] as const,
};

export type WorldUploadPayload = {
  name: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
};

export type WorldGenerationInput = {
  prompt: string;
  region: WorldRegion;
  objective: WorldObjective;
  style: WorldStyle;
  constraints: WorldConstraintProfile;
  provider: 'mock' | 'hyworld';
  approvalState: 'pending' | 'approved';
  simulationReady: boolean;
  image?: WorldUploadPayload;
};

export type WorldGuardrailResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  blockedByPolicy: boolean;
  sanitizedInput?: WorldGenerationInput;
};

const POLICY_BLOCKLIST = [
  /ignore\s+pedestrian\s+safety/i,
  /bypass\s+laws?/i,
  /disable\s+safety\s+checks/i,
  /harm\s+(people|pedestrians|drivers)/i,
  /override\s+policy/i,
  /claim\s+100%\s+certainty/i,
];

function normalizePrompt(value: unknown): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function normalizeConstraints(value: unknown): WorldConstraintProfile {
  const input = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const budgetLevel = input.budgetLevel;
  const congestionSensitivity = input.congestionSensitivity;
  const policyProfile = input.policyProfile;

  return {
    budgetLevel:
      budgetLevel === 'low' || budgetLevel === 'medium' || budgetLevel === 'high'
        ? budgetLevel
        : DEFAULT_WORLD_CONSTRAINTS.budgetLevel,
    congestionSensitivity:
      congestionSensitivity === 'low' || congestionSensitivity === 'medium' || congestionSensitivity === 'high'
        ? congestionSensitivity
        : DEFAULT_WORLD_CONSTRAINTS.congestionSensitivity,
    accessibilityPriority:
      typeof input.accessibilityPriority === 'boolean'
        ? input.accessibilityPriority
        : DEFAULT_WORLD_CONSTRAINTS.accessibilityPriority,
    policyProfile:
      policyProfile === 'balanced' || policyProfile === 'safety-first' || policyProfile === 'throughput-first'
        ? policyProfile
        : DEFAULT_WORLD_CONSTRAINTS.policyProfile,
  };
}

function policyBlockReasons(prompt: string): string[] {
  return POLICY_BLOCKLIST.filter((pattern) => pattern.test(prompt)).map((pattern) => `policy_block:${pattern.source}`);
}

export function validateWorldUploadPayload(upload: unknown): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!upload || typeof upload !== 'object') {
    return { isValid: true, errors };
  }

  const candidate = upload as Partial<WorldUploadPayload>;

  if (typeof candidate.name !== 'string' || candidate.name.length === 0 || candidate.name.length > 120) {
    errors.push('upload_name_invalid');
  }

  if (
    typeof candidate.mimeType !== 'string' ||
    !WORLD_UPLOAD_LIMITS.allowedMimeTypes.includes(
      candidate.mimeType as (typeof WORLD_UPLOAD_LIMITS.allowedMimeTypes)[number]
    )
  ) {
    errors.push('upload_mime_not_allowed');
  }

  if (
    typeof candidate.sizeBytes !== 'number' ||
    !Number.isFinite(candidate.sizeBytes) ||
    candidate.sizeBytes <= 0 ||
    candidate.sizeBytes > WORLD_UPLOAD_LIMITS.maxBytes
  ) {
    errors.push('upload_size_exceeded');
  }

  if (typeof candidate.width !== 'number' || typeof candidate.height !== 'number') {
    errors.push('upload_dimensions_missing');
  } else {
    if (!Number.isInteger(candidate.width) || !Number.isInteger(candidate.height) || candidate.width <= 0 || candidate.height <= 0) {
      errors.push('upload_dimensions_invalid');
    }
    if (candidate.width > WORLD_UPLOAD_LIMITS.maxDimension || candidate.height > WORLD_UPLOAD_LIMITS.maxDimension) {
      errors.push('upload_dimensions_exceeded');
    }
  }

  return { isValid: errors.length === 0, errors };
}

export function validateWorldInput(payload: unknown): WorldGuardrailResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { isValid: false, errors: ['invalid_payload'], warnings, blockedByPolicy: false };
  }

  const raw = payload as Record<string, unknown>;
  const prompt = normalizePrompt(raw.prompt);
  const region = raw.region;
  const objective = raw.objective;
  const style = raw.style;
  const provider = raw.provider;
  const approvalState = raw.approvalState;
  const simulationReady = typeof raw.simulationReady === 'boolean' ? raw.simulationReady : false;

  if (prompt.length < 24 || prompt.length > 500) {
    errors.push('prompt_length_invalid');
  }

  if (!WORLD_REGION_OPTIONS.includes(region as WorldRegion)) {
    errors.push('region_unsupported');
  }

  if (!WORLD_OBJECTIVE_OPTIONS.includes(objective as WorldObjective)) {
    errors.push('objective_unsupported');
  }

  if (!WORLD_STYLE_OPTIONS.includes(style as WorldStyle)) {
    errors.push('style_unsupported');
  }

  if (provider !== undefined && provider !== 'mock' && provider !== 'hyworld') {
    errors.push('provider_unsupported');
  }

  if (approvalState !== undefined && approvalState !== 'pending' && approvalState !== 'approved') {
    errors.push('approval_state_invalid');
  }

  const injectionIssues = detectPromptInjection(prompt);
  if (injectionIssues.length > 0) {
    errors.push('prompt_injection_detected');
  }

  const policyIssues = policyBlockReasons(prompt);
  const blockedByPolicy = policyIssues.length > 0;
  if (blockedByPolicy) {
    errors.push(...policyIssues);
  }

  const uploadValidation = validateWorldUploadPayload(raw.image);
  if (!uploadValidation.isValid) {
    errors.push(...uploadValidation.errors);
  }

  const constraints = normalizeConstraints(raw.constraints);
  if (constraints.policyProfile === 'throughput-first' && constraints.accessibilityPriority) {
    warnings.push('constraint_tension_throughput_vs_accessibility');
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      warnings,
      blockedByPolicy,
    };
  }

  return {
    isValid: true,
    errors,
    warnings,
    blockedByPolicy,
    sanitizedInput: {
      prompt,
      region: region as WorldRegion,
      objective: objective as WorldObjective,
      style: style as WorldStyle,
      constraints,
      provider: (provider as 'mock' | 'hyworld' | undefined) ?? 'hyworld',
      approvalState: (approvalState as 'pending' | 'approved' | undefined) ?? 'pending',
      simulationReady,
      image: raw.image as WorldUploadPayload | undefined,
    },
  };
}
