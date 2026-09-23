/**
 * A2A v1.0 JSON-RPC endpoint (SPEC-0021), built on the official @a2a-js/sdk.
 * Agent Card: /.well-known/agent-card.json. Clients send the `A2A-Version: 1.0` header.
 */
import { NextRequest, NextResponse } from 'next/server';
import { DefaultRequestHandler, JsonRpcTransportHandler, ServerCallContext, validateVersion } from '@a2a-js/sdk/server';
import { createRequestContext, enforceRateLimit, finalizeApiResponse, logApiEvent, logApiWarning } from '@/lib/api';
import { verifyToken } from '@/lib/agent-auth';
import { buildAgentCard } from '@/lib/a2a/agent-card';
import { PortfolioAgentExecutor, ScopedUser } from '@/lib/a2a/executor';
import { DurableTaskStore } from '@/lib/a2a/task-store';

const ROUTE = '/api/a2a';
const MAX_BODY_BYTES = 16_000;

async function resolveUser(req: NextRequest): Promise<ScopedUser | undefined> {
  const header = req.headers.get('authorization') ?? '';
  if (!header.startsWith('Bearer ')) return undefined;
  try {
    const payload = await verifyToken(header.slice(7).trim());
    return payload ? new ScopedUser({ kind: 'user', id: payload.sub, scopes: payload.scopes }) : undefined;
  } catch {
    return undefined;
  }
}

const rpcError = (id: unknown, code: number, message: string, status: number) =>
  NextResponse.json({ jsonrpc: '2.0', id: id ?? null, error: { code, message } }, { status });

export async function POST(req: NextRequest) {
  const context = createRequestContext(req, ROUTE);
  const rateLimited = await enforceRateLimit(req, 'anonymous', { context });
  if (rateLimited) return rateLimited;

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    logApiWarning('api.abnormal_usage', { route: ROUTE, traceId: context.traceId, reason: 'body_too_large', status: 413 });
    return finalizeApiResponse(rpcError(null, -32600, 'Request too large', 413), context, 413);
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return finalizeApiResponse(rpcError(null, -32700, 'Parse error', 400), context, 400);
  }

  const card = buildAgentCard();
  const callContext = new ServerCallContext({
    user: await resolveUser(req),
    requestedVersion: req.headers.get('a2a-version') ?? undefined,
  });
  try {
    validateVersion(callContext.requestedVersion, card, 'JSONRPC');
  } catch (error) {
    const id = (body as { id?: unknown })?.id;
    const mapped = JsonRpcTransportHandler.mapToJSONRPCError(error);
    return finalizeApiResponse(NextResponse.json({ jsonrpc: '2.0', id: id ?? null, error: mapped }, { status: 400 }), context, 400);
  }

  const handler = new JsonRpcTransportHandler(new DefaultRequestHandler(card, new DurableTaskStore(), new PortfolioAgentExecutor()));
  const result = await handler.handle(body as Record<string, unknown>, callContext);
  if (typeof (result as AsyncGenerator)[Symbol.asyncIterator] === 'function') {
    // Streaming is not advertised on the card; the SDK rejects it before reaching here.
    return finalizeApiResponse(rpcError(null, -32004, 'Streaming is not supported', 400), context, 400);
  }
  logApiEvent('api.request_completed', {
    route: ROUTE,
    traceId: context.traceId,
    status: 200,
    method: String((body as { method?: unknown })?.method ?? '').slice(0, 40),
    authenticated: Boolean(callContext.user),
  });
  return finalizeApiResponse(NextResponse.json(result), context);
}
