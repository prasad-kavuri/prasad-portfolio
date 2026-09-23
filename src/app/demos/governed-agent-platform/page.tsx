'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, Lock, Network, Rocket, ShieldAlert, Undo2, Workflow } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { PAYMENT_EXCEPTIONS } from '@/data/flagship-scenarios';
import { generateClientTraceId } from '@/lib/observability';

interface AgentCardView {
  name: string;
  version: string;
  supportedInterfaces: { url: string; protocolBinding: string; protocolVersion: string }[];
  skills: { id: string; name: string }[];
}

interface Span {
  spanId: string;
  tool: string;
  principal: string;
  decision: 'allowed' | 'denied' | 'blocked';
  reason?: string;
  durationMs: number;
}

interface Review {
  outcome: string;
  summary: string;
  trace: Span[];
  trajectory: string[];
  payment?: { paymentRef: string; approvalRef: string } | null;
  approvalRequest?: { amountUsd: number; thresholdUsd: number | null; reason: string };
}

interface TaskView {
  id: string;
  contextId: string;
  state: string;
  review?: Review;
}

interface CaseScore {
  exceptionId: string;
  title: string;
  actualTrajectory: string[];
  expectedOutcome: string;
  actualOutcome: string;
  exactMatch: boolean;
  safetyViolation: boolean;
}

interface VersionScore {
  label: string;
  change: string;
  exactMatchRate: number;
  meanToolRecall: number;
  outcomeAccuracy: number;
  safetyViolations: number;
  cases: CaseScore[];
}

interface Gate {
  production: VersionScore;
  candidate: VersionScore;
  canaryTrafficPercent: number;
  decision: 'promote' | 'rollback';
  reasons: string[];
}

const STATE_STYLE: Record<string, string> = {
  TASK_STATE_COMPLETED: 'bg-green-500/15 text-green-600 dark:text-green-400',
  TASK_STATE_INPUT_REQUIRED: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  TASK_STATE_AUTH_REQUIRED: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  TASK_STATE_REJECTED: 'bg-red-500/15 text-red-600 dark:text-red-400',
};

const pct = (n: number) => `${Math.round(n * 100)}%`;

async function a2a(method: string, params: object, token: string | null) {
  const res = await fetch('/api/a2a', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'A2A-Version': '1.0',
      'x-trace-id': generateClientTraceId(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
  });
  const body = (await res.json()) as { result?: { task?: Record<string, unknown> }; error?: { message: string } };
  if (!res.ok || body.error) throw new Error(body.error?.message ?? `A2A request failed (${res.status})`);
  const task = body.result?.task as { id: string; contextId: string; status: { state: string }; metadata?: { review?: Review } } | undefined;
  if (!task) throw new Error('The agent did not return a task');
  return { id: task.id, contextId: task.contextId, state: task.status.state, review: task.metadata?.review } satisfies TaskView;
}

function Step({ n, title, icon: Icon, children }: { n: number; title: string; icon: typeof Network; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: 'var(--accent-brand)' }}>{n}</span>
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
        <h2 className="font-semibold">{title}</h2>
      </div>
      {children}
    </Card>
  );
}

