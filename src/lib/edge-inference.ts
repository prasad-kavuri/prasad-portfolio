/**
 * Browser-side PII classification via Transformers.js ONNX.
 *
 * Privacy rationale: all inference runs locally — no data reaches any server
 * until the user explicitly approves the redacted payload at the HITL gate.
 * The edge tier is appropriate when inputs contain PII, latency must be sub-100ms
 * for preprocessing, and compliance requires data residency at the client boundary.
 *
 * Model: Xenova/bert-base-NER (token-classification, ONNX, English NER)
 * Structured PII (email, phone, SSN, card, account numbers) is redacted with the same patterns the server uses
 * to block a handoff (SPEC-0041). Names come from the model. Street addresses and free-text dates are not detected.
 */

import { loadTransformersModule } from './transformers-loader';
import { findStructuredPIISpans, type StructuredPiiType } from './guardrails';

export interface RedactionResult {
  original: string;
  redacted: string;
  redactedFields: string[];
  processingMs: number;
  modelId: string;
  tier: 'edge';
  /**
   * Outcome of the neural name pass. 'unavailable' = the model failed to load or run;
   * 'unlocated' = it found a name but we could not place it in the text. Both mean names may remain.
   */
  nameDetection: 'ok' | 'unavailable' | 'unlocated';
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
  type: StructuredPiiType | 'NAME';
}

/** Find every occurrence of an NER word in the text, tolerating whitespace differences from token joining. */
function locateWord(text: string, word: string): Array<{ start: number; end: number }> {
  const parts = word.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return [];
  const pattern = parts.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s*');
  // Letter/number boundaries stop a short name matching inside a longer word ("Al" in "Algorithm").
  const re = new RegExp(`(?<![\\p{L}\\p{N}])${pattern}(?![\\p{L}\\p{N}])`, 'gu');
  const found: Array<{ start: number; end: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m[0].length === 0) { re.lastIndex += 1; continue; }
    found.push({ start: m.index, end: m.index + m[0].length });
  }
  return found;
}

function spanOverlaps(a: RedactionSpan, b: RedactionSpan): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * Classify and redact PII in text using browser-side ONNX inference.
 * Person names are detected via BERT NER; emails, phones, SSNs, card and account numbers via shared regex.
 * No server call is made — all inference is local.
 */
export async function classifyPII(text: string): Promise<RedactionResult> {
  const start = Date.now();
  const spans: RedactionSpan[] = [];

  // --- Regex pass: structural PII (reliable, zero inference cost) ---
  for (const span of findStructuredPIISpans(text)) {
    spans.push({ start: span.start, end: span.end, type: span.type });
  }

  // --- Neural NER pass: person names (BERT, aggregation_strategy=simple) ---
  // Transformers.js returns entity words but no character offsets, so each entity is located in the text
  // by its word (whitespace-tolerant). Every occurrence is redacted, so a name repeated later is covered too.
  let nameDetection: RedactionResult['nameDetection'] = 'ok';
  try {
    // Pipeline return type is opaque; cast is safe given the 'token-classification' task.
    // aggregation_strategy is passed at call time (not factory time) per Transformers.js v4 API.
    const ner = (await getNerPipeline()) as (t: string, opts?: Record<string, unknown>) => Promise<NerEntity[]>;
    const entities = await ner(text, { aggregation_strategy: 'simple' });
    for (const entity of entities) {
      const label = (entity.entity_group ?? entity.entity ?? '').toUpperCase();
      if (!(label.includes('PER') || label === 'PERSON')) continue;

      const located: Array<{ start: number; end: number }> =
        entity.start !== undefined && entity.end !== undefined
          ? [{ start: entity.start, end: entity.end }]
          : locateWord(text, entity.word);
      if (located.length === 0) {
        nameDetection = 'unlocated';
        continue;
      }
      for (const { start: s0, end: e0 } of located) {
        const candidate: RedactionSpan = { start: s0, end: e0, type: 'NAME' };
        // Skip if this span overlaps an already-captured span.
        if (!spans.some((s) => spanOverlaps(s, candidate))) {
          spans.push(candidate);
        }
      }
    }
  } catch (err) {
    // NER model unavailable or failed — regex redactions are still applied, but say so.
    nameDetection = 'unavailable';
    console.warn('[edge-inference] name detection unavailable', err instanceof Error ? err.message : err);
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
    nameDetection,
  };
}

/** Reset the NER pipeline singleton — for tests only. */
export function _resetPipeline(): void {
  pipelineInstance = null;
}
