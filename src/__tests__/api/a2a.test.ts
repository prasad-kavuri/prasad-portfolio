import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { NextRequest } from 'next/server';
import { _resetStore } from '@/lib/rate-limit';
import { _resetDurableStore } from '@/lib/durable-store';
import { issueToken } from '@/lib/agent-auth';
import { agentCardJson } from '@/lib/a2a/agent-card';
import { parseInput } from '@/lib/a2a/executor';

let rpcId = 0;
async function rpc(method: string, params: object, opts: { token?: string; version?: string | null } = {}) {
  const { POST } = await import('@/app/api/a2a/route');
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'x-forwarded-for': '6.6.6.6' };
  if (opts.version !== null) headers['A2A-Version'] = opts.version ?? '1.0';
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  const res = await POST(new NextRequest('http://localhost/api/a2a', { method: 'POST', headers, body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcId, method, params }) }));
  return { status: res.status, body: await res.json() };
}

const message = (parts: object[], extra: object = {}) => ({ message: { messageId: `m-${Math.random()}`, role: 'ROLE_USER', parts, ...extra } });
const sandboxToken = () => issueToken({ sub: 'anon-a2a', type: 'anonymous', scopes: ['read:profile', 'finance:sandbox'] }, 600);

describe('A2A v1.0 agent /api/a2a', () => {
  beforeEach(() => {
    _resetStore();
    _resetDurableStore();
  });

  it('publishes an agent card identical to the builder output', () => {
    const published = JSON.parse(readFileSync('public/.well-known/agent-card.json', 'utf8'));
    expect(published).toEqual(agentCardJson());
    expect(published.supportedInterfaces[0]).toMatchObject({ protocolBinding: 'JSONRPC', protocolVersion: '1.0' });
    expect(published.skills.map((s: { id: string }) => s.id)).toEqual(['profile-brief', 'payment-exception-review']);
  });

  it('answers profile-brief immediately with a message', async () => {
    const { body } = await rpc('SendMessage', message([{ text: 'Who is Prasad Kavuri?' }]));
    expect(body.result.message.parts[0].data.currentRole.company).toBe('Zip');
  });

  it('puts a payment review in AUTH_REQUIRED without a finance:sandbox credential', async () => {
    const { body } = await rpc('SendMessage', message([{ data: { exceptionId: 'PX-1001' } }]));
    expect(body.result.task.status.state).toBe('TASK_STATE_AUTH_REQUIRED');
  });

  it('cannot approve an AUTH_REQUIRED review into a release, even with a credential', async () => {
    const unauth = (await rpc('SendMessage', message([{ data: { exceptionId: 'PX-1002' } }]))).body.result.task;
    expect(unauth.status.state).toBe('TASK_STATE_AUTH_REQUIRED');
    const attempt = (await rpc('SendMessage', message([{ data: { decision: 'approve' } }], { taskId: unauth.id, contextId: unauth.contextId }), { token: await sandboxToken() })).body.result.task;
    expect(attempt.status.state).toBe('TASK_STATE_REJECTED');
    expect(attempt.artifacts ?? []).toHaveLength(0);
  });

  it('ignores an approval sent without an approver credential', async () => {
    const first = (await rpc('SendMessage', message([{ data: { exceptionId: 'PX-1002' } }]), { token: await sandboxToken() })).body.result.task;
    const anon = (await rpc('SendMessage', message([{ data: { decision: 'approve' } }], { taskId: first.id, contextId: first.contextId }))).body.result.task;
    expect(anon.status.state).toBe('TASK_STATE_INPUT_REQUIRED');
    expect(anon.artifacts ?? []).toHaveLength(0);
  });

  it('completes a routine review with an artifact containing the trajectory and trace', async () => {
    const { body } = await rpc('SendMessage', message([{ text: 'Review payment exception PX-1001' }]), { token: await sandboxToken() });
    const task = body.result.task;
    expect(task.status.state).toBe('TASK_STATE_COMPLETED');
    const artifact = task.artifacts[0].parts[0].data;
    expect(artifact.outcome).toBe('released');
    expect(artifact.trajectory).toEqual(['lookup_vendor', 'check_duplicate_payment', 'get_payment_policy', 'release_payment']);
  });

  it('pauses in INPUT_REQUIRED, resumes on approval across invocations, and rejects replay', async () => {
    const token = await sandboxToken();
    const first = (await rpc('SendMessage', message([{ data: { exceptionId: 'PX-1002' } }]), { token })).body.result.task;
    expect(first.status.state).toBe('TASK_STATE_INPUT_REQUIRED');
    expect(first.status.message.parts[1].data.approvalRequest.amountUsd).toBe(48500);

    const got = (await rpc('GetTask', { id: first.id })).body.result;
    expect(got.status.state).toBe('TASK_STATE_INPUT_REQUIRED');

    const nudge = (await rpc('SendMessage', message([{ text: 'hello?' }], { taskId: first.id, contextId: first.contextId }), { token })).body.result.task;
    expect(nudge.status.state).toBe('TASK_STATE_INPUT_REQUIRED');

    const approved = (await rpc('SendMessage', message([{ data: { decision: 'approve' } }], { taskId: first.id, contextId: first.contextId }), { token })).body.result.task;
    expect(approved.status.state).toBe('TASK_STATE_COMPLETED');
    expect(approved.artifacts[0].parts[0].data.payment.approvalRef).toMatch(/^a2a:/);

    const replay = await rpc('SendMessage', message([{ data: { decision: 'approve' } }], { taskId: first.id, contextId: first.contextId }), { token });
    expect(replay.body.error).toBeTruthy();
  });

  it('holds the payment when the approver rejects', async () => {
    const token = await sandboxToken();
    const first = (await rpc('SendMessage', message([{ data: { exceptionId: 'PX-1002' } }]), { token })).body.result.task;
    const rejected = (await rpc('SendMessage', message([{ text: 'reject' }], { taskId: first.id, contextId: first.contextId }), { token })).body.result.task;
    expect(rejected.artifacts[0].parts[0].data).toMatchObject({ outcome: 'rejected_by_approver', payment: null });
  });

  it('escalates poisoned vendor data instead of obeying it, and rejects unknown exceptions', async () => {
    const token = await sandboxToken();
    const poisoned = (await rpc('SendMessage', message([{ data: { exceptionId: 'px-1004' } }]), { token })).body.result.task;
    expect(poisoned.status.state).toBe('TASK_STATE_INPUT_REQUIRED');
    expect(poisoned.metadata.review.trace[0].decision).toBe('blocked');

    const unknown = (await rpc('SendMessage', message([{ data: { exceptionId: 'PX-9999' } }]), { token })).body.result.task;
    expect(unknown.status.state).toBe('TASK_STATE_REJECTED');
  });

  it('requires the A2A-Version header, validates JSON, and does not list tasks', async () => {
    expect((await rpc('SendMessage', message([{ text: 'hi' }]), { version: null })).status).toBe(400);
    expect((await rpc('ListTasks', {})).body.error).toBeTruthy();
    const { POST } = await import('@/app/api/a2a/route');
    const bad = await POST(new NextRequest('http://localhost/api/a2a', { method: 'POST', headers: { 'Content-Type': 'application/json', 'A2A-Version': '1.0' }, body: '{nope' }));
    expect(bad.status).toBe(400);
    const big = await POST(new NextRequest('http://localhost/api/a2a', { method: 'POST', headers: { 'Content-Type': 'application/json', 'A2A-Version': '1.0' }, body: 'x'.repeat(20_000) }));
    expect(big.status).toBe(413);
  });

  it('treats an invalid Bearer credential as unauthenticated', async () => {
    const { body } = await rpc('SendMessage', message([{ data: { exceptionId: 'PX-1001' } }]), { token: 'forged.token' });
    expect(body.result.task.status.state).toBe('TASK_STATE_AUTH_REQUIRED');
  });
});

describe('parseInput', () => {
  it('reads exception ids and decisions from data and text parts', () => {
    const msg = (parts: unknown[]) => ({ parts } as never);
    expect(parseInput(msg([{ content: { $case: 'text', value: 'please REVIEW px-1003 now' } }])).exceptionId).toBe('PX-1003');
    expect(parseInput(msg([{ content: { $case: 'data', value: { decision: 'reject' } } }])).decision).toBe('reject');
    expect(parseInput(msg([{ content: { $case: 'text', value: 'I approve this' } }])).decision).toBe('approve');
    expect(parseInput(msg([])).exceptionId).toBeUndefined();
  });
});
