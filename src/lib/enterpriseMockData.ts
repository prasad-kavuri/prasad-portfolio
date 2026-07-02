import type {
  TeamPermissions,
  TeamSpendConfig,
  UsageMetrics,
  DailyTokenUsage,
  OtelEvent,
  OtelEventType,
  OrgSummary,
  KvCacheMetrics,
  KvCacheModelMetrics,
  KvCacheDailyMetrics,
  AgentVersion,
  SessionOverride,
  RolloutEvent,
  AgentLifecycleSnapshot,
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

export function getKvCacheMetrics(period: '7d' | '30d' | '90d'): KvCacheMetrics {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const rand = seededRand(0xc4c4e);

  // Per-model stats — representative of a multi-model serving fleet
  const modelDefs = [
    { model: 'claude-sonnet-4',  baseHit: 0.79, ttftBase: 2800, ttftCached: 380 },
    { model: 'claude-haiku-4',   baseHit: 0.86, ttftBase: 1100, ttftCached: 160 },
    { model: 'llama-3.3-70b',    baseHit: 0.63, ttftBase: 3400, ttftCached: 520 },
    { model: 'llama-3.1-8b',     baseHit: 0.71, ttftBase: 900,  ttftCached: 120 },
    { model: 'mixtral-8x7b',     baseHit: 0.58, ttftBase: 2200, ttftCached: 340 },
  ];

  const byModel: KvCacheModelMetrics[] = modelDefs.map(m => {
    const jitter = (rand() - 0.5) * 0.04;
    const hitRate = Math.min(0.95, Math.max(0.40, m.baseHit + jitter));
    const requestsPerDay = Math.round(200 + rand() * 800);
    const totalRequests = requestsPerDay * days;
    const tokensFromCache = Math.round(totalRequests * hitRate * (1200 + rand() * 800));
    // GPU hour savings: each cache hit avoids ~0.0002 GPU-hours of prefill compute
    const gpuHoursSaved = Math.round(totalRequests * hitRate * 0.00022 * 10) / 10;
    // Cost saved: cache reads are $0.30/MTok vs $3/MTok input
    const costSaved = Math.round(tokensFromCache * (3 - 0.30) / 1_000_000 * 100) / 100;
    return {
      model: m.model,
      cacheHitRate: Math.round(hitRate * 1000) / 1000,
      ttftWithCacheMs: m.ttftCached,
      ttftWithoutCacheMs: m.ttftBase,
      tokensFromCache,
      estimatedGpuHoursSaved: gpuHoursSaved,
      estimatedCostSavedUSD: costSaved,
    };
  });

  // Daily trend
  const now = MODULE_INIT_TIME;
  const dailyTrend: KvCacheDailyMetrics[] = Array.from({ length: Math.min(days, 30) }, (_, i) => {
    const d = new Date(now - (Math.min(days, 30) - 1 - i) * 86_400_000);
    const dateStr = d.toISOString().slice(0, 10);
    const baseHit = 0.68 + i * 0.003; // gradual improvement as cache warms
    const jitter = (rand() - 0.5) * 0.06;
    const hitRate = Math.min(0.92, Math.max(0.50, baseHit + jitter));
    const requests = Math.round(1800 + rand() * 1200);
    return {
      date: dateStr,
      cacheHitRate: Math.round(hitRate * 1000) / 1000,
      requestsServed: requests,
      tokensFromCache: Math.round(requests * hitRate * 1400),
      ttftP50Ms: Math.round(380 + rand() * 200),
      ttftP99Ms: Math.round(900 + rand() * 600),
    };
  });

  const overallHitRate = byModel.reduce((s, m) => s + m.cacheHitRate, 0) / byModel.length;
  const totalRequests = dailyTrend.reduce((s, day) => s + day.requestsServed, 0);

  return {
    period,
    overallCacheHitRate: Math.round(overallHitRate * 1000) / 1000,
    totalRequestsServed: totalRequests,
    totalTokensFromCache: byModel.reduce((s, m) => s + m.tokensFromCache, 0),
    totalGpuHoursSaved: Math.round(byModel.reduce((s, m) => s + m.estimatedGpuHoursSaved, 0) * 10) / 10,
    totalCostSavedUSD: Math.round(byModel.reduce((s, m) => s + m.estimatedCostSavedUSD, 0) * 100) / 100,
    avgTtftWithCacheMs: 304,
    avgTtftWithoutCacheMs: 2080,
    ttftImprovementPct: 85,
    byModel,
    byUseCase: [
      { useCase: 'RAG / retrieval',       cacheHitRate: 0.88, requestCount: Math.round(totalRequests * 0.35) },
      { useCase: 'Multi-turn chat',        cacheHitRate: 0.82, requestCount: Math.round(totalRequests * 0.28) },
      { useCase: 'Code generation',        cacheHitRate: 0.61, requestCount: Math.round(totalRequests * 0.20) },
      { useCase: 'Document summarisation', cacheHitRate: 0.74, requestCount: Math.round(totalRequests * 0.12) },
      { useCase: 'One-shot tasks',         cacheHitRate: 0.31, requestCount: Math.round(totalRequests * 0.05) },
    ],
    dailyTrend,
    storageUtilization: {
      gpuMemoryUsedGB:   38,
      gpuMemoryTotalGB:  80,
      cpuMemoryUsedGB:   142,
      cpuMemoryTotalGB:  256,
      diskUsedGB:        680,
      diskTotalGB:       2000,
    },
  };
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

// Agent lifecycle: prompt versioning, canary rollout, session overrides, rollback history
const AGENTS = [
  { agentName: 'Support Triage Agent',   base: 14 },
  { agentName: 'Sales Research Agent',   base: 8  },
  { agentName: 'Code Review Agent',      base: 21 },
];

export function getAgentLifecycle(): AgentLifecycleSnapshot {
  const rand = seededRand(4242);
  const now = MODULE_INIT_TIME;
  const day = 24 * 60 * 60 * 1000;

  const versions: AgentVersion[] = [];
  const rolloutEvents: RolloutEvent[] = [];
  let eventCounter = 0;

  AGENTS.forEach(({ agentName, base }) => {
    // Stable version, promoted ~14 days ago
    const stableVersion = `v${base}.0`;
    const stableCreatedAt = new Date(now - 14 * day).toISOString();
    const stablePromotedAt = new Date(now - 12 * day).toISOString();
    versions.push({
      versionId: stableVersion,
      agentName,
      promptHash: `sha256:${Math.floor(rand() * 0xfffff).toString(16)}`,
      stage: 'stable',
      trafficPct: 90,
      createdAt: stableCreatedAt,
      promotedAt: stablePromotedAt,
      approvedBy: 'prasad.kavuri',
      evalScore: 0.88 + rand() * 0.08,
      rollbackOf: null,
    });
    rolloutEvents.push({
      eventId: `evt-${eventCounter++}`,
      timestamp: stablePromotedAt,
      versionId: stableVersion,
      agentName,
      action: 'promote',
      actor: 'prasad.kavuri',
      note: `Promoted to stable after eval gate pass (30d canary)`,
    });

    // Canary version, in flight
    const canaryVersion = `v${base}.1`;
    const canaryCreatedAt = new Date(now - 3 * day).toISOString();
    versions.push({
      versionId: canaryVersion,
      agentName,
      promptHash: `sha256:${Math.floor(rand() * 0xfffff).toString(16)}`,
      stage: 'canary',
      trafficPct: 10,
      createdAt: canaryCreatedAt,
      promotedAt: null,
      approvedBy: 'prasad.kavuri',
      evalScore: 0.82 + rand() * 0.1,
      rollbackOf: null,
    });
    rolloutEvents.push({
      eventId: `evt-${eventCounter++}`,
      timestamp: canaryCreatedAt,
      versionId: canaryVersion,
      agentName,
      action: 'canary_start',
      actor: 'prasad.kavuri',
      note: 'Started 10% canary rollout behind session-override flag',
    });

    // One agent has a rolled-back version to show the rollback path
    if (base === 21) {
      const badVersion = `v${base - 1}.4`;
      const rolledBackAt = new Date(now - 20 * day).toISOString();
      versions.push({
        versionId: badVersion,
        agentName,
        promptHash: `sha256:${Math.floor(rand() * 0xfffff).toString(16)}`,
        stage: 'rolled_back',
        trafficPct: 0,
        createdAt: new Date(now - 22 * day).toISOString(),
        promotedAt: null,
        approvedBy: 'prasad.kavuri',
        evalScore: 0.61 + rand() * 0.05,
        rollbackOf: `v${base - 2}.0`,
      });
      rolloutEvents.push({
        eventId: `evt-${eventCounter++}`,
        timestamp: rolledBackAt,
        versionId: badVersion,
        agentName,
        action: 'rollback',
        actor: 'auto',
        note: 'Policy-triggered rollback: eval score dropped below 0.65 gate during canary window',
      });
    }
  });

  const overrides: SessionOverride[] = TEAMS.map((team, i) => ({
    overrideId: `ovr-${i}`,
    teamId: team.teamId,
    teamName: team.teamName,
    scope: (['model', 'temperature', 'tool_access', 'max_tokens'] as const)[i % 4],
    value: [
      'claude-sonnet-5',
      '0.2',
      'read_only',
      '4096',
    ][i % 4],
    reason: [
      'Cost-sensitive workload, pinned to lower-cost model tier',
      'Deterministic output required for compliance review workflow',
      'Restricted to read-only tools pending security review',
      'Latency-sensitive UI flow, capped response length',
    ][i % 4],
    setBy: 'prasad.kavuri',
    expiresAt: i % 2 === 0 ? null : new Date(now + 7 * day).toISOString(),
  })).filter((_, i) => i < 3); // keep it to a readable handful

  rolloutEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return { versions, overrides, rolloutEvents };
}
