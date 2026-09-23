import { describe, it, expect } from 'vitest';
import { authorizeToolCall, deniedToolResult, TOOL_POLICIES } from '@/lib/tool-policy';

describe('per-tool authorization', () => {
  it('allows public tools without a credential', () => {
    expect(authorizeToolCall('get_experience', null)).toEqual({ allowed: true });
    expect(authorizeToolCall('search_skills', [])).toEqual({ allowed: true });
  });

  it('requires read:profile for get_achievements', () => {
    expect(authorizeToolCall('get_achievements', null)).toEqual({ allowed: false, reason: 'missing_scope', requiredScope: 'read:profile' });
    expect(authorizeToolCall('get_achievements', ['call:mcp-tools'])).toMatchObject({ allowed: false });
    expect(authorizeToolCall('get_achievements', ['read:profile'])).toEqual({ allowed: true });
  });

  it('denies unknown tools by default, including prototype keys', () => {
    expect(authorizeToolCall('delete_everything', ['read:profile'])).toEqual({ allowed: false, reason: 'unknown_tool' });
    expect(authorizeToolCall('constructor', ['read:profile'])).toEqual({ allowed: false, reason: 'unknown_tool' });
  });

  it('explains denials without leaking tool data', () => {
    expect(deniedToolResult('x', { allowed: false, reason: 'unknown_tool' })).toBe('Tool not found');
    expect(deniedToolResult('get_achievements', { allowed: false, reason: 'missing_scope', requiredScope: 'read:profile' }))
      .toMatch(/requires the read:profile scope/);
  });

  it('declares a policy for every tool it knows about', () => {
    expect(Object.keys(TOOL_POLICIES).sort()).toEqual(['get_achievements', 'get_experience', 'search_skills']);
  });
});
