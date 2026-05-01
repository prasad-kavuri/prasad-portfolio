import type {
  TeamPermissions,
  TeamSpendConfig,
  UsageMetrics,
  DailyTokenUsage,
  OtelEvent,
  OtelEventType,
  OrgSummary,
} from '@/components/enterprise/types';

// Captured once on module load — anchors all event/chart timestamps to the current session
const MODULE_INIT_TIME = Date.now();

function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// Token pricing model: $3/MTok input, $15/MTok output, $0.30/MTok cache read, $3.75/MTok cache write
function calcCost(
  inputTokens: number,
  outputTokens: number,
  cacheReadTokens: number,
  cacheWriteTokens: number
): number {
  return (
    (inputTokens * 3 + outputTokens * 15 + cacheReadTokens * 0.30 + cacheWriteTokens * 3.75) /
    1_000_000
  );
}

const TEAMS = [
  { teamId: 'engineering', teamName: 'Engineering', memberCount: 34, scimProvisioned: true },
  { teamId: 'marketing',   teamName: 'Marketing',   memberCount: 18, scimProvisioned: true },
  { teamId: 'legal',       teamName: 'Legal',        memberCount: 8,  scimProvisioned: false },
  { teamId: 'finance',     teamName: 'Finance',      memberCount: 12, scimProvisioned: true },
  { teamId: 'operations',  teamName: 'Operations',   memberCount: 22, scimProvisioned: false },
];

export function getTeamPermissions(): TeamPermissions[] {
  return [
    {
      teamId: 'engineering',
      teamName: 'Engineering',
      role: 'engineering',
      memberCount: 34,
      scimProvisioned: true,
      capabilities: { cowork: true, code: true, rag: true, multimodel: true, connectors: true, skills: true },
      connectorPermissions: {
        'google-drive': ['read', 'write', 'delete'],
        'jira':         ['read', 'write', 'delete'],
        'github':       ['read', 'write', 'delete'],
        'slack':        ['read', 'write'],
        'notion':       ['read', 'write', 'delete'],
        'zoom':         ['read'],
      },
    },
    {
      teamId: 'marketing',
      teamName: 'Marketing',
      role: 'marketing',
      memberCount: 18,
      scimProvisioned: true,
      capabilities: { cowork: true, code: false, rag: true, multimodel: false, connectors: true, skills: true },
      connectorPermissions: {
        'google-drive': ['read', 'write'],
        'slack':        ['read', 'write'],
        'notion':       ['read', 'write'],
        'zoom':         ['read'],
      },
    },
    {
      teamId: 'legal',
      teamName: 'Legal',
      role: 'legal',
      memberCount: 8,
      scimProvisioned: false,
      capabilities: { cowork: true, code: false, rag: false, multimodel: false, connectors: false, skills: false },
      connectorPermissions: {
        'google-drive': ['read'],
        'jira':         ['read'],
        'slack':        ['read'],
      },
    },
    {
      teamId: 'finance',
      teamName: 'Finance',
      role: 'finance',
      memberCount: 12,
      scimProvisioned: true,
      capabilities: { cowork: true, code: false, rag: true, multimodel: false, connectors: true, skills: false },
      connectorPermissions: {
        'google-drive': ['read', 'write'],
        'jira':         ['read', 'write'],
        'slack':        ['read', 'write'],
        'notion':       ['read', 'write'],
      },
    },
    {
      teamId: 'operations',
      teamName: 'Operations',
      role: 'operations',
      memberCount: 22,
      scimProvisioned: false,
      capabilities: { cowork: true, code: false, rag: false, multimodel: false, connectors: true, skills: true },
      connectorPermissions: {
        'jira':   ['read', 'write', 'delete'],
        'slack':  ['read', 'write'],
        'zoom':   ['read'],
        'github': ['read', 'write'],
        'notion': ['read', 'write', 'delete'],
      },
    },
  ];
}

export function getTeamSpendConfigs(): TeamSpendConfig[] {
  return [
    { teamId: 'engineering', teamName: 'Engineering', monthlyBudgetUSD: 3000, spentUSD: 2400, alertThresholdPct: 80 },
    { teamId: 'marketing',   teamName: 'Marketing',   monthlyBudgetUSD: 1200, spentUSD:  900, alertThresholdPct: 75 },
    { teamId: 'legal',       teamName: 'Legal',        monthlyBudgetUSD:  500, spentUSD:  325, alertThresholdPct: 65 },
    { teamId: 'finance',     teamName: 'Finance',      monthlyBudgetUSD:  800, spentUSD:  576, alertThresholdPct: 72 },
    { teamId: 'operations',  teamName: 'Operations',   monthlyBudgetUSD: 1800, spentUSD: 1530, alertThresholdPct: 85 },
  ];
}

