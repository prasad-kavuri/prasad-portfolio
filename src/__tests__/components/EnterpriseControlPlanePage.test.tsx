import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EnterpriseControlPlanePage from '@/app/demos/enterprise-control-plane/page';

// Mock child components to keep it simple and focused on the page logic
vi.mock('@/components/enterprise/RBACPanel', () => ({
  RBACPanel: () => <div data-testid="rbac-panel">RBAC Panel</div>
}));
vi.mock('@/components/enterprise/SpendAnalyticsPanel', () => ({
  SpendAnalyticsPanel: () => <div data-testid="spend-panel">Spend Panel</div>
}));
vi.mock('@/components/enterprise/ObservabilityFeed', () => ({
  ObservabilityFeed: () => <div data-testid="observability-feed">Observability Feed</div>
}));
vi.mock('@/components/enterprise/TokenUsageChart', () => ({
  TokenUsageChart: () => <div data-testid="token-chart">Token Chart</div>
}));
vi.mock('@/components/enterprise/ToolRegistryPanel', () => ({
  ToolRegistryPanel: () => <div data-testid="tool-registry">Tool Registry</div>
}));

describe('EnterpriseControlPlanePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch globally
    global.fetch = vi.fn().mockImplementation((url) => {
      let data: any = [];
      if (url.includes('resource=summary')) {
        data = {
          totalTeams: 10,
          totalActiveUsers: 100,
          totalCoworkSessions: 1000,
          totalTokens: 1000000,
          totalEstimatedCostUSD: 100.0
        };
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data })
      });
    });
  });

  it('renders the page title and default registry tab', () => {
    render(<EnterpriseControlPlanePage />);
    expect(screen.getByText('Enterprise Control Plane')).toBeDefined();
    expect(screen.getByTestId('tool-registry')).toBeDefined();
  });

  it('switches tabs correctly', async () => {
    render(<EnterpriseControlPlanePage />);
    
    const rbacTab = screen.getByText('Access Control');
    await act(async () => {
      fireEvent.click(rbacTab);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('rbac-panel')).toBeDefined();
    });

    const spendTab = screen.getByText('Spend & Tokens');
    await act(async () => {
      fireEvent.click(spendTab);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('spend-panel')).toBeDefined();
    });
  });

  it('toggles the architecture details', async () => {
    render(<EnterpriseControlPlanePage />);
    const toggle = screen.getByText('How this maps to real enterprise deployment');
    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(screen.getAllByText(/Analytics API/)).toBeDefined();
  });

  it('shows error card when fetch fails', async () => {
    // Mock fetch failure for summary
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('resource=summary')) {
        return Promise.resolve({
          ok: false,
          status: 500
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [] })
      });
    });

    render(<EnterpriseControlPlanePage />);
    
    await waitFor(() => {
      expect(screen.getByText(/HTTP 500/)).toBeDefined();
    });
  });
});
