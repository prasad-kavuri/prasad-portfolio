import { detectPromptInjection } from '@/lib/guardrails';
import {
  DEFAULT_SPATIAL_CONSTRAINTS,
  SPATIAL_OBJECTIVE_OPTIONS,
  SPATIAL_REGION_OPTIONS,
  type SpatialConstraintProfile,
  type SpatialObjective,
  type SpatialRegion,
} from '@/lib/spatial-scenarios';

export const SPATIAL_UPLOAD_LIMITS = {
  maxBytes: 4 * 1024 * 1024,
  maxDimension: 4096,
  allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'] as const,
};

export type SpatialUploadPayload = {
  name: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
};

export type SpatialSimulationInput = {
  scenarioPrompt: string;
  region: SpatialRegion;
  objective: SpatialObjective;
  constraints: SpatialConstraintProfile;
  approvalState: 'pending' | 'approved';
  image?: SpatialUploadPayload;
};

export type SpatialGuardrailResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  blockedByPolicy: boolean;
  sanitizedInput?: SpatialSimulationInput;
};

const POLICY_BLOCKLIST = [
  /ignore\s+pedestrian\s+safety/i,
  /bypass\s+laws?/i,
  /disable\s+safety\s+checks/i,
  /harm\s+(people|pedestrians|drivers)/i,
  /override\s+policy/i,
];

function normalizePrompt(value: unknown): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function normalizeConstraints(value: unknown): SpatialConstraintProfile {
  const input = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

  const budgetLevel = input.budgetLevel;
  const congestionSensitivity = input.congestionSensitivity;
  const policyProfile = input.policyProfile;

  return {
    budgetLevel:
      budgetLevel === 'low' || budgetLevel === 'medium' || budgetLevel === 'high'
        ? budgetLevel
        : DEFAULT_SPATIAL_CONSTRAINTS.budgetLevel,
    congestionSensitivity:
      congestionSensitivity === 'low' || congestionSensitivity === 'medium' || congestionSensitivity === 'high'
        ? congestionSensitivity
        : DEFAULT_SPATIAL_CONSTRAINTS.congestionSensitivity,
    accessibilityPriority:
      typeof input.accessibilityPriority === 'boolean'
        ? input.accessibilityPriority
        : DEFAULT_SPATIAL_CONSTRAINTS.accessibilityPriority,
    policyProfile:
      policyProfile === 'balanced' || policyProfile === 'safety-first' || policyProfile === 'throughput-first'
        ? policyProfile
        : DEFAULT_SPATIAL_CONSTRAINTS.policyProfile,
  };
}

export function validateSpatialUploadPayload(upload: unknown): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!upload || typeof upload !== 'object') {
    return { isValid: true, errors };
  }

  const candidate = upload as Partial<SpatialUploadPayload>;

  if (typeof candidate.name !== 'string' || candidate.name.length === 0 || candidate.name.length > 120) {
    errors.push('upload_name_invalid');
  }

  if (typeof candidate.mimeType !== 'string' || !SPATIAL_UPLOAD_LIMITS.allowedMimeTypes.includes(candidate.mimeType as (typeof SPATIAL_UPLOAD_LIMITS.allowedMimeTypes)[number])) {
    errors.push('upload_mime_not_allowed');
  }

  if (typeof candidate.sizeBytes !== 'number' || !Number.isFinite(candidate.sizeBytes) || candidate.sizeBytes <= 0 || candidate.sizeBytes > SPATIAL_UPLOAD_LIMITS.maxBytes) {
    errors.push('upload_size_exceeded');
  }

  if (typeof candidate.width !== 'number' || typeof candidate.height !== 'number') {
    errors.push('upload_dimensions_missing');
  } else {
    if (!Number.isInteger(candidate.width) || !Number.isInteger(candidate.height) || candidate.width <= 0 || candidate.height <= 0) {
      errors.push('upload_dimensions_invalid');
    }
    if (candidate.width > SPATIAL_UPLOAD_LIMITS.maxDimension || candidate.height > SPATIAL_UPLOAD_LIMITS.maxDimension) {
      errors.push('upload_dimensions_exceeded');
    }
  }

  return { isValid: errors.length === 0, errors };
}

function policyBlockReasons(prompt: string): string[] {
  return POLICY_BLOCKLIST.filter((pattern) => pattern.test(prompt)).map((pattern) => `policy_block:${pattern.source}`);
}

export function validateSpatialInput(payload: unknown): SpatialGuardrailResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      isValid: false,
      errors: ['invalid_payload'],
      warnings,
      blockedByPolicy: false,
    };
  }

  const raw = payload as Record<string, unknown>;
  const scenarioPrompt = normalizePrompt(raw.scenarioPrompt);
  const region = raw.region;
  const objective = raw.objective;
  const approvalState = raw.approvalState;

  if (scenarioPrompt.length < 24 || scenarioPrompt.length > 400) {
    errors.push('scenario_prompt_length_invalid');
  }

  if (!SPATIAL_REGION_OPTIONS.includes(region as SpatialRegion)) {
    errors.push('region_unsupported');
  }

  if (!SPATIAL_OBJECTIVE_OPTIONS.includes(objective as SpatialObjective)) {
    errors.push('objective_unsupported');
  }

  if (approvalState !== undefined && approvalState !== 'pending' && approvalState !== 'approved') {
    errors.push('approval_state_invalid');
  }

  const injectionIssues = detectPromptInjection(scenarioPrompt);
  if (injectionIssues.length > 0) {
    errors.push('prompt_injection_detected');
  }

  const policyIssues = policyBlockReasons(scenarioPrompt);
  const blockedByPolicy = policyIssues.length > 0;
  if (blockedByPolicy) {
    errors.push(...policyIssues);
  }

  const uploadValidation = validateSpatialUploadPayload(raw.image);
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
      scenarioPrompt,
      region: region as SpatialRegion,
      objective: objective as SpatialObjective,
      constraints,
      approvalState: (approvalState as 'pending' | 'approved' | undefined) ?? 'pending',
      image: raw.image as SpatialUploadPayload | undefined,
    },
  };
}
