/**
 * Browser-side PII classification via Transformers.js ONNX.
 *
 * Privacy rationale: all inference runs locally — no data reaches any server
 * until the user explicitly approves the redacted payload at the HITL gate.
 * The edge tier is appropriate when inputs contain PII, latency must be sub-100ms
 * for preprocessing, and compliance requires data residency at the client boundary.
 *
 * Model: Xenova/bert-base-NER (token-classification, ONNX, English NER)
 * Fallback: regex for EMAIL and ACCOUNT_NUMBER patterns (structural, reliable).
 */

import { loadTransformersModule } from './transformers-loader';

export interface RedactionResult {
  original: string;
  redacted: string;
  redactedFields: string[];
  processingMs: number;
  modelId: string;
  tier: 'edge';
}

const MODEL_ID = 'Xenova/bert-base-NER';

// Lazy singleton: pipeline is loaded once and reused across calls.
let pipelineInstance: Promise<unknown> | null = null;

async function getNerPipeline(): Promise<unknown> {
  if (!pipelineInstance) {
    pipelineInstance = (async () => {
      const { pipeline } = await loadTransformersModule();
      return pipeline('token-classification', MODEL_ID);
    })().catch((err: unknown) => {
      // Reset on failure so the next call can retry.
      pipelineInstance = null;
      throw err;
    });
  }
  return pipelineInstance;
}

// Structural PII: regex is reliable for these patterns.
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const ACCOUNT_RE = /\bACC-[A-Z0-9\-]+\b/g;

interface NerEntity {
  entity_group?: string;
  entity?: string;
  word: string;
  start?: number;
  end?: number;
  score?: number;
}

interface RedactionSpan {
  start: number;
  end: number;
  type: 'EMAIL' | 'ACCOUNT_NUMBER' | 'NAME';
}

function spanOverlaps(a: RedactionSpan, b: RedactionSpan): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * Classify and redact PII in text using browser-side ONNX inference.
 * Person names are detected via BERT NER; emails and account numbers via regex.
 * No server call is made — all inference is local.
 */
export async function classifyPII(text: string): Promise<RedactionResult> {
  const start = Date.now();
  const spans: RedactionSpan[] = [];

  // --- Regex pass: structural PII (reliable, zero inference cost) ---
  let m: RegExpExecArray | null;
  const emailRe = new RegExp(EMAIL_RE.source, 'g');
  while ((m = emailRe.exec(text)) !== null) {
    spans.push({ start: m.index, end: m.index + m[0].length, type: 'EMAIL' });
  }

  const accountRe = new RegExp(ACCOUNT_RE.source, 'g');
  while ((m = accountRe.exec(text)) !== null) {
    spans.push({ start: m.index, end: m.index + m[0].length, type: 'ACCOUNT_NUMBER' });
  }

  // --- Neural NER pass: person names (BERT, aggregation_strategy=simple) ---
  try {
    // Pipeline return type is opaque; cast is safe given the 'token-classification' task.
    // aggregation_strategy is passed at call time (not factory time) per Transformers.js v4 API.
    const ner = (await getNerPipeline()) as (t: string, opts?: Record<string, unknown>) => Promise<NerEntity[]>;
    const entities = await ner(text, { aggregation_strategy: 'simple' });
    for (const entity of entities) {
      const label = (entity.entity_group ?? entity.entity ?? '').toUpperCase();
      if (
        (label.includes('PER') || label === 'PERSON') &&
        entity.start !== undefined &&
        entity.end !== undefined
      ) {
        const candidate: RedactionSpan = {
          start: entity.start,
          end: entity.end,
          type: 'NAME',
        };
        // Skip if this span overlaps an already-captured structural span.
        if (!spans.some((s) => spanOverlaps(s, candidate))) {
          spans.push(candidate);
        }
      }
    }
  } catch {
    // NER model unavailable or failed — regex redactions are still applied.
  }

  // Apply replacements right-to-left to preserve character offsets.
  spans.sort((a, b) => b.start - a.start);

  const types = new Set<string>();
  let redacted = text;
  for (const span of spans) {
    types.add(span.type);
    redacted = `${redacted.slice(0, span.start)}[REDACTED:${span.type}]${redacted.slice(span.end)}`;
  }

  return {
    original: text,
    redacted,
    redactedFields: [...types],
    processingMs: Date.now() - start,
    modelId: MODEL_ID,
    tier: 'edge',
  };
}

/** Reset the NER pipeline singleton — for tests only. */
export function _resetPipeline(): void {
  pipelineInstance = null;
}
