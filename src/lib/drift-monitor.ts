import { logAPIEvent } from '@/lib/observability';

export interface DriftSample {
  route: string;
  output: string;
  status: 'success' | 'error';
  timestamp: number;
}

export interface DriftResult {
  driftScore: number;
  exceeded: boolean;
  reasons: string[];
  sampleCount: number;
}

const MAX_SAMPLES = 25;
const DRIFT_THRESHOLD = 0.65;
const samplesByRoute = new Map<string, DriftSample[]>();

const HALLUCINATION_PATTERNS = [
  /\bas an ai language model\b/i,
  /\bi (?:do not|don't) have (?:access|information|context)\b/i,
  /\bi cannot verify\b/i,
  /\bi'?m not sure\b/i,
  /\bmay be inaccurate\b/i,
  /\bwithout more context\b/i,
];

const ERROR_PATTERNS = [
  /\berror\b/i,
  /\bfailed\b/i,
  /\btimeout\b/i,
  /\bunavailable\b/i,
  /\bcannot\b/i,
];

function clampScore(score: number): number {
  return Math.max(0, Math.min(1, Number(score.toFixed(2))));
}

function getRouteSamples(route: string): DriftSample[] {
  return samplesByRoute.get(route) ?? [];
}

function responseLengthAnomaly(samples: DriftSample[], output: string): boolean {
  const priorLengths = samples
    .filter(sample => sample.status === 'success')
    .map(sample => sample.output.length)
    .filter(length => length > 0);

  if (priorLengths.length < 3 || output.length === 0) return false;

  const average = priorLengths.reduce((sum, length) => sum + length, 0) / priorLengths.length;
  return output.length > average * 2.5 || output.length < average * 0.25;
}

function detectDrift(route: string, output: string, status: DriftSample['status']): DriftResult {
  const routeSamples = getRouteSamples(route);
  const recent = [...routeSamples, { route, output, status, timestamp: Date.now() }].slice(-MAX_SAMPLES);
  const recentErrorCount = recent.filter(sample => (
    sample.status === 'error' || ERROR_PATTERNS.some(pattern => pattern.test(sample.output))
  )).length;
  const hallucinationCount = HALLUCINATION_PATTERNS.filter(pattern => pattern.test(output)).length;
  const lengthAnomaly = responseLengthAnomaly(routeSamples, output);

  const reasons: string[] = [];
  let score = 0;

  if (recent.length >= 4 && recentErrorCount / recent.length >= 0.35) {
    score += 0.45;
    reasons.push('increased_error_patterns');
  }
  if (hallucinationCount > 0) {
    score += Math.min(0.4, hallucinationCount * 0.2);
    reasons.push('hallucination_indicators');
  }
  if (lengthAnomaly) {
    score += 0.25;
    reasons.push('response_length_anomaly');
  }

  const driftScore = clampScore(score);
  return {
    driftScore,
    exceeded: driftScore >= DRIFT_THRESHOLD,
    reasons,
    sampleCount: recent.length,
  };
}

export function trackModelOutput(
  route: string,
  output: string,
  status: DriftSample['status'] = 'success'
): DriftResult {
  const result = detectDrift(route, output, status);
  const existing = getRouteSamples(route);
  samplesByRoute.set(route, [
    ...existing,
    { route, output, status, timestamp: Date.now() },
  ].slice(-MAX_SAMPLES));

  if (result.exceeded) {
    logAPIEvent({
      event: 'model.drift_warning',
      route,
      severity: 'warn',
      driftScore: result.driftScore,
      reasons: result.reasons.join(','),
      sampleCount: result.sampleCount,
    });
  }

  return result;
}

export function getDriftSnapshot(route: string): DriftSample[] {
  return [...getRouteSamples(route)];
}

export function _resetDriftMonitor(): void {
  samplesByRoute.clear();
}
