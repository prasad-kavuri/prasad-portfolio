'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, ChevronRight, KeyRound, Lock, Mail, Unlock, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type StepState = 'idle' | 'loading' | 'done' | 'error';

interface HttpPanel {
  method: string;
  url: string;
  body?: object;
  response?: object;
  status?: number;
  durationMs?: number;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StepBadge({ n, done }: { n: number; done: boolean }) {
  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
      style={done
        ? { background: 'var(--accent-brand)', color: 'var(--accent-brand-foreground)' }
        : { background: 'var(--muted)', color: 'var(--muted-foreground)' }}
    >
      {done ? <Check className="h-3.5 w-3.5" /> : n}
    </span>
  );
}

function HttpDisplay({ panel }: { panel: HttpPanel }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 text-xs font-mono overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2 bg-muted/50">
        <span className="font-semibold text-foreground">{panel.method}</span>
        <span className="text-muted-foreground truncate">{panel.url}</span>
        {panel.status && (
          <span className={`ml-auto font-bold ${panel.status < 300 ? 'text-green-500' : 'text-red-500'}`}>
            {panel.status}
          </span>
        )}
        {panel.durationMs !== undefined && (
          <span className="text-muted-foreground/70">{panel.durationMs}ms</span>
        )}
      </div>
      {panel.body && (
        <div className="px-3 py-2 border-b border-border">
          <p className="text-muted-foreground mb-1">Request body:</p>
          <pre className="text-foreground whitespace-pre-wrap break-all">
            {JSON.stringify(panel.body, null, 2)}
          </pre>
        </div>
      )}
      {panel.response && (
        <div className="px-3 py-2">
          <p className="text-muted-foreground mb-1">Response:</p>
          <pre className="text-foreground whitespace-pre-wrap break-all">
            {JSON.stringify(panel.response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AgentAuthDemoPage() {
  // Step 1 state
  const [step1State, setStep1State] = useState<StepState>('idle');
  const [step1Panel, setStep1Panel] = useState<HttpPanel | null>(null);
  const [credential, setCredential] = useState<string>('');
  const [claimToken, setClaimToken] = useState<string>('');

  // Step 2 state
  const [email, setEmail] = useState('');
  const [step2State, setStep2State] = useState<StepState>('idle');
  const [step2Panel, setStep2Panel] = useState<HttpPanel | null>(null);
  const [claimId, setClaimId] = useState('');
  const [otp, setOtp] = useState('');

  // Step 3 state
  const [otpInput, setOtpInput] = useState('');
  const [step3State, setStep3State] = useState<StepState>('idle');
  const [step3Panel, setStep3Panel] = useState<HttpPanel | null>(null);
  const [claimedCredential, setClaimedCredential] = useState('');

  // Step 4 state
  const [mcpQuery, setMcpQuery] = useState("What are Prasad's strongest AI platform capabilities?");
  const [step4State, setStep4State] = useState<StepState>('idle');
  const [step4Panel, setStep4Panel] = useState<HttpPanel | null>(null);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  async function handleAnonymousStart() {
    setStep1State('loading');
    const reqBody = { type: 'anonymous_start' };
    const t0 = Date.now();
    try {
      const res = await fetch('/api/agent-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody),
      });
      const data = await res.json() as Record<string, unknown>;
      const ms = Date.now() - t0;
      setStep1Panel({ method: 'POST', url: '/api/agent-auth', body: reqBody, response: data, status: res.status, durationMs: ms });
      if (res.ok) {
        setCredential(String(data.credential ?? ''));
        setClaimToken(String(data.claim_token ?? ''));
        setStep1State('done');
      } else {
        setStep1State('error');
      }
    } catch {
      setStep1State('error');
    }
  }

  async function handleClaimInit() {
    if (!email) return;
    setStep2State('loading');
    const reqBody = { type: 'claim_init', claim_token: claimToken, email };
    const t0 = Date.now();
    try {
      const res = await fetch('/api/agent-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody),
      });
      const data = await res.json() as Record<string, unknown>;
      const ms = Date.now() - t0;
      setStep2Panel({ method: 'POST', url: '/api/agent-auth', body: { ...reqBody, claim_token: '…' }, response: data, status: res.status, durationMs: ms });
      if (res.ok) {
        setClaimId(String(data.claim_id ?? ''));
        setOtp(String(data.otp ?? ''));
        setOtpInput(String(data.otp ?? ''));
        setStep2State('done');
      } else {
        setStep2State('error');
      }
    } catch {
      setStep2State('error');
    }
  }

  async function handleClaimComplete() {
    setStep3State('loading');
    const reqBody = { type: 'claim_complete', claim_id: claimId, otp: otpInput };
    const t0 = Date.now();
    try {
      const res = await fetch('/api/agent-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody),
      });
      const data = await res.json() as Record<string, unknown>;
      const ms = Date.now() - t0;
      setStep3Panel({ method: 'POST', url: '/api/agent-auth', body: reqBody, response: data, status: res.status, durationMs: ms });
      if (res.ok) {
        setClaimedCredential(String(data.credential ?? ''));
        setStep3State('done');
      } else {
        setStep3State('error');
      }
    } catch {
      setStep3State('error');
    }
  }

  async function handleMcpCall() {
    const token = claimedCredential || credential;
    if (!token || !mcpQuery) return;
    setStep4State('loading');
    const reqBody = { query: mcpQuery };
    const t0 = Date.now();
    try {
      const res = await fetch('/api/mcp-demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(reqBody),
      });
      const data = await res.json() as Record<string, unknown>;
      const ms = Date.now() - t0;
      setStep4Panel({
        method: 'POST',
        url: '/api/mcp-demo',
        body: reqBody,
        response: data,
        status: res.status,
        durationMs: ms,
      });
      setStep4State(res.ok ? 'done' : 'error');
    } catch {
      setStep4State('error');
    }
  }

  const activeToken = claimedCredential || credential;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <Link href="/demos" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-3 w-3" /> All demos
          </Link>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-foreground">Agent Auth Demo</h1>
            <Badge variant="default">Live</Badge>
            <Badge variant="secondary">auth.md protocol</Badge>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Live implementation of the <a href="https://github.com/workos/auth.md" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">auth.md open protocol</a> — the emerging standard for AI agents to register with services without sign-up forms. Register anonymously, claim with email + OTP, then use the credential to call the MCP tools endpoint.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <a href="/auth.md" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors">
              <KeyRound className="h-3 w-3" /> auth.md
            </a>
            <a href="/.well-known/oauth-protected-resource" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors">
              <Lock className="h-3 w-3" /> protected-resource
            </a>
          </div>
        </div>

        {/* Protocol explainer */}
        <div className="mb-8 rounded-xl border border-border bg-muted/20 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">How it works</p>
          <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
            {[
              { icon: <Unlock className="h-3.5 w-3.5" />, label: 'Anonymous start' },
              { icon: <ChevronRight className="h-3.5 w-3.5" />, label: null },
              { icon: <Mail className="h-3.5 w-3.5" />, label: 'Claim with OTP' },
              { icon: <ChevronRight className="h-3.5 w-3.5" />, label: null },
              { icon: <KeyRound className="h-3.5 w-3.5" />, label: 'Claimed credential' },
              { icon: <ChevronRight className="h-3.5 w-3.5" />, label: null },
              { icon: <Zap className="h-3.5 w-3.5" />, label: 'Authenticated MCP call' },
            ].map((item, i) =>
              item.label
                ? <span key={i} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5">{item.icon}{item.label}</span>
                : <span key={i} className="text-muted-foreground/40">{item.icon}</span>
            )}
          </div>
        </div>

        <div className="space-y-6">

          {/* ── Step 1: Anonymous Start ───────────────────────────────── */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start gap-3 mb-4">
              <StepBadge n={1} done={step1State === 'done'} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">Register (anonymous_start)</p>
                <p className="text-sm text-muted-foreground mt-0.5">Agent hits the registration endpoint. Receives a scoped Bearer token immediately — no email required.</p>
              </div>
            </div>
            <button
              onClick={() => { void handleAnonymousStart(); }}
              disabled={step1State === 'loading'}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
              style={{ background: 'var(--accent-brand)' }}
            >
              {step1State === 'loading' ? 'Registering…' : 'POST /api/agent-auth'}
            </button>
            {step1Panel && <div className="mt-4"><HttpDisplay panel={step1Panel} /></div>}
            {step1State === 'done' && credential && (
              <div className="mt-3 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2 text-xs font-mono text-green-400 break-all">
                ✓ credential: {credential.slice(0, 48)}…
              </div>
            )}
          </div>

          {/* ── Step 2: Claim Init ────────────────────────────────────── */}
          <div className={`rounded-xl border bg-card p-5 transition-opacity ${step1State !== 'done' ? 'opacity-40 pointer-events-none' : 'border-border'}`}>
            <div className="flex items-start gap-3 mb-4">
              <StepBadge n={2} done={step2State === 'done'} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">Initiate claim (claim_init)</p>
                <p className="text-sm text-muted-foreground mt-0.5">Agent binds the credential to an email. In production an OTP email is sent; here it&apos;s returned inline for the demo.</p>
              </div>
            </div>
            <div className="flex gap-2 mb-4">
              <input
                type="email"
                placeholder="agent@yourcompany.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                onClick={() => { void handleClaimInit(); }}
                disabled={step2State === 'loading' || !email}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
                style={{ background: 'var(--accent-brand)' }}
              >
                {step2State === 'loading' ? 'Sending…' : 'Claim'}
              </button>
            </div>
            {step2Panel && <HttpDisplay panel={step2Panel} />}
            {step2State === 'done' && otp && (
              <div className="mt-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-3 py-2 text-sm font-mono text-yellow-400">
                OTP (demo inline delivery): <span className="font-bold text-lg tracking-widest">{otp}</span>
              </div>
            )}
          </div>

          {/* ── Step 3: Claim Complete ────────────────────────────────── */}
          <div className={`rounded-xl border bg-card p-5 transition-opacity ${step2State !== 'done' ? 'opacity-40 pointer-events-none' : 'border-border'}`}>
            <div className="flex items-start gap-3 mb-4">
              <StepBadge n={3} done={step3State === 'done'} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">Complete claim (claim_complete)</p>
                <p className="text-sm text-muted-foreground mt-0.5">Agent submits the OTP. Token is upgraded to a claimed (email-bound) credential with a 24-hour TTL.</p>
              </div>
            </div>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="6-digit OTP"
                maxLength={6}
                value={otpInput}
                onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))}
                className="w-36 rounded-lg border border-border bg-background px-3 py-2 text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                onClick={() => { void handleClaimComplete(); }}
                disabled={step3State === 'loading' || otpInput.length !== 6}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
                style={{ background: 'var(--accent-brand)' }}
              >
                {step3State === 'loading' ? 'Verifying…' : 'Verify OTP'}
              </button>
            </div>
            {step3Panel && <HttpDisplay panel={step3Panel} />}
            {step3State === 'done' && claimedCredential && (
              <div className="mt-3 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2 text-xs font-mono text-green-400 break-all">
                ✓ claimed credential: {claimedCredential.slice(0, 48)}…
              </div>
            )}
          </div>

          {/* ── Step 4: Authenticated MCP Call ───────────────────────── */}
          <div className={`rounded-xl border bg-card p-5 transition-opacity ${!credential ? 'opacity-40 pointer-events-none' : 'border-border'}`}>
            <div className="flex items-start gap-3 mb-4">
              <StepBadge n={4} done={step4State === 'done'} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">Call MCP tools (authenticated)</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Uses{' '}
                  <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">Authorization: Bearer {activeToken ? `${activeToken.slice(0, 12)}…` : '<token>'}</span>
                  {' '}— the response includes <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">auth_context</span> confirming identity and scopes.
                </p>
              </div>
            </div>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={mcpQuery}
                onChange={e => setMcpQuery(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                onClick={() => { void handleMcpCall(); }}
                disabled={step4State === 'loading' || !mcpQuery}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 transition-opacity whitespace-nowrap"
                style={{ background: 'var(--accent-brand)' }}
              >
                {step4State === 'loading' ? 'Calling…' : 'Call MCP'}
              </button>
            </div>
            {step4Panel && <HttpDisplay panel={step4Panel} />}
          </div>

        </div>

        {/* Protocol context */}
        <div className="mt-10 rounded-xl border border-border bg-muted/20 p-5 text-sm text-muted-foreground space-y-2">
          <p className="font-semibold text-foreground text-xs uppercase tracking-widest mb-3">Why this matters</p>
          <p>auth.md solves the &quot;agent registration problem&quot; — the missing primitive that forces developers to either expose raw API keys to agents or build bespoke onboarding flows per service. The protocol composes existing OAuth standards (RFC 9728 Protected Resource Metadata, ID-JAG identity assertions) with a discoverable Markdown file that any agent can parse.</p>
          <p>This demo implements the <strong>user claimed</strong> flow — the agent initiates registration, the user confirms with an OTP, and the credential is bound to a real identity. The <strong>agent verified</strong> flow (where a trusted platform like Anthropic attests identity via ID-JAG) is the production path once agent providers publish JWKS endpoints.</p>
          <p className="font-mono text-xs">
            Discovery:{' '}
            <a href="/auth.md" className="underline hover:text-foreground">/auth.md</a>
            {' · '}
            <a href="/.well-known/oauth-protected-resource" className="underline hover:text-foreground">/.well-known/oauth-protected-resource</a>
            {' · '}
            <a href="https://github.com/workos/auth.md" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">spec on GitHub</a>
          </p>
        </div>

        <div className="mt-6">
          <Link href="/demos" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to demos
          </Link>
        </div>
      </div>
    </div>
  );
}
