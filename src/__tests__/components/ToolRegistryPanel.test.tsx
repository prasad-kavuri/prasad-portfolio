import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ToolRegistryPanel } from '@/components/enterprise/ToolRegistryPanel';
import { TOOL_REGISTRY } from '@/lib/registry';

describe('ToolRegistryPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the registry title and description', () => {
    render(<ToolRegistryPanel />);
    expect(screen.getByText('Live Tool Registry')).toBeDefined();
    expect(screen.getByText(/Unified gateway for capability discovery/)).toBeDefined();
  });

  it('renders all registered tools', () => {
    render(<ToolRegistryPanel />);
    TOOL_REGISTRY.forEach(tool => {
      expect(screen.getAllByText(tool.name).length).toBeGreaterThan(0);
    });
  });

  it('displays security levels for tools', () => {
    render(<ToolRegistryPanel />);
    const securityLevels = [...new Set(TOOL_REGISTRY.map(t => t.security_level))];
    securityLevels.forEach(level => {
      expect(screen.getAllByText(level).length).toBeGreaterThan(0);
    });
  });

  it('renders the enforcement notice', () => {
    render(<ToolRegistryPanel />);
    expect(screen.getByText('Gateway Enforcement Active')).toBeDefined();
  });
});
