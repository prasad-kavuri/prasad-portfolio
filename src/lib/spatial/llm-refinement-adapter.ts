import type { ParametricScene } from './scene-schema';
import { validateParametricScene, clampToSchema } from './scene-schema';
import type { RefinementResult } from './refinement-engine';
import { applyRefinement } from './refinement-engine';
import { logAPIEvent } from '@/lib/observability';

// Only active when NEXT_PUBLIC_ENABLE_LLM_REFINEMENT=true
const LLM_ENABLED =
  typeof process !== 'undefined' &&
  process.env['NEXT_PUBLIC_ENABLE_LLM_REFINEMENT'] === 'true';

const SYSTEM_PROMPT = `You are a spatial scene editor. Given a parametric scene JSON and a user instruction, return ONLY a JSON array of patch operations. No prose. No markdown. No explanation.

Each patch: { "op": "update"|"add"|"remove", "objectId": "...", "property": "...", "value": ... }

Rules:
- Clamp numeric values: position ±500, scale 0.1-50, height 0.5-200
- Only use valid material values: concrete|asphalt|glass|metal|wood|grass
- Return [] if the instruction is unclear or unsafe
- Maximum 10 patch operations per instruction`;

interface PatchOp {
  op: 'update' | 'add' | 'remove';
  objectId: string;
  property?: string;
  value?: unknown;
}

export function applyPatches(scene: ParametricScene, patches: PatchOp[]): ParametricScene {
  let next = { ...scene, objects: [...scene.objects] };

  for (const patch of patches.slice(0, 10)) {
    if (patch.op === 'remove') {
      next = { ...next, objects: next.objects.filter((o) => o.id !== patch.objectId) };
    } else if (patch.op === 'update' && patch.property) {
      next = {
        ...next,
        objects: next.objects.map((o) => {
          if (o.id !== patch.objectId) return o;
          return clampToSchema({ ...o, [patch.property as string]: patch.value });
        }),
      };
    }
  }

  return { ...next, version: next.version + 1 };
}

export async function llmRefineScene(
  scene: ParametricScene,
  instruction: string
): Promise<RefinementResult> {
  // c8 ignore next — false branch only reachable when NEXT_PUBLIC_ENABLE_LLM_REFINEMENT=true
  if (!LLM_ENABLED) {
    return applyRefinement(scene, instruction);
  }

  /* c8 ignore start — LLM path only reachable with NEXT_PUBLIC_ENABLE_LLM_REFINEMENT=true */
  try {
    const { default: Groq } = await import('groq-sdk');
    const groq = new Groq({ apiKey: process.env['GROQ_API_KEY'] });

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Scene: ${JSON.stringify({ id: scene.id, objects: scene.objects })}\n\nInstruction: ${instruction}`,
        },
      ],
      max_tokens: 512,
      temperature: 0,
    });

    const raw = completion.choices[0]?.message?.content ?? '[]';
    let patches: PatchOp[];

    try {
      patches = JSON.parse(raw) as PatchOp[];
    } catch {
      logAPIEvent({ route: '/spatial/llm-refine', severity: 'warn', event: 'llm_parse_failed' });
      return applyRefinement(scene, instruction);
    }

    if (!Array.isArray(patches) || patches.length === 0) {
      return applyRefinement(scene, instruction);
    }

    const patched = applyPatches(scene, patches);
    const check = validateParametricScene(patched);
    if (!check.valid) {
      logAPIEvent({ route: '/spatial/llm-refine', severity: 'warn', event: 'llm_schema_invalid' });
      return applyRefinement(scene, instruction);
    }

    return { success: true, scene: patched };
  } catch {
    logAPIEvent({ route: '/spatial/llm-refine', severity: 'error', event: 'llm_refine_error' });
    return applyRefinement(scene, instruction);
  }
  /* c8 ignore stop */
}
