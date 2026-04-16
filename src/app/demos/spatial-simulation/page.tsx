'use client';

import { useMemo, useState, type ChangeEvent } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ClipboardList,
  Compass,
  FileWarning,
  Flag,
  Gauge,
  GitBranch,
  Loader2,
  Map,
  Shield,
  UserCheck,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DEFAULT_SPATIAL_CONSTRAINTS,
  SPATIAL_OBJECTIVE_OPTIONS,
  SPATIAL_REGION_OPTIONS,
  SPATIAL_SCENARIO_TEMPLATES,
  type SpatialConstraintProfile,
  type SpatialObjective,
  type SpatialRegion,
} from '@/lib/spatial-scenarios';
import {
  SPATIAL_UPLOAD_LIMITS,
  validateSpatialUploadPayload,
  type SpatialUploadPayload,
} from '@/lib/spatial-guardrails';
import type { SpatialEvalResult } from '@/lib/spatial-eval';
import type {
  SpatialSimulationOutput,
  SpatialWorkflowStage,
} from '@/lib/spatial-simulation';

type RunState = 'idle' | 'running' | 'pending_review' | 'done' | 'error';

type SpatialApiResponse = SpatialSimulationOutput & {
  evaluation: SpatialEvalResult;
};

const STAGE_ICONS: Record<SpatialWorkflowStage['id'], typeof Compass> = {
  'scenario-intake': ClipboardList,
  'spatial-planner': Compass,
  'world-builder': Map,
  'simulation-analyst': Gauge,
  'policy-review': Shield,
  'human-approval': UserCheck,
  'final-recommendation': CheckCircle2,
};

const STAGE_STYLE: Record<SpatialWorkflowStage['state'], string> = {
  idle: 'border-border bg-muted/30 text-muted-foreground',
  running: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
  completed: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  paused: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  failed: 'border-red-500/40 bg-red-500/10 text-red-300',
};