// Per-team monthly token volumes (total = input + output + cacheRead)
const TEAM_TOKEN_BASE: Record<string, { input: number; output: number; cacheRead: number; cacheWrite: number }> = {
  engineering: { input: 2_100_000, output:   800_000, cacheRead:  300_000, cacheWrite:  200_000 },
  marketing:   { input:   900_000, output:   350_000, cacheRead:  100_000, cacheWrite:   50_000 },
  legal:       { input:   200_000, output:    80_000, cacheRead:   20_000, cacheWrite:   10_000 },
  finance:     { input:   450_000, output:   180_000, cacheRead:   60_000, cacheWrite:   30_000 },
  operations:  { input: 1_100_000, output:   420_000, cacheRead:  150_000, cacheWrite:   80_000 },
};

export function getUsageMetrics(): UsageMetrics[] {
  const data: Record<string, { coworkSessions: number; activeUsers: number; dau: number; wau: number; mau: number; skillInvocations: number; connectorInvocations: number }> = {
    engineering: { coworkSessions: 45, activeUsers: 28, dau: 12, wau: 26, mau: 34, skillInvocations: 120, connectorInvocations: 340 },
    marketing:   { coworkSessions: 30, activeUsers: 14, dau:  8, wau: 13, mau: 18, skillInvocations:  60, connectorInvocations: 180 },
    legal:       { coworkSessions:  8, activeUsers:  6, dau:  3, wau:  6, mau:  8, skillInvocations:  10, connectorInvocations:  40 },
    finance:     { coworkSessions: 18, activeUsers:  9, dau:  4, wau:  8, mau: 12, skillInvocations:  30, connectorInvocations:  90 },
    operations:  { coworkSessions: 38, activeUsers: 18, dau: 10, wau: 17, mau: 22, skillInvocations:  95, connectorInvocations: 250 },
  };

  return TEAMS.map(({ teamId, teamName }) => {
    const tokens = TEAM_TOKEN_BASE[teamId];
    const usage = data[teamId];
    const totalTokens = tokens.input + tokens.output + tokens.cacheRead;
    const estimatedCostUSD = calcCost(tokens.input, tokens.output, tokens.cacheRead, tokens.cacheWrite);
    return {
      teamId,
      teamName,
      ...usage,
      inputTokens: tokens.input,
      outputTokens: tokens.output,
      cacheReadTokens: tokens.cacheRead,
      cacheWriteTokens: tokens.cacheWrite,
      totalTokens,
      estimatedCostUSD,
    };
  });
}

// Returns daily token usage for a team (or all teams aggregated) for the given number of days
export function getDailyTokenUsage(teamId?: string, days = 30): DailyTokenUsage[] {
  const result: DailyTokenUsage[] = [];

  // Day-of-week multipliers: Mon=1, Tue=1.1, Wed=1.2, Thu=1.15, Fri=1.05, Sat=0.4, Sun=0.35
  const DOW_MULT = [0.35, 1.0, 1.1, 1.2, 1.15, 1.05, 0.4]; // 0=Sun..6=Sat

  const teamsToUse = teamId
    ? TEAMS.filter(t => t.teamId === teamId)
    : TEAMS;

  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(MODULE_INIT_TIME - d * 86_400_000);
    const dow = date.getDay();
    const mult = DOW_MULT[dow];
    const dateStr = date.toISOString().slice(0, 10);

    // Seed from day index for deterministic jitter
    const rand = seededRand(d * 7 + 42);

    let inputTokens = 0;
    let outputTokens = 0;
    let cacheReadTokens = 0;

    for (const team of teamsToUse) {
      const base = TEAM_TOKEN_BASE[team.teamId];
      const jitter = 0.85 + rand() * 0.30; // 0.85–1.15 jitter
      inputTokens     += Math.round((base.input     / 30) * mult * jitter);
      outputTokens    += Math.round((base.output    / 30) * mult * jitter);
      cacheReadTokens += Math.round((base.cacheRead / 30) * mult * jitter);
    }

    result.push({
      date: dateStr,
      inputTokens,
      outputTokens,
      cacheReadTokens,
      totalTokens: inputTokens + outputTokens + cacheReadTokens,
    });
  }

  return result;
}

const RESOURCES = ['google-drive', 'jira', 'slack', 'zoom', 'github', 'notion'];
const ACTIONS: Record<string, string[]> = {
  'google-drive': ['read_file', 'write_file', 'list_folder', 'share_document'],
  'jira':         ['create_issue', 'update_issue', 'list_issues', 'add_comment'],
  'slack':        ['send_message', 'read_channel', 'list_channels', 'upload_file'],
  'zoom':         ['create_meeting', 'get_recording', 'list_participants'],
  'github':       ['create_pr', 'read_file', 'push_commit', 'list_issues'],
  'notion':       ['read_page', 'write_page', 'create_database', 'query_database'],
};

