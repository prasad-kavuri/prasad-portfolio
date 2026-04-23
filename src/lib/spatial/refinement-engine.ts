import type { ParametricScene, SpatialObject, SpatialObjectType, SpatialMaterial } from './scene-schema';
import { clampToSchema } from './scene-schema';

export interface RefinementResult {
  success: boolean;
  scene?: ParametricScene;
  reason?: string;
  fallbackSuggestions?: string[];
}

const FALLBACK_SUGGESTIONS = [
  "make [object] taller/wider/larger",
  "move [object] north/south/east/west [N] meters",
  "change [object] material to metal/glass/concrete",
  "add a platform/block/node",
  "remove [object]",
];

const VALID_MATERIALS = new Set<SpatialMaterial>(['concrete', 'asphalt', 'glass', 'metal', 'wood', 'grass']);

function findObjects(scene: ParametricScene, query: string): SpatialObject[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  // Exact label match first
  const byLabel = scene.objects.filter((o) => o.label.toLowerCase().includes(q));
  if (byLabel.length > 0) return byLabel;

  // Strip leading articles and retry
  const stripped = q.replace(/^(?:the|a|an|this|that)\s+/, '').trim();
  if (stripped !== q) {
    const byStripped = scene.objects.filter((o) => o.label.toLowerCase().includes(stripped));
    if (byStripped.length > 0) return byStripped;
  }

  // Word-by-word: any significant word (>2 chars) appears in label
  const words = (stripped || q).split(/\s+/).filter((w) => w.length > 2);
  const byWords = scene.objects.filter((o) => {
    const label = o.label.toLowerCase();
    return words.some((w) => label.includes(w));
  });
  if (byWords.length > 0) return byWords;

  // Fallback: match by type
  const byType = scene.objects.filter((o) => o.type.toLowerCase() === stripped || o.type.toLowerCase() === q);
  return byType;
}

function updateObject(scene: ParametricScene, id: string, patch: Partial<SpatialObject>): ParametricScene {
  return {
    ...scene,
    objects: scene.objects.map((o) =>
      o.id === id ? clampToSchema({ ...o, ...patch }) : o
    ),
  };
}

