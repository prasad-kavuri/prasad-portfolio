import { describe, it, expect } from 'vitest';
import { isUiNode, isUiSpec, MAX_UI_NODES, MAX_LIST_ITEMS } from '@/lib/generativeUiCatalog';

const validStatTile = { type: 'stat-tile', label: 'Years of Experience', value: '18+', caption: 'HERE Technologies' };
const validComparisonTable = {
  type: 'comparison-table',
  title: 'Role Comparison',
  leftHeader: 'Krutrim',
  rightHeader: 'HERE',
  rows: [{ label: 'Focus', left: 'Sovereign AI', right: 'Mapping platforms' }],
};
const validTimeline = {
  type: 'timeline',
  title: 'Career Timeline',
  entries: [{ period: '2026-Present', title: 'Head of AI Platform', detail: 'Leading enterprise AI strategy.' }],
};
const validSkillList = {
  type: 'skill-list',
  title: 'AI/ML Skills',
  skills: ['Agentic AI', 'RAG', 'Vector Search'],
};

describe('isUiNode', () => {
  it('accepts a valid node of each catalog type', () => {
    expect(isUiNode(validStatTile)).toBe(true);
    expect(isUiNode(validComparisonTable)).toBe(true);
    expect(isUiNode(validTimeline)).toBe(true);
    expect(isUiNode(validSkillList)).toBe(true);
  });

  it('rejects a component type not in the catalog', () => {
    expect(isUiNode({ type: 'raw-html', html: '<script>alert(1)</script>' })).toBe(false);
  });

  it('rejects a node missing required fields', () => {
    expect(isUiNode({ type: 'stat-tile', label: 'Only a label' })).toBe(false);
  });

  it('rejects a node with the wrong field types', () => {
    expect(isUiNode({ type: 'stat-tile', label: 123, value: '18+' })).toBe(false);
  });

  it('rejects an invalid optional caption and overlong required values', () => {
    expect(isUiNode({ ...validStatTile, caption: '   ' })).toBe(false);
    expect(isUiNode({ ...validStatTile, label: 'x'.repeat(61) })).toBe(false);
    expect(isUiNode({ ...validStatTile, value: 'x'.repeat(41) })).toBe(false);
    expect(isUiNode({ ...validStatTile, caption: 'x'.repeat(121) })).toBe(false);
  });

  it('rejects an empty string field', () => {
    expect(isUiNode({ type: 'stat-tile', label: '   ', value: '18+' })).toBe(false);
  });

  it('rejects a skill-list exceeding the max item count', () => {
    expect(
      isUiNode({
        type: 'skill-list',
        title: 'Too many',
        skills: Array.from({ length: MAX_LIST_ITEMS + 1 }, (_, i) => `skill-${i}`),
      })
    ).toBe(false);
  });

  it('rejects malformed comparison tables and rows', () => {
    expect(isUiNode({ ...validComparisonTable, rows: [] })).toBe(false);
    expect(isUiNode({ ...validComparisonTable, rows: [{ ...validComparisonTable.rows[0], left: '' }] })).toBe(false);
    expect(isUiNode({ ...validComparisonTable, rows: [null] })).toBe(false);
    expect(isUiNode({ ...validComparisonTable, title: 'x'.repeat(81) })).toBe(false);
    expect(isUiNode({ ...validComparisonTable, leftHeader: 'x'.repeat(41) })).toBe(false);
    expect(isUiNode({ ...validComparisonTable, rightHeader: 'x'.repeat(41) })).toBe(false);
  });

  it('rejects malformed timelines and skill lists', () => {
    expect(isUiNode({ ...validTimeline, entries: [] })).toBe(false);
    expect(isUiNode({ ...validTimeline, entries: [{ ...validTimeline.entries[0], detail: '' }] })).toBe(false);
    expect(isUiNode({ ...validTimeline, entries: [null] })).toBe(false);
    expect(isUiNode({ ...validSkillList, skills: [] })).toBe(false);
    expect(isUiNode({ ...validSkillList, skills: [123] })).toBe(false);
    expect(isUiNode({ ...validSkillList, title: 'x'.repeat(81) })).toBe(false);
  });

  it('rejects a non-object value', () => {
    expect(isUiNode('not-an-object')).toBe(false);
    expect(isUiNode(null)).toBe(false);
  });
});

describe('isUiSpec', () => {
  it('accepts a valid spec with multiple node types', () => {
    expect(
      isUiSpec({
        summary: 'Here is a comparison of his two most recent roles.',
        nodes: [validComparisonTable, validStatTile],
      })
    ).toBe(true);
  });

  it('rejects a spec with zero nodes', () => {
    expect(isUiSpec({ summary: 'Nothing to show.', nodes: [] })).toBe(false);
  });

  it('rejects a spec exceeding the max node count', () => {
    expect(
      isUiSpec({
        summary: 'Too many nodes.',
        nodes: Array.from({ length: MAX_UI_NODES + 1 }, () => validStatTile),
      })
    ).toBe(false);
  });

  it('rejects a spec containing one invalid node among valid ones', () => {
    expect(
      isUiSpec({
        summary: 'One bad node.',
        nodes: [validStatTile, { type: 'raw-html', html: '<img src=x onerror=alert(1)>' }],
      })
    ).toBe(false);
  });

  it('rejects a spec missing a summary', () => {
    expect(isUiSpec({ nodes: [validStatTile] })).toBe(false);
  });

  it('rejects malformed specs and overlong summaries', () => {
    expect(isUiSpec(null)).toBe(false);
    expect(isUiSpec('not-an-object')).toBe(false);
    expect(isUiSpec({ summary: 'x'.repeat(241), nodes: [validStatTile] })).toBe(false);
    expect(isUiSpec({ summary: 'Valid summary', nodes: 'not-an-array' })).toBe(false);
  });
});
