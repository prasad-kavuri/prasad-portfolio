// Constrained generative-UI catalog for the `/demos/generative-ui` demo.
//
// Pattern: the model is only ever allowed to emit JSON that names one of the
// component types below and fills in that type's fixed prop shape. It cannot
// invent a component, emit markup, or emit a prop the catalog doesn't define.
// A hand-written type-guard validator (the repo's minimal-dependency convention,
// no schema library) checks the model's output against this catalog before anything is rendered.
// This mirrors the safety property of Vercel's json-render (AI -> JSON -> UI,
// constrained to a developer-defined catalog, schema-validated before render)
// without adding a schema-validation dependency — see specs/0018 for why.

export const MAX_UI_NODES = 6;
export const MAX_TEXT_LENGTH = 240;
export const MAX_LIST_ITEMS = 8;

// ---------------------------------------------------------------------------
// Component prop shapes — the entire catalog. Adding a component means adding
// a case here, to the type guard below, and to the renderer.
// ---------------------------------------------------------------------------

export interface StatTileNode {
  type: 'stat-tile';
  label: string;
  value: string;
  caption?: string;
}

export interface ComparisonRow {
  label: string;
  left: string;
  right: string;
}

export interface ComparisonTableNode {
  type: 'comparison-table';
  title: string;
  leftHeader: string;
  rightHeader: string;
  rows: ComparisonRow[];
}

export interface TimelineEntry {
  period: string;
  title: string;
  detail: string;
}

export interface TimelineNode {
  type: 'timeline';
  title: string;
  entries: TimelineEntry[];
}

export interface SkillListNode {
  type: 'skill-list';
  title: string;
  skills: string[];
}

export type UiNode = StatTileNode | ComparisonTableNode | TimelineNode | SkillListNode;

export interface UiSpec {
  summary: string;
  nodes: UiNode[];
}

// ---------------------------------------------------------------------------
// Validators — reject anything that doesn't match the catalog exactly.
// ---------------------------------------------------------------------------

function isNonEmptyString(value: unknown, maxLength = MAX_TEXT_LENGTH): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

function isStatTileNode(value: unknown): value is StatTileNode {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    isNonEmptyString(v.label, 60) &&
    isNonEmptyString(v.value, 40) &&
    (v.caption === undefined || isNonEmptyString(v.caption, 120))
  );
}

function isComparisonRow(value: unknown): value is ComparisonRow {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return isNonEmptyString(row.label, 60) && isNonEmptyString(row.left, 160) && isNonEmptyString(row.right, 160);
}

function isComparisonTableNode(value: unknown): value is ComparisonTableNode {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    isNonEmptyString(v.title, 80) &&
    isNonEmptyString(v.leftHeader, 40) &&
    isNonEmptyString(v.rightHeader, 40) &&
    Array.isArray(v.rows) &&
    v.rows.length > 0 &&
    v.rows.length <= MAX_LIST_ITEMS &&
    v.rows.every(isComparisonRow)
  );
}

function isTimelineEntry(value: unknown): value is TimelineEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  return isNonEmptyString(entry.period, 40) && isNonEmptyString(entry.title, 80) && isNonEmptyString(entry.detail, MAX_TEXT_LENGTH);
}

function isTimelineNode(value: unknown): value is TimelineNode {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    isNonEmptyString(v.title, 80) &&
    Array.isArray(v.entries) &&
    v.entries.length > 0 &&
    v.entries.length <= MAX_LIST_ITEMS &&
    v.entries.every(isTimelineEntry)
  );
}

function isSkillListNode(value: unknown): value is SkillListNode {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    isNonEmptyString(v.title, 80) &&
    Array.isArray(v.skills) &&
    v.skills.length > 0 &&
    v.skills.length <= MAX_LIST_ITEMS &&
    v.skills.every((s) => isNonEmptyString(s, 60))
  );
}

export function isUiNode(value: unknown): value is UiNode {
  if (!value || typeof value !== 'object') return false;
  const node = value as Record<string, unknown>;
  switch (node.type) {
    case 'stat-tile':
      return isStatTileNode(node);
    case 'comparison-table':
      return isComparisonTableNode(node);
    case 'timeline':
      return isTimelineNode(node);
    case 'skill-list':
      return isSkillListNode(node);
    default:
      return false;
  }
}

export function isUiSpec(value: unknown): value is UiSpec {
  if (!value || typeof value !== 'object') return false;
  const spec = value as Record<string, unknown>;
  return (
    isNonEmptyString(spec.summary, MAX_TEXT_LENGTH) &&
    Array.isArray(spec.nodes) &&
    spec.nodes.length > 0 &&
    spec.nodes.length <= MAX_UI_NODES &&
    spec.nodes.every(isUiNode)
  );
}

// ---------------------------------------------------------------------------
// System-prompt fragment describing the catalog. Kept next to the validators
// so the two can never drift apart.
// ---------------------------------------------------------------------------

export const CATALOG_PROMPT_DESCRIPTION = `You must respond with ONLY a JSON object matching this exact shape — no markdown, no extra text:

{
  "summary": "one-sentence plain-language answer (max ${MAX_TEXT_LENGTH} chars)",
  "nodes": [ ... 1 to ${MAX_UI_NODES} of the following node types ... ]
}

Allowed node types (you may use ONLY these — inventing a new "type" value is invalid):

1. { "type": "stat-tile", "label": string, "value": string, "caption"?: string }
2. { "type": "comparison-table", "title": string, "leftHeader": string, "rightHeader": string, "rows": [ { "label": string, "left": string, "right": string }, ... up to ${MAX_LIST_ITEMS} ] }
3. { "type": "timeline", "title": string, "entries": [ { "period": string, "title": string, "detail": string }, ... up to ${MAX_LIST_ITEMS} ] }
4. { "type": "skill-list", "title": string, "skills": [ string, ... up to ${MAX_LIST_ITEMS} ] }

Every string must be plain text only — no HTML, no markdown, no code. Keep values factual and grounded only in the profile data provided below.`;