function genId(): string {
  return `obj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// Pattern: make [object] [N]% taller/wider/larger/smaller/bigger
const RE_SCALE_PCT = /make\s+(.+?)\s+(\d+(?:\.\d+)?)\s*%\s*(taller|shorter|wider|narrower|larger|bigger|smaller)/i;
// Pattern: make [object] [N] meters taller/wider etc
const RE_SCALE_M = /make\s+(.+?)\s+(\d+(?:\.\d+)?)\s*m(?:eters?)?\s*(taller|shorter|wider|narrower|larger|bigger|smaller)/i;
// Pattern: move [object] [dir] [N] meters
const RE_MOVE = /move\s+(.+?)\s+(north|south|east|west|up|down|left|right|forward|backward)\s+(\d+(?:\.\d+)?)\s*m(?:eters?)?/i;
// Pattern: change [object] material to [mat]
const RE_MATERIAL = /change\s+(.+?)\s+material\s+to\s+(\w+)/i;
// Pattern: add [a/another] [type] [anywhere / on the left / etc.]
const RE_ADD = /add\s+(?:a(?:nother)?\s+)?(\w+)(?:\s+(.+))?/i;
// Pattern: remove [object]
const RE_REMOVE = /remove\s+(.+)/i;
// Pattern: set [object] [property] to [value]
const RE_SET = /set\s+(.+?)\s+(width|depth|height|radius)\s+to\s+(\d+(?:\.\d+)?)/i;
// Pattern: mark [object] as simulation-ready
const RE_SIM_READY = /mark\s+(.+?)\s+as\s+simulation-ready/i;
// Pattern: apply [policy] policy to [object]
const RE_POLICY = /apply\s+(.+?)\s+policy\s+to\s+(.+)/i;

const DIRECTION_DELTA: Record<string, { axis: 'x' | 'y' | 'z'; sign: number }> = {
  north:    { axis: 'z', sign: -1 },
  south:    { axis: 'z', sign: 1 },
  east:     { axis: 'x', sign: 1 },
  west:     { axis: 'x', sign: -1 },
  up:       { axis: 'y', sign: 1 },
  down:     { axis: 'y', sign: -1 },
  left:     { axis: 'x', sign: -1 },
  right:    { axis: 'x', sign: 1 },
  forward:  { axis: 'z', sign: -1 },
  backward: { axis: 'z', sign: 1 },
};

const VALID_OBJECT_TYPES = new Set<string>(['zone', 'block', 'corridor', 'platform', 'node', 'primitive']);

function applyScaleAdjustment(
  obj: SpatialObject,
  dimension: string,
  amount: number,
  isPct: boolean
): SpatialObject {
  const factor = isPct ? amount / 100 : amount;

  const apply = (current: number | undefined, fallback = 1): number => {
    const base = current ?? fallback;
    return isPct ? base * (1 + factor) : base + factor;
  };

  switch (dimension) {
    case 'taller':
    case 'bigger':
    case 'larger':
      return { ...obj, height: apply(obj.height), scale: { ...obj.scale, y: apply(obj.scale.y) } };
    case 'shorter':
    case 'smaller': {
      const baseH = obj.height ?? 1;
      const newH = isPct ? baseH * (1 - factor) : baseH - factor;
      return { ...obj, height: newH, scale: { ...obj.scale, y: obj.scale.y * (1 - factor) } };
    }
    case 'wider':
      return { ...obj, width: apply(obj.width), scale: { ...obj.scale, x: apply(obj.scale.x) } };
    case 'narrower': {
      const baseW = obj.width ?? 1;
      const newW = isPct ? baseW * (1 - factor) : baseW - factor;
      return { ...obj, width: newW, scale: { ...obj.scale, x: obj.scale.x * (1 - factor) } };
    }
    default:
      return obj;
  }
}

export function applyRefinement(scene: ParametricScene, instruction: string): RefinementResult {
  const inst = instruction.trim();

  // --- scale by percentage ---
  const mScalePct = RE_SCALE_PCT.exec(inst);
  if (mScalePct) {
    const [, query, pctStr, dim] = mScalePct;
    const targets = findObjects(scene, query);
    if (targets.length === 0) return noMatch();
    let next = { ...scene, objects: [...scene.objects] };
    for (const t of targets) {
      const updated = clampToSchema(applyScaleAdjustment(t, dim.toLowerCase(), parseFloat(pctStr), true));
      next = updateObject(next, t.id, updated);
    }
    return { success: true, scene: bumpVersion(next) };
  }

  // --- scale by meters ---
  const mScaleM = RE_SCALE_M.exec(inst);
  if (mScaleM) {
    const [, query, mStr, dim] = mScaleM;
    const targets = findObjects(scene, query);
    if (targets.length === 0) return noMatch();
    let next = { ...scene, objects: [...scene.objects] };
    for (const t of targets) {
      const updated = clampToSchema(applyScaleAdjustment(t, dim.toLowerCase(), parseFloat(mStr), false));
      next = updateObject(next, t.id, updated);
    }
    return { success: true, scene: bumpVersion(next) };
  }

  // --- move ---
  const mMove = RE_MOVE.exec(inst);
  if (mMove) {
    const [, query, dir, mStr] = mMove;
    const targets = findObjects(scene, query);
    if (targets.length === 0) return noMatch();
    const delta = DIRECTION_DELTA[dir.toLowerCase()];
    if (!delta) return noMatch();
    let next = { ...scene, objects: [...scene.objects] };
    for (const t of targets) {
      const pos = { ...t.position };
      pos[delta.axis] += delta.sign * parseFloat(mStr);
      next = updateObject(next, t.id, { position: pos });
    }
    return { success: true, scene: bumpVersion(next) };
  }

  // --- change material ---
  const mMat = RE_MATERIAL.exec(inst);
  if (mMat) {
    const [, query, mat] = mMat;
    const matLower = mat.toLowerCase() as SpatialMaterial;
    if (!VALID_MATERIALS.has(matLower)) return { success: false, reason: `Unknown material "${mat}"`, fallbackSuggestions: FALLBACK_SUGGESTIONS };
    const targets = findObjects(scene, query);
    if (targets.length === 0) return noMatch();
    let next = { ...scene, objects: [...scene.objects] };
    for (const t of targets) {
      next = updateObject(next, t.id, { material: matLower });
    }
    return { success: true, scene: bumpVersion(next) };
  }

  // --- add object ---
  const mAdd = RE_ADD.exec(inst);
  if (mAdd) {
    const [, typeStr, locationHint] = mAdd;
    const typeLower = typeStr.toLowerCase() as SpatialObjectType;
    if (!VALID_OBJECT_TYPES.has(typeLower)) return noMatch();
    const locationOffset = locationHint?.toLowerCase().includes('left') ? -5
      : locationHint?.toLowerCase().includes('right') ? 5 : 0;
    const newObj: SpatialObject = {
      id: genId(),
      type: typeLower,
      label: `${typeLower}-${Date.now().toString(36).slice(-4)}`,
      position: { x: locationOffset, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    };
    const next: ParametricScene = {
      ...scene,
      objects: [...scene.objects, newObj],
    };
    return { success: true, scene: bumpVersion(next) };
  }

  // --- remove ---
  const mRemove = RE_REMOVE.exec(inst);
  if (mRemove) {
    const [, query] = mRemove;
    const targets = findObjects(scene, query);
    if (targets.length === 0) return noMatch();
    const targetIds = new Set(targets.map((t) => t.id));
    const next: ParametricScene = {
      ...scene,
      objects: scene.objects.filter((o) => !targetIds.has(o.id)),
    };
    return { success: true, scene: bumpVersion(next) };
  }

  // --- set property ---
  const mSet = RE_SET.exec(inst);
  if (mSet) {
    const [, query, prop, valStr] = mSet;
    const targets = findObjects(scene, query);
    if (targets.length === 0) return noMatch();
    const val = parseFloat(valStr);
    let next = { ...scene, objects: [...scene.objects] };
    for (const t of targets) {
      next = updateObject(next, t.id, { [prop]: val });
    }
    return { success: true, scene: bumpVersion(next) };
  }

  // --- mark simulation-ready ---
  const mSimReady = RE_SIM_READY.exec(inst);
  if (mSimReady) {
    const [, query] = mSimReady;
    const targets = findObjects(scene, query);
    if (targets.length === 0) return noMatch();
    let next = { ...scene, objects: [...scene.objects] };
    for (const t of targets) {
      next = updateObject(next, t.id, { simulationReady: true });
    }
    return { success: true, scene: bumpVersion(next) };
  }

  // --- apply policy ---
  const mPolicy = RE_POLICY.exec(inst);
  if (mPolicy) {
    const [, policy, query] = mPolicy;
    const targets = findObjects(scene, query);
    if (targets.length === 0) return noMatch();
    let next = { ...scene, objects: [...scene.objects] };
    for (const t of targets) {
      next = updateObject(next, t.id, { policy });
    }
    return { success: true, scene: bumpVersion(next) };
  }

  return noMatch();
}

function noMatch(): RefinementResult {
  return { success: false, reason: 'unrecognized instruction', fallbackSuggestions: FALLBACK_SUGGESTIONS };
}

function bumpVersion(scene: ParametricScene): ParametricScene {
  return { ...scene, version: scene.version + 1 };
}
