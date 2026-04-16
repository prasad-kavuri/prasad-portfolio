import { NextRequest, NextResponse } from 'next/server';
import {
  createRequestContext,
  enforceRateLimit,
  finalizeApiResponse,
  jsonError,
  logApiEvent,
  logApiWarning,
  readJsonObject,
} from '@/lib/api';
import { checkOutput } from '@/lib/guardrails';
import { evaluateSpatialSimulation } from '@/lib/spatial-eval';
import { validateSpatialInput } from '@/lib/spatial-guardrails';
import { buildSpatialSimulation } from '@/lib/spatial-simulation';

const ROUTE = '/api/demos/spatial-simulation';

export async function POST(req: NextRequest) {
  const context = createRequestContext(req, ROUTE);

  const rateLimited = await enforceRateLimit(req, 'unknown', { context });
  if (rateLimited) return rateLimited;

  const parsedBody = await readJsonObject(req, { context });
  if (!parsedBody.ok) return parsedBody.response;

  const validation = validateSpatialInput(parsedBody.data);
  if (!validation.isValid || !validation.sanitizedInput) {
    logApiWarning('api.validation_failed', {
      route: ROUTE,
      traceId: context.traceId,
      reason: validation.errors.join(','),
      blockedByPolicy: validation.blockedByPolicy,
      status: 400,
    });

    return finalizeApiResponse(
      NextResponse.json(
        {
          error: validation.blockedByPolicy
            ? 'Scenario blocked by policy guardrails'
            : 'Invalid spatial simulation input',
          details: validation.errors,
          warnings: validation.warnings,
          requestId: context.traceId,
        },
        { status: 400 }
      ),
      context,
      400
    );
  }

  const safeInput = validation.sanitizedInput;

  const output = buildSpatialSimulation({
    traceId: context.traceId,
    scenarioPrompt: safeInput.scenarioPrompt,
    region: safeInput.region,
    objective: safeInput.objective,
    constraints: safeInput.constraints,
    approvalState: safeInput.approvalState,
    image: safeInput.image
      ? {
          name: safeInput.image.name,
          mimeType: safeInput.image.mimeType,
          width: safeInput.image.width,
          height: safeInput.image.height,
        }
      : undefined,
  });

  const evalResult = evaluateSpatialSimulation(output);
  if (!evalResult.passed) {
    logApiWarning('api.spatial_eval_review', {
      route: ROUTE,
      traceId: context.traceId,
      failedChecks: evalResult.checks.filter((check) => !check.passed).map((check) => check.id).join(','),
      status: 422,
    });

    return finalizeApiResponse(
      NextResponse.json(
        {
          error: 'Simulation output failed evaluation checks',
          evaluation: evalResult,
          requestId: context.traceId,
        },
        { status: 422 }
      ),
      context,
      422
    );
  }

  const outputGuard = checkOutput(JSON.stringify(output), context.traceId);
  if (!outputGuard.isSafe) {
    logApiWarning('api.guardrail_output_triggered', {
      route: ROUTE,
      traceId: context.traceId,
      issues: outputGuard.issues.join(','),
      score: outputGuard.score,
      status: 200,
    });
  }

  logApiEvent('api.request_completed', {
    route: ROUTE,
    traceId: context.traceId,
    approvalState: safeInput.approvalState,
    status: 200,
  });

  return finalizeApiResponse(
    NextResponse.json({
      ...output,
      evaluation: evalResult,
    }),
    context,
    200
  );
}
