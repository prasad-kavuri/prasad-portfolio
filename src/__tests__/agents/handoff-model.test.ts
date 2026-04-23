import { describe, expect, it } from 'vitest';
import { AGENT_DEFINITIONS, type AgentId } from '@/lib/agents/handoff-model';

describe('handoff-model', () => {
  it('AGENT_DEFINITIONS covers all 5 AgentIds', () => {
    const ids = Object.keys(AGENT_DEFINITIONS).sort();
    expect(ids).toEqual(['analyzer', 'hitl', 'researcher', 'strategist', 'synthesizer']);
  });

  it('canHandoffTo is always a subset of valid AgentIds', () => {
    const validIds = new Set<AgentId>(['analyzer', 'researcher', 'strategist', 'hitl', 'synthesizer']);

    Object.values(AGENT_DEFINITIONS).forEach((definition) => {
      definition.canHandoffTo.forEach((target) => {
        expect(validIds.has(target)).toBe(true);
      });
    });
  });

  it('requiresApproval is true only for hitl', () => {
    Object.values(AGENT_DEFINITIONS).forEach((definition) => {
      if (definition.id === 'hitl') {
        expect(definition.requiresApproval).toBe(true);
      } else {
        expect(definition.requiresApproval).toBe(false);
      }
    });
  });
});
