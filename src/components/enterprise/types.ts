// Team roles
export type TeamRole = 'engineering' | 'marketing' | 'legal' | 'finance' | 'operations';
export type CapabilityKey = 'cowork' | 'code' | 'rag' | 'multimodel' | 'connectors' | 'skills';
export type ApprovalMode = 'auto' | 'manual';
export type ConnectorAction = 'read' | 'write' | 'delete';

export interface TeamPermissions {
  teamId: string;
  teamName: string;
  role: TeamRole;
  capabilities: Record<CapabilityKey, boolean>;
  connectorPermissions: Record<string, ConnectorAction[]>;
  memberCount: number;
  scimProvisioned: boolean;
}

// Spend + analytics
export interface TeamSpendConfig {
  teamId: string;
  teamName: string;
  monthlyBudgetUSD: number;
  spentUSD: number;
  alertThresholdPct: number;
}

export interface UsageMetrics {
  teamId: string;
  teamName: string;
  coworkSessions: number;
  activeUsers: number;
  dau: number;
  wau: number;
  mau: number;
  skillInvocations: number;
  connectorInvocations: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  totalTokens: number;
  estimatedCostUSD: number;
}

export interface DailyTokenUsage {
  date: string;           // ISO date string e.g. "2026-04-01"
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
}

// Structured observability events
export type OtelEventType =
  | 'tool_call'
  | 'connector_call'
  | 'file_read'
  | 'file_write'
  | 'skill_used'
  | 'action_approved'
  | 'action_rejected'
  | 'token_limit_warning';

export interface OtelEvent {
  eventId: string;
  timestamp: string;      // ISO 8601
  teamId: string;
  teamName: string;
  userId: string;
  eventType: OtelEventType;
  resource: string;       // e.g. "google-drive", "jira", "slack"
  action: string;         // e.g. "read_file", "create_issue"
  approvalMode: ApprovalMode;
  durationMs: number;
  tokenCost?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  metadata: Record<string, string | number | boolean>;
}

// Aggregated org-level summary
export interface OrgSummary {
  totalTeams: number;
  totalActiveUsers: number;
  totalCoworkSessions: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheReadTokens: number;
  totalTokens: number;
  totalEstimatedCostUSD: number;
  avgTokensPerSession: number;
  period: '7d' | '30d' | '90d';
}