const EVENT_TYPES: OtelEventType[] = [
  'tool_call', 'tool_call', 'tool_call', 'tool_call',    // 8%
  'connector_call', 'connector_call', 'connector_call', 'connector_call',  // 8%
  'file_read', 'file_read',                              // 4%
  'file_write', 'file_write',                            // 4%
  'skill_used', 'skill_used', 'skill_used',              // 6%
  'action_approved', 'action_approved', 'action_approved', // 6%
  'action_rejected', 'action_rejected',                  // 4%
  'token_limit_warning',                                 // 2%
];

export function getRecentOtelEvents(limit = 50): OtelEvent[] {
  const rand = seededRand(9999);
  const events: OtelEvent[] = [];

  for (let i = 0; i < limit; i++) {
    const teamIdx = Math.floor(rand() * TEAMS.length);
    const team = TEAMS[teamIdx];
    const typeIdx = Math.floor(rand() * EVENT_TYPES.length);
    const eventType = EVENT_TYPES[typeIdx];
    const resourceIdx = Math.floor(rand() * RESOURCES.length);
    const resource = RESOURCES[resourceIdx];
    const actions = ACTIONS[resource];
    const action = actions[Math.floor(rand() * actions.length)];
    const userNum = Math.floor(rand() * team.memberCount) + 1;
    const durationMs = Math.floor(rand() * 480) + 40; // 40–520ms
    // Spread events over last 2 hours (7200 seconds), newest first in sort
    const offsetMs = Math.floor(rand() * 7_200_000);
    const timestamp = new Date(MODULE_INIT_TIME - offsetMs).toISOString();

    const hasTokenCost = eventType === 'tool_call' || eventType === 'connector_call';
    const inputTok = hasTokenCost ? Math.floor(rand() * 2000) + 200 : undefined;
    const outputTok = hasTokenCost ? Math.floor(rand() * 800) + 50 : undefined;

    events.push({
      eventId: `evt-${i.toString().padStart(3, '0')}-${team.teamId.slice(0, 3)}`,
      timestamp,
      teamId: team.teamId,
      teamName: team.teamName,
      userId: `${team.teamId.slice(0, 3)}-user-${userNum}`,
      eventType,
      resource,
      action,
      approvalMode: rand() > 0.4 ? 'auto' : 'manual',
      durationMs,
      tokenCost: hasTokenCost && inputTok !== undefined && outputTok !== undefined
        ? { inputTokens: inputTok, outputTokens: outputTok, totalTokens: inputTok + outputTok }
        : undefined,
      metadata: {
        traceId: `trace-${Math.floor(rand() * 0xFFFFFF).toString(16).padStart(6, '0')}`,
        sessionId: `sess-${Math.floor(rand() * 9999).toString().padStart(4, '0')}`,
        success: eventType !== 'action_rejected',
        retryCount: Math.floor(rand() * 3),
      },
    });
  }

  // Sort newest first
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getOrgSummary(period: '7d' | '30d' | '90d'): OrgSummary {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const daily = getDailyTokenUsage(undefined, Math.min(days, 30));

  // Scale to period if > 30 days
  const scale = days > 30 ? days / 30 : 1;

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCacheReadTokens = 0;

  for (const d of daily) {
    totalInputTokens     += d.inputTokens;
    totalOutputTokens    += d.outputTokens;
    totalCacheReadTokens += d.cacheReadTokens;
  }

  totalInputTokens     = Math.round(totalInputTokens     * scale);
  totalOutputTokens    = Math.round(totalOutputTokens    * scale);
  totalCacheReadTokens = Math.round(totalCacheReadTokens * scale);

  const totalTokens = totalInputTokens + totalOutputTokens + totalCacheReadTokens;
  const metrics = getUsageMetrics();
  const totalActiveUsers = metrics.reduce((s, m) => s + m.activeUsers, 0);
  const totalCoworkSessions = Math.round(
    metrics.reduce((s, m) => s + m.coworkSessions, 0) * (days / 30)
  );
  const totalEstimatedCostUSD = metrics.reduce((s, m) => s + m.estimatedCostUSD, 0) * (days / 30);
  const avgTokensPerSession = totalCoworkSessions > 0
    ? Math.round(totalTokens / totalCoworkSessions)
    : 0;

  return {
    totalTeams: TEAMS.length,
    totalActiveUsers,
    totalCoworkSessions,
    totalInputTokens,
    totalOutputTokens,
    totalCacheReadTokens,
    totalTokens,
    totalEstimatedCostUSD,
    avgTokensPerSession,
    period,
  };
}