function TraceTable({ spans }: { spans: Span[] }) {
  if (spans.length === 0) return <p className="text-xs text-muted-foreground">No tool calls — the request stopped before the gateway.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs" data-testid="gateway-trace">
        <thead className="text-muted-foreground">
          <tr><th className="py-1 pr-3 font-medium">Tool</th><th className="py-1 pr-3 font-medium">Principal</th><th className="py-1 pr-3 font-medium">Gateway decision</th><th className="py-1 font-medium">ms</th></tr>
        </thead>
        <tbody className="font-mono">
          {spans.map((s) => (
            <tr key={s.spanId} className="border-t border-border">
              <td className="py-1 pr-3">{s.tool}</td>
              <td className="py-1 pr-3">{s.principal}</td>
              <td className={`py-1 pr-3 ${s.decision === 'allowed' ? 'text-green-600 dark:text-green-400' : s.decision === 'blocked' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {s.decision}{s.reason ? ` · ${s.reason}` : ''}
              </td>
              <td className="py-1">{s.durationMs}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function GovernedAgentPlatformPage() {
  const [card, setCard] = useState<AgentCardView | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [scopes, setScopes] = useState<string[]>([]);
  const [scenarioId, setScenarioId] = useState('PX-1002');
  const [task, setTask] = useState<TaskView | null>(null);
  const [gate, setGate] = useState<Gate | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(label);
    setError('');
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusy(null);
    }
  }

  const discover = () => run('discover', async () => {
    const res = await fetch('/.well-known/agent-card.json');
    setCard((await res.json()) as AgentCardView);
  });

  const authenticate = () => run('auth', async () => {
    const res = await fetch('/api/agent-auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'anonymous_start' }) });
    const body = (await res.json()) as { credential?: string; scopes?: string[]; error?: string };
    if (!res.ok || !body.credential) throw new Error(body.error ?? 'Could not obtain a credential');
    setToken(body.credential);
    setScopes(body.scopes ?? []);
  });

  const delegate = (withCredential: boolean) => run('delegate', async () => {
    setTask(await a2a('SendMessage', { message: { messageId: crypto.randomUUID(), role: 'ROLE_USER', parts: [{ data: { exceptionId: scenarioId } }] } }, withCredential ? token : null));
  });

  const decide = (decision: 'approve' | 'reject') => run(decision, async () => {
    if (!task) return;
    setTask(await a2a('SendMessage', { message: { messageId: crypto.randomUUID(), role: 'ROLE_USER', taskId: task.id, contextId: task.contextId, parts: [{ data: { decision } }] } }, token));
  });

  const evaluate = () => run('gate', async () => {
    const res = await fetch('/api/flagship/release-gate');
    if (!res.ok) throw new Error('Release gate request failed');
    setGate((await res.json()) as Gate);
  });

  const scenario = PAYMENT_EXCEPTIONS.find((s) => s.exceptionId === scenarioId);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/demos" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to demos
        </Link>
        <ThemeToggle />
      </div>

      <header className="mb-8">
        <Badge variant="outline" className="mb-3">Flagship · reference implementation</Badge>
        <h1 className="text-3xl font-bold">Governed Agent Platform</h1>
        <p className="mt-3 text-muted-foreground">
          One task, end to end, on real protocol endpoints: discover an A2A v1.0 agent, authenticate, delegate a
          payment-exception review, enforce per-tool policy at a gateway, pause for human approval, withhold poisoned
          data, trace every call — then gate a release on trajectory evaluation.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Northwind Finance and every vendor, invoice, and amount are fictional. The agent is deterministic (no model
          calls), so each run is reproducible. No money moves.
        </p>
      </header>

      <div className="space-y-5">
        <Step n={1} title="Discover — A2A Agent Card" icon={Network}>
          <Button size="sm" onClick={() => void discover()} disabled={busy !== null}>
            {busy === 'discover' ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}Fetch /.well-known/agent-card.json
          </Button>
          {card && (
            <div className="mt-3 text-sm">
              <p><span className="font-semibold">{card.name}</span> · v{card.version}</p>
              <p className="font-mono text-xs text-muted-foreground">{card.supportedInterfaces[0]?.protocolBinding} · A2A {card.supportedInterfaces[0]?.protocolVersion} · {card.supportedInterfaces[0]?.url}</p>
              <p className="mt-1 text-xs text-muted-foreground">Skills: {card.skills.map((s) => s.name).join(' · ')}</p>
            </div>
          )}
        </Step>

        <Step n={2} title="Identify — delegated credential" icon={KeyRound}>
          <p className="mb-3 text-xs text-muted-foreground">
            Reads run on your delegated credential. Releasing a payment runs under the agent&apos;s own service identity, and
            the gateway additionally requires a recorded approval.
          </p>
          <Button size="sm" onClick={() => void authenticate()} disabled={busy !== null}>
            {busy === 'auth' ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}Get anonymous credential (auth.md)
          </Button>
          {token && <p className="mt-2 font-mono text-xs">token {token.slice(0, 14)}… · scopes: {scopes.join(', ')}</p>}
        </Step>

        <Step n={3} title="Delegate — A2A task through the tool gateway" icon={Workflow}>
          <div className="mb-3 grid gap-2 sm:grid-cols-2">
            {PAYMENT_EXCEPTIONS.map((s) => (
              <button
                key={s.exceptionId}
                onClick={() => { setScenarioId(s.exceptionId); setTask(null); }}
                aria-pressed={scenarioId === s.exceptionId}
                className={`rounded-lg border p-3 text-left text-xs transition-colors ${scenarioId === s.exceptionId ? 'border-[color:var(--accent-brand)] bg-muted/40' : 'border-border hover:bg-muted/30'}`}
              >
                <span className="font-mono font-semibold">{s.exceptionId}</span> · {s.title}
                <span className="mt-1 block text-muted-foreground">${s.amountUsd.toLocaleString('en-US')} · {s.summary}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void delegate(true)} disabled={busy !== null || !token}>
              {busy === 'delegate' ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}Send {scenario?.exceptionId} to the agent
            </Button>
            <Button size="sm" variant="outline" onClick={() => void delegate(false)} disabled={busy !== null}>
              Send without a credential
            </Button>
          </div>
          {!token && <p className="mt-2 text-xs text-muted-foreground">Get a credential in step 2 first — or send without one to see AUTH_REQUIRED.</p>}

          {task && (
            <div className="mt-4 space-y-3" data-testid="task-panel">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded px-2 py-0.5 font-mono font-semibold ${STATE_STYLE[task.state] ?? 'bg-muted'}`}>{task.state}</span>
                <span className="font-mono text-muted-foreground">task {task.id.slice(0, 8)}…</span>
              </div>
              {task.review && <p className="text-sm">{task.review.summary}</p>}
              {task.review && <TraceTable spans={task.review.trace} />}

              {task.state === 'TASK_STATE_INPUT_REQUIRED' && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                    <Lock className="mr-1 inline size-4" aria-hidden="true" />Human approval required
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {task.review?.approvalRequest?.reason}. The task is paused on the server; approving resumes the same A2A task
                    exactly once. In this public demo you act as the approver.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => void decide('approve')} disabled={busy !== null}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => void decide('reject')} disabled={busy !== null}>Reject</Button>
                  </div>
                </div>
              )}

              {task.review?.payment && (
                <p className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400">
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  {task.review.payment.paymentRef} · approval ref <span className="font-mono">{task.review.payment.approvalRef}</span>
                </p>
              )}
              {task.review?.trace.some((s) => s.decision === 'blocked') && (
                <p className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                  <ShieldAlert className="size-4" aria-hidden="true" />The gateway withheld tool output containing injected instructions; the agent escalated instead of obeying it.
                </p>
              )}
            </div>
          )}
        </Step>

        <Step n={4} title="Evaluate & release — trajectory eval gates a canary" icon={Rocket}>
          <p className="mb-3 text-xs text-muted-foreground">
            A candidate revision (v2) skips the duplicate-payment check to save latency. Before it gets more than a 10% canary,
            both revisions run against golden scenarios and are scored on the tools they called and the decisions they made.
          </p>
          <Button size="sm" onClick={() => void evaluate()} disabled={busy !== null}>
            {busy === 'gate' ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}Run release gate
          </Button>
          {gate && (
            <div className="mt-4 space-y-3" data-testid="release-gate">
              <div className="grid gap-3 sm:grid-cols-2">
                {[gate.production, gate.candidate].map((v) => (
                  <div key={v.label} className="rounded-lg border border-border p-3 text-xs">
                    <p className="font-semibold">{v.label}</p>
                    <p className="mt-1 text-muted-foreground">{v.change}</p>
                    <ul className="mt-2 space-y-0.5 font-mono">
                      <li>trajectory exact-match {pct(v.exactMatchRate)}</li>
                      <li>required-tool recall {pct(v.meanToolRecall)}</li>
                      <li>outcome accuracy {pct(v.outcomeAccuracy)}</li>
                      <li className={v.safetyViolations > 0 ? 'text-red-600 dark:text-red-400' : ''}>safety violations {v.safetyViolations}</li>
                    </ul>
                  </div>
                ))}
              </div>
              <div className={`rounded-lg border p-3 text-sm ${gate.decision === 'rollback' ? 'border-red-500/40 bg-red-500/5' : 'border-green-500/40 bg-green-500/5'}`}>
                <p className="flex items-center gap-2 font-semibold">
                  {gate.decision === 'rollback' ? <Undo2 className="size-4" aria-hidden="true" /> : <CheckCircle2 className="size-4" aria-hidden="true" />}
                  {gate.decision === 'rollback' ? `Rollback — canary (${gate.canaryTrafficPercent}%) reverted, v1 keeps 100% of traffic` : 'Promote candidate'}
                </p>
                <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">
                  {gate.reasons.map((r) => <li key={r}>{r}</li>)}
                </ul>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-muted-foreground"><tr><th className="py-1 pr-3 font-medium">Scenario</th><th className="py-1 pr-3 font-medium">Expected</th><th className="py-1 pr-3 font-medium">Candidate did</th><th className="py-1 font-medium">Trajectory</th></tr></thead>
                  <tbody>
                    {gate.candidate.cases.map((c) => (
                      <tr key={c.exceptionId} className="border-t border-border">
                        <td className="py-1 pr-3 font-mono">{c.exceptionId}</td>
                        <td className="py-1 pr-3">{c.expectedOutcome}</td>
                        <td className={`py-1 pr-3 ${c.safetyViolation ? 'font-semibold text-red-600 dark:text-red-400' : ''}`}>{c.actualOutcome}</td>
                        <td className="py-1 font-mono">{c.actualTrajectory.join(' → ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Step>

        {error && <p className="rounded-lg border border-red-500/40 bg-red-500/5 p-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

        <Card className="p-5 text-sm">
          <h2 className="mb-2 font-semibold">Connect your own agent</h2>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li><span className="font-semibold text-foreground">A2A:</span> card at <code className="font-mono">/.well-known/agent-card.json</code>, JSON-RPC at <code className="font-mono">/api/a2a</code> (send <code className="font-mono">A2A-Version: 1.0</code>).</li>
            <li><span className="font-semibold text-foreground">MCP:</span> Streamable HTTP server at <code className="font-mono">https://www.prasadkavuri.com/api/mcp</code> (official SDK, protocol 2025-11-25). Add it as a remote MCP server in any MCP client.</li>
            <li><span className="font-semibold text-foreground">Credentials:</span> <Link href="/auth.md" className="underline">auth.md</Link> issues Bearer tokens with <code className="font-mono">read:profile</code> and <code className="font-mono">finance:sandbox</code>.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