async function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error('Image could not be decoded'));
      image.src = objectUrl;
    });
    return dimensions;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function SpatialSimulationPage() {
  const [scenarioPrompt, setScenarioPrompt] = useState(SPATIAL_SCENARIO_TEMPLATES[0]);
  const [region, setRegion] = useState<SpatialRegion>(SPATIAL_REGION_OPTIONS[0]);
  const [objective, setObjective] = useState<SpatialObjective>('speed');
  const [constraints, setConstraints] = useState<SpatialConstraintProfile>(DEFAULT_SPATIAL_CONSTRAINTS);
  const [runState, setRunState] = useState<RunState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [revisionNote, setRevisionNote] = useState('');
  const [result, setResult] = useState<SpatialApiResponse | null>(null);
  const [uploadMetadata, setUploadMetadata] = useState<SpatialUploadPayload | undefined>(undefined);
  const [uploadError, setUploadError] = useState('');

  const desktopSignal = useMemo(() => {
    return 'Desktop-friendly: richer scene context is optimized for larger screens; mobile uses a lightweight planning view.';
  }, []);

  const runSimulation = async (approvalState: 'pending' | 'approved') => {
    setRunState('running');
    setErrorMessage('');

    try {
      const response = await fetch('/api/demos/spatial-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioPrompt,
          region,
          objective,
          constraints,
          image: uploadMetadata,
          approvalState,
        }),
      });

      const payload = (await response.json()) as SpatialApiResponse & {
        error?: string;
        details?: string[];
      };

      if (!response.ok) {
        setRunState('error');
        const details = payload.details?.length ? ` (${payload.details.join(', ')})` : '';
        setErrorMessage(`${payload.error ?? 'Unable to run simulation'}${details}`);
        return;
      }

      setResult(payload);
      setRunState(payload.status === 'pending_review' ? 'pending_review' : 'done');
    } catch {
      setRunState('error');
      setErrorMessage('Simulation request failed. Please retry in a moment.');
    }
  };

  const handleFileSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setUploadError('');

    if (!file) {
      setUploadMetadata(undefined);
      return;
    }

    try {
      const { width, height } = await readImageDimensions(file);
      const candidate: SpatialUploadPayload = {
        name: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        width,
        height,
      };

      const validation = validateSpatialUploadPayload(candidate);
      if (!validation.isValid) {
        setUploadMetadata(undefined);
        setUploadError(`Upload rejected: ${validation.errors.join(', ')}`);
        return;
      }

      setUploadMetadata(candidate);
    } catch {
      setUploadMetadata(undefined);
      setUploadError('Upload rejected: image could not be decoded safely.');
    }
  };

  const handleApprove = async () => {
    await runSimulation('approved');
  };

  const handleRevise = () => {
    setResult(null);
    setRunState('idle');
    setErrorMessage('Revision requested. Update scenario or constraints before rerunning.');
  };

  const handleCancel = () => {
    setResult(null);
    setRunState('idle');
    setErrorMessage('Approval canceled. Simulation output not finalized.');
  };

  const workflow = result?.workflow ?? [];
  const traces = result?.traces ?? [];
  const fallbackWorkflow: SpatialWorkflowStage[] = [
    {
      id: 'scenario-intake',
      label: 'Scenario Intake',
      description: 'Validate prompt, region, and constraints before planning.',
      state: 'idle',
    },
  ];

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center gap-3">
          <ThemeToggle />
          <Link href="/" className="text-muted-foreground hover:text-foreground" aria-label="Back to portfolio">
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">AI Spatial Intelligence &amp; Simulation</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Governed spatial planning workflow for logistics, mobility, and site intelligence decision support.
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <Badge variant="outline">Spatial AI</Badge>
          <Badge variant="outline">Agentic Planning</Badge>
          <Badge variant="outline">Governed Simulation</Badge>
          <Badge variant="outline">Explainable Decisions</Badge>
          <Badge variant="outline">Desktop-Friendly</Badge>
        </div>

        <Card className="mb-6 border-border bg-card">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">{desktopSignal}</p>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Scenario Input</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="scenario-template">Quick Start</label>
                  <select
                    id="scenario-template"
                    className="w-full rounded-md border border-border bg-background p-2 text-sm"
                    value={scenarioPrompt}
                    onChange={(event) => setScenarioPrompt(event.target.value)}
                  >
                    {SPATIAL_SCENARIO_TEMPLATES.map((template) => (
                      <option key={template} value={template}>{template}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="scenario-prompt">Scenario Prompt</label>
                  <textarea
                    id="scenario-prompt"
                    value={scenarioPrompt}
                    onChange={(event) => setScenarioPrompt(event.target.value)}
                    className="h-28 w-full rounded-md border border-border bg-background p-2 text-sm"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium" htmlFor="region">Region</label>
                    <select
                      id="region"
                      value={region}
                      onChange={(event) => setRegion(event.target.value as SpatialRegion)}
                      className="w-full rounded-md border border-border bg-background p-2 text-sm"
                    >
                      {SPATIAL_REGION_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium" htmlFor="objective">Objective</label>
                    <select
                      id="objective"
                      value={objective}
                      onChange={(event) => setObjective(event.target.value as SpatialObjective)}
                      className="w-full rounded-md border border-border bg-background p-2 text-sm"
                    >
                      {SPATIAL_OBJECTIVE_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium" htmlFor="budget-level">Budget Profile</label>
                    <select
                      id="budget-level"
                      value={constraints.budgetLevel}
                      onChange={(event) => setConstraints((prev) => ({ ...prev, budgetLevel: event.target.value as SpatialConstraintProfile['budgetLevel'] }))}
                      className="w-full rounded-md border border-border bg-background p-2 text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium" htmlFor="congestion-sensitivity">Congestion Sensitivity</label>
                    <select
                      id="congestion-sensitivity"
                      value={constraints.congestionSensitivity}
                      onChange={(event) => setConstraints((prev) => ({ ...prev, congestionSensitivity: event.target.value as SpatialConstraintProfile['congestionSensitivity'] }))}
                      className="w-full rounded-md border border-border bg-background p-2 text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium" htmlFor="policy-profile">Policy Profile</label>
                    <select
                      id="policy-profile"
                      value={constraints.policyProfile}
                      onChange={(event) => setConstraints((prev) => ({ ...prev, policyProfile: event.target.value as SpatialConstraintProfile['policyProfile'] }))}
                      className="w-full rounded-md border border-border bg-background p-2 text-sm"
                    >
                      <option value="balanced">Balanced</option>
                      <option value="safety-first">Safety-first</option>
                      <option value="throughput-first">Throughput-first</option>
                    </select>
                  </div>
                  <label className="mt-5 flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={constraints.accessibilityPriority}
                      onChange={(event) => setConstraints((prev) => ({ ...prev, accessibilityPriority: event.target.checked }))}
                    />
                    Accessibility priority
                  </label>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="scene-upload">
                    Optional Scene Context Image
                  </label>
                  <input
                    id="scene-upload"
                    type="file"
                    accept={SPATIAL_UPLOAD_LIMITS.allowedMimeTypes.join(',')}
                    onChange={handleFileSelection}
                    className="w-full text-sm"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Supports PNG, JPEG, WebP. Max {Math.round(SPATIAL_UPLOAD_LIMITS.maxBytes / (1024 * 1024))}MB and {SPATIAL_UPLOAD_LIMITS.maxDimension}px per side.
                  </p>
                  {uploadMetadata && (
                    <p className="mt-2 text-xs text-emerald-400">
                      Uploaded: {uploadMetadata.name} ({uploadMetadata.width}x{uploadMetadata.height})
                    </p>
                  )}
                  {uploadError && (
                    <p className="mt-2 text-xs text-red-400">{uploadError}</p>
                  )}
                </div>

                <Button onClick={() => runSimulation('pending')} disabled={runState === 'running'}>
                  {runState === 'running' ? (
                    <><Loader2 className="mr-2 size-4 animate-spin" />Running simulation...</>
                  ) : (
                    'Run governed simulation'
                  )}
                </Button>
                {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Workflow Pipeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(workflow.length ? workflow : fallbackWorkflow).map((stage) => {
                  const Icon = STAGE_ICONS[stage.id];
                  return (
                    <div key={stage.id} className={`rounded-lg border p-3 ${STAGE_STYLE[stage.state]}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Icon className="size-4" />
                          <p className="text-sm font-medium">{stage.label}</p>
                        </div>
                        <Badge variant="outline">{stage.state}</Badge>
                      </div>
                      <p className="mt-1 text-xs">{stage.description}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Execution Trace</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {traces.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Run a scenario to generate traceable simulation steps.</p>
                ) : (
                  traces.map((trace) => (
                    <div key={`${trace.sequence}-${trace.actor}`} className="rounded-lg border border-border bg-muted/30 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">{trace.sequence}. {trace.actor}</p>
                        <Badge variant={trace.status === 'paused' ? 'secondary' : 'default'}>{trace.status}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{trace.action}</p>
                      <p className="mt-2 text-sm">{trace.summary}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Recommendation Output</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!result && (
                  <p className="text-sm text-muted-foreground">Final recommendation appears after governed simulation executes.</p>
                )}

                {result && (
                  <>
                    <p className="text-sm font-semibold">{result.proposedRecommendation.headline}</p>
                    <p className="text-sm text-muted-foreground">{result.proposedRecommendation.rationale}</p>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tradeoffs</p>
                      <ul className="mt-1 list-disc space-y-1 pl-4 text-sm">
                        {result.proposedRecommendation.tradeoffs.map((tradeoff) => (
                          <li key={tradeoff}>{tradeoff}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Constraints Applied</p>
                      <ul className="mt-1 list-disc space-y-1 pl-4 text-sm">
                        {result.proposedRecommendation.constraintsApplied.map((constraint) => (
                          <li key={constraint}>{constraint}</li>
                        ))}
                      </ul>
                    </div>

                    <p className="text-sm"><span className="font-medium">Business impact:</span> {result.proposedRecommendation.businessImpact}</p>
                    <p className="text-sm"><span className="font-medium">Policy notes:</span> {result.proposedRecommendation.policyNotes.join(' ')}</p>
                  </>
                )}
              </CardContent>
            </Card>

            {runState === 'pending_review' && result && (
              <Card className="border-amber-500/40 bg-amber-500/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-200">
                    <UserCheck className="size-4" /> Human Approval Required
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-amber-100">
                    Recommendation is paused for approval because this scenario can influence high-impact operational planning.
                  </p>
                  <p className="text-sm text-amber-100">
                    Next action proposed: {result.proposedRecommendation.nextAction}
                  </p>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-amber-200" htmlFor="revision-note">
                    Revision Note
                  </label>
                  <textarea
                    id="revision-note"
                    value={revisionNote}
                    onChange={(event) => setRevisionNote(event.target.value)}
                    className="h-20 w-full rounded-md border border-amber-500/40 bg-background/80 p-2 text-sm text-foreground"
                    placeholder="Optional: add reviewer feedback before revise."
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={handleApprove}>Approve</Button>
                    <Button variant="secondary" onClick={handleRevise}>Revise</Button>
                    <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Business Value</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {(result?.businessValue ?? [
                    'Safer deployment decisions through policy-aware simulation gates',
                    'Faster scenario analysis for operations teams',
                    'Clearer spatial planning tradeoffs for executive review',
                    'Better location intelligence for logistics and field operations',
                  ]).map((value) => (
                    <li key={value} className="flex items-start gap-2">
                      <Building2 className="mt-0.5 size-4 text-muted-foreground" />
                      <span>{value}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Governance &amp; Trust Signals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="flex items-center gap-2"><Shield className="size-4 text-emerald-400" /> Guardrails enforced</p>
                <p className="flex items-center gap-2"><Flag className="size-4 text-emerald-400" /> Policy validation active</p>
                <p className="flex items-center gap-2"><UserCheck className="size-4 text-amber-400" /> Human approval checkpoint</p>
                <p className="flex items-center gap-2"><GitBranch className="size-4 text-blue-400" /> Audit trace: {result?.governance.auditTraceId ?? 'Generated on run'}</p>
                <p className="flex items-center gap-2"><FileWarning className="size-4 text-indigo-400" /> Evaluation: {result?.evaluation.passed ? 'pass' : 'review'}</p>
              </CardContent>
            </Card>

            {(runState === 'error' || uploadError) && (
              <Card className="border-red-500/40 bg-red-500/10">
                <CardContent className="p-4 text-sm text-red-200">
                  <p className="flex items-center gap-2 font-medium"><AlertTriangle className="size-4" /> Safe failure mode active</p>
                  <p className="mt-1 text-red-100">The system rejected unsafe or invalid inputs before simulation output was produced.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
