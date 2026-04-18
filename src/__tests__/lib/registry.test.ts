import { describe, it, expect } from 'vitest';
import { TOOL_REGISTRY } from '@/lib/registry';

describe('Tool Registry', () => {
  it('contains the expected number of tools', () => {
    expect(TOOL_REGISTRY.length).toBe(13);
  });

  it('each tool has required properties', () => {
    TOOL_REGISTRY.forEach(tool => {
      expect(tool.id).toBeDefined();
      expect(tool.name).toBeDefined();
      expect(tool.type).toBeDefined();
      expect(tool.path).toBeDefined();
      expect(tool.cost_tier).toBeDefined();
      expect(tool.security_level).toBeDefined();
      expect(tool.description).toBeDefined();
    });
  });

  it('contains mandatory tools like enterprise-control-plane', () => {
    const ids = TOOL_REGISTRY.map(t => t.id);
    expect(ids).toContain('enterprise-control-plane');
    expect(ids).toContain('llm-router');
    expect(ids).toContain('multi-agent');
  });

  it('defines valid paths for all tools', () => {
    TOOL_REGISTRY.forEach(tool => {
      expect(tool.path.startsWith('/demos/')).toBe(true);
    });
  });
});
