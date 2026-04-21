'use client';

import { useState, useEffect, useRef } from 'react';
import type { JsonLdPerson } from '@/lib/resumeJsonLd';
import Link from 'next/link';
import { ArrowLeft, Copy, Check, Download, Loader, CheckCircle, Edit3, AlertTriangle } from 'lucide-react';
import { ThemeToggle } from "@/components/theme-toggle";
import { generateClientTraceId, logAPIEvent } from '@/lib/observability';

interface FitDimension {
  score: number;
  rationale: string;
}

interface FitScores {
  skillsMatch: FitDimension;
  seniorityAlignment: FitDimension;
  domainRelevance: FitDimension;
  cultureSignals: FitDimension;
}

interface ResumeData {
  matchScore: number;
  roleTitle?: string;
  fitScores?: FitScores;
  tailoringChanges?: string[];
  matchedSkills: string[];
  missingSkills: string[];
  summary: string;
  experience: Array<{
    company: string;
    title: string;
    period: string;
    bullets: string[];
  }>;
  skills: string[];
  atsKeywords: string[];
  jsonLd?: JsonLdPerson;
  jsonLdScript?: string;
}

type Phase = 'idle' | 'analyzing' | 'review' | 'regenerating' | 'done';
type HitlBadge = 'hitl-approved' | 'manual-override';

const FOCUS_AREAS = [
  'Agentic AI & LLM',
  'Cloud & Infrastructure',
  'Team Leadership',
  'Product & Strategy',
  'Autonomous Systems',
];

const EXAMPLE_JD = `VP of AI Engineering, Leading AI/ML Company, San Francisco, CA

About the Role:
We're seeking a visionary VP of AI Engineering to lead our team of 50+ engineers building next-generation agentic AI systems. You'll own the technical strategy for our enterprise AI platform, scaling from startups to Fortune 500 customers.

Key Responsibilities:
- Lead architecture and strategy for multi-model LLM orchestration across AWS, Azure, and GCP
- Build and mentor a world-class team of 50+ engineers across AI/ML, infrastructure, and platform teams
- Design and implement production-grade RAG pipelines and vector search systems handling millions of queries/day
- Drive cost optimization initiatives targeting 40%+ infrastructure savings
- Establish partnerships with AI model providers and cloud vendors
- Define product roadmap aligned with customer needs and measurable business outcomes
- Own P&L for AI platform business unit ($20M+ revenue)

Required Skills & Experience:
- 15+ years of software engineering with 5+ in AI/ML leadership
- Proven expertise in Large Language Models, Agentic AI, and LLM Orchestration
- Deep hands-on experience with RAG systems, vector databases, and semantic search
- Production experience scaling ML systems to millions of daily queries
- Strong cloud architecture background (AWS, Azure, GCP, Kubernetes)
- Experience leading global teams of 50+ across multiple locations
- Bachelor's in Computer Science or related field; MBA preferred

Nice to Have:
- Experience with CrewAI, LangGraph, or similar agent frameworks
- Background in autonomous systems or computer vision
- Knowledge of MLOps and LLMOps best practices
- Earlier stage startup experience`;

const BASE_KEYWORDS = new Set([
  'agentic ai', 'llm orchestration', 'rag', 'vector search', 'crewai', 'langgraph',
  'aws', 'azure', 'gcp', 'kubernetes', 'mlops', 'llmops', 'product strategy',
  'data platforms', 'distributed systems', 'leadership', 'transformers', 'pytorch',
  'python', 'machine learning', 'deep learning', 'ai', 'llm',
]);

const FIT_DIMENSIONS: Array<{ key: keyof FitScores; label: string; weight: string }> = [
  { key: 'skillsMatch', label: 'Skills Match', weight: '35%' },
  { key: 'seniorityAlignment', label: 'Seniority Alignment', weight: '25%' },
  { key: 'domainRelevance', label: 'Domain Relevance', weight: '25%' },
  { key: 'cultureSignals', label: 'Culture / Value Signals', weight: '15%' },
];

function toGrade(score: number): string {
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 67) return 'D+';
  if (score >= 60) return 'D';
  return 'F';
}

function gradeColor(grade: string): string {
  if (grade.startsWith('A')) return 'text-green-400';
  if (grade.startsWith('B')) return 'text-blue-400';
  if (grade.startsWith('C')) return 'text-yellow-400';
  if (grade.startsWith('D')) return 'text-orange-400';
  return 'text-red-400';
}

function gradeBg(grade: string): string {
  if (grade.startsWith('A')) return 'bg-green-500/10 border-green-500/30';
  if (grade.startsWith('B')) return 'bg-blue-500/10 border-blue-500/30';
  if (grade.startsWith('C')) return 'bg-yellow-500/10 border-yellow-500/30';
  if (grade.startsWith('D')) return 'bg-orange-500/10 border-orange-500/30';
  return 'bg-red-500/10 border-red-500/30';
}

function overallScore(fs: FitScores): number {
  return Math.round(
    fs.skillsMatch.score * 0.35 +
    fs.seniorityAlignment.score * 0.25 +
    fs.domainRelevance.score * 0.25 +
    fs.cultureSignals.score * 0.15,
  );
}

function hasDriftWarning(resume: ResumeData): boolean {
  const tailored = new Set([
    ...resume.atsKeywords.map(k => k.toLowerCase()),
    ...resume.skills.map(s => s.toLowerCase()),
  ]);
  if (tailored.size === 0) return false;
  let shared = 0;
  tailored.forEach(w => { if (BASE_KEYWORDS.has(w)) shared++; });
  return shared / tailored.size < 0.6;
}

export default function ResumeGeneratorPage() {
  const [jobDescription, setJobDescription] = useState('');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [phase, setPhase] = useState<Phase>('idle');
  const [apiResult, setApiResult] = useState<ResumeData | null>(null);
  const [finalResume, setFinalResume] = useState<ResumeData | null>(null);
  const [badge, setBadge] = useState<HitlBadge | null>(null);
  const [driftWarning, setDriftWarning] = useState(false);

  // HITL state
  const [editMode, setEditMode] = useState(false);
  const [overrideText, setOverrideText] = useState('');

  const traceIdRef = useRef(generateClientTraceId());

  const handleFocusAreaChange = (area: string) => {
    setFocusAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area],
    );
  };

  const handleExample = () => {
    setJobDescription(EXAMPLE_JD);
    setError('');
  };

  const callApi = async (userOverride?: string): Promise<ResumeData | null> => {
    const response = await fetch('/api/resume-generator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Trace-Id': traceIdRef.current,
      },
      body: JSON.stringify({ jobDescription, focusAreas, userOverride }),
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to generate resume');
    }
    return response.json();
  };

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      setError('Please paste a job description');
      return;
    }
    setError('');
    setApiResult(null);
    setFinalResume(null);
    setBadge(null);
    setEditMode(false);
    setOverrideText('');
    setPhase('analyzing');
    try {
      const data = await callApi();
      setApiResult(data);
      setPhase('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setPhase('idle');
    }
  };

  const handleHITLApprove = () => {
    if (!apiResult) return;
    logAPIEvent({
      severity: 'info',
      event: 'hitl_approved',
      route: '/demos/resume-generator',
      traceId: traceIdRef.current,
      roleTitle: apiResult.roleTitle ?? '',
    });
    setFinalResume(apiResult);
    setBadge('hitl-approved');
    setDriftWarning(hasDriftWarning(apiResult));
    setPhase('done');
  };

  const handleHITLOverride = async () => {
    if (!apiResult) return;
    setError('');
    setPhase('regenerating');
    logAPIEvent({
      severity: 'info',
      event: 'hitl_overridden',
      route: '/demos/resume-generator',
      traceId: traceIdRef.current,
      roleTitle: apiResult.roleTitle ?? '',
    });
    try {
      const data = await callApi(overrideText);
      setFinalResume(data);
      setBadge('manual-override');
      setDriftWarning(hasDriftWarning(data ?? apiResult));
      setPhase('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Regeneration failed');
      setPhase('review');
    }
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    if (!finalResume) return;
    const resumeText = `TAILORED RESUME\n\nPROFESSIONAL SUMMARY\n${finalResume.summary}\n\nEXPERIENCE\n${finalResume.experience.map(exp => `\n${exp.title}\n${exp.company} | ${exp.period}\n${exp.bullets.map(b => `• ${b}`).join('\n')}`).join('\n')}\n\nSKILLS\n${finalResume.skills.join(' • ')}\n\nATS KEYWORDS\n${finalResume.atsKeywords.join(', ')}`;
    const blob = new Blob([resumeText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tailored-resume.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!finalResume?.jsonLd) return;
    const existing = document.getElementById('resume-jsonld');
    if (existing) existing.remove();
    const script = document.createElement('script');
    script.id = 'resume-jsonld';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(finalResume.jsonLd);
    document.head.appendChild(script);
    return () => { document.getElementById('resume-jsonld')?.remove(); };
  }, [finalResume?.jsonLd]);

  const resume = finalResume;
  const isLoading = phase === 'analyzing' || phase === 'regenerating';

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border p-4 sticky top-0 z-10 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/" className="hover:bg-card p-2 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Hiring Intelligence</h1>
              <p className="text-sm text-muted-foreground">
                Fit scoring · HITL checkpoint · ATS-optimized resume
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">

        {/* Panel A — Job Description Input */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Job Description</label>
              <textarea
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                maxLength={2000}
                className="w-full h-72 px-4 py-3 rounded-lg bg-card border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-3">Focus Areas (optional)</label>
              <div className="space-y-2">
                {FOCUS_AREAS.map(area => (
                  <label key={area} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={focusAreas.includes(area)}
                      onChange={() => handleFocusAreaChange(area)}
                      className="w-4 h-4 rounded bg-muted border-border"
                    />
                    <span className="text-sm">{area}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExample}
                className="flex-1 px-4 py-2 rounded-lg bg-muted hover:bg-muted text-sm font-medium transition-colors"
              >
                Example JD
              </button>
              <button
                onClick={handleAnalyze}
                disabled={isLoading}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {phase === 'analyzing' ? (
                  <><Loader className="w-4 h-4 animate-spin" /><span>Analyzing JD...</span></>
                ) : 'Analyze & Score'}
              </button>
            </div>
            {error && (
              <div className="p-3 rounded-lg bg-red-900/20 border border-red-800 text-red-200 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Panel B — Fit Scoring */}
          <div>
            {(phase === 'review' || phase === 'regenerating' || phase === 'done') && apiResult?.fitScores ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Fit Score Analysis</h2>
                  {(() => {
                    const score = overallScore(apiResult.fitScores);
                    const grade = toGrade(score);
                    return (
                      <span className={`text-lg font-bold ${gradeColor(grade)}`}>
                        {grade} / {((score / 100) * 4).toFixed(1)}
                      </span>
                    );
                  })()}
                </div>
                <div className="space-y-2">
                  {FIT_DIMENSIONS.map(({ key, label, weight }) => {
                    const dim = apiResult.fitScores![key];
                    const grade = toGrade(dim.score);
                    return (
                      <div key={key} className={`rounded-lg border p-3 ${gradeBg(grade)}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-foreground">{label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{weight}</span>
                            <span className={`text-sm font-bold ${gradeColor(grade)}`}>{grade}</span>
                          </div>
                        </div>
                        <div className="mb-1 h-1.5 w-full rounded-full bg-muted/50">
                          <div
                            className={`h-1.5 rounded-full ${grade.startsWith('A') ? 'bg-green-500' : grade.startsWith('B') ? 'bg-blue-500' : grade.startsWith('C') ? 'bg-yellow-500' : 'bg-orange-500'}`}
                            style={{ width: `${dim.score}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">{dim.rationale}</p>
                      </div>
                    );
                  })}
                </div>
                {apiResult.roleTitle && (
                  <p className="text-xs text-muted-foreground">
                    Role detected: <span className="text-foreground font-medium">{apiResult.roleTitle}</span>
                  </p>
                )}
              </div>
            ) : phase === 'idle' ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-center py-16">
                <p>Paste a job description and click "Analyze & Score"</p>
              </div>
            ) : phase === 'analyzing' ? (
              <div className="h-full flex items-center justify-center py-16">
                <div className="text-center space-y-2">
                  <Loader className="w-8 h-8 animate-spin mx-auto text-blue-400" />
                  <p className="text-sm text-muted-foreground">Scoring fit dimensions...</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Panel C — HITL Checkpoint */}
        {(phase === 'review' || phase === 'regenerating') && apiResult?.tailoringChanges && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-amber-300">Human-in-the-Loop Review</h2>
              <span className="ml-auto text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">Awaiting Approval</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">AI wants to tailor your resume with these changes:</p>
              <ul className="space-y-1.5">
                {apiResult.tailoringChanges.map((change, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>

            {!editMode ? (
              <div className="flex gap-3">
                <button
                  onClick={handleHITLApprove}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-sm font-medium transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> Approve & Generate
                </button>
                <button
                  onClick={() => {
                    setEditMode(true);
                    setOverrideText(apiResult.tailoringChanges?.join('\n') ?? '');
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted text-sm font-medium transition-colors border border-border"
                >
                  <Edit3 className="w-4 h-4" /> Edit Before Generating
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={overrideText}
                  onChange={e => setOverrideText(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Describe your tailoring preferences..."
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleHITLOverride}
                    disabled={phase === 'regenerating'}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
                  >
                    {phase === 'regenerating' ? (
                      <><Loader className="w-4 h-4 animate-spin" /> Re-generating...</>
                    ) : (
                      'Re-generate with Override'
                    )}
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-4 py-2 rounded-lg bg-muted text-sm font-medium transition-colors border border-border"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Panel D — Resume Output */}
        {phase === 'done' && resume && (
          <div className="space-y-4">
            {/* Badge + Drift Warning */}
            <div className="flex flex-wrap items-center gap-3">
              {badge === 'hitl-approved' && (
                <span className="flex items-center gap-1.5 text-xs bg-green-500/15 text-green-400 border border-green-500/30 px-3 py-1 rounded-full font-medium">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Tailored for {resume.roleTitle ?? 'role'} — HITL Approved
                </span>
              )}
              {badge === 'manual-override' && (
                <span className="flex items-center gap-1.5 text-xs bg-blue-500/15 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full font-medium">
                  <Edit3 className="w-3.5 h-3.5" />
                  Manual Override Applied
                </span>
              )}
              {driftWarning && (
                <span className="flex items-center gap-1.5 text-xs bg-orange-500/15 text-orange-400 border border-orange-500/30 px-3 py-1 rounded-full">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Drift warning: tailored keywords deviate &gt;40% from base profile
                </span>
              )}
            </div>

            {/* Match Score */}
            <div className="flex items-center gap-3">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg ${resume.matchScore >= 80 ? 'bg-gradient-to-br from-green-900 to-green-800' : resume.matchScore >= 60 ? 'bg-gradient-to-br from-yellow-900 to-yellow-800' : 'bg-gradient-to-br from-orange-900 to-orange-800'}`}>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${resume.matchScore >= 80 ? 'text-green-400' : resume.matchScore >= 60 ? 'text-yellow-400' : 'text-orange-400'}`}>
                    {resume.matchScore}%
                  </div>
                  <div className="text-[10px] text-muted-foreground">Match</div>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Overall Match Score</p>
                <p className="text-xs text-muted-foreground">Based on JD alignment</p>
              </div>
            </div>

            {/* Matched / Missing Skills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2 text-muted-foreground">Matched Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {resume.matchedSkills.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-full bg-green-900/30 border border-green-700 text-green-300 text-xs font-medium">{skill}</span>
                  ))}
                </div>
              </div>
              {resume.missingSkills.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2 text-muted-foreground">Missing Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {resume.missingSkills.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-full bg-orange-900/30 border border-orange-700 text-orange-300 text-xs font-medium">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ATS Keywords */}
            <div>
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">ATS Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {resume.atsKeywords.map((keyword, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-full bg-blue-900/30 border border-blue-700 text-blue-300 text-xs font-medium">{keyword}</span>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-card rounded-lg p-4 border border-border">
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">Professional Summary</h3>
              <p className="text-sm text-foreground leading-relaxed">{resume.summary}</p>
            </div>

            {/* Experience */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Experience</h3>
              {resume.experience.map((exp, idx) => (
                <div key={idx} className="bg-card rounded-lg p-3 border border-border">
                  <div className="mb-2">
                    <h4 className="font-medium text-foreground">{exp.title}</h4>
                    <p className="text-xs text-muted-foreground">{exp.company} · {exp.period}</p>
                  </div>
                  <ul className="space-y-1">
                    {exp.bullets.map((bullet, bidx) => (
                      <li key={bidx} className="text-xs text-muted-foreground flex gap-2">
                        <span>•</span><span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Skills */}
            <div>
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {resume.skills.map((skill, idx) => (
                  <span key={idx} className="px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs">{skill}</span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleCopy(JSON.stringify(resume, null, 2), 'json')}
                className="flex-1 px-4 py-2 rounded-lg bg-muted hover:bg-muted transition-colors flex items-center justify-center gap-2 text-sm font-medium"
              >
                {copiedField === 'json' ? (
                  <><Check className="w-4 h-4 text-green-400" />Copied!</>
                ) : (
                  <><Copy className="w-4 h-4" />Copy Resume</>
                )}
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Download className="w-4 h-4" />Download
              </button>
            </div>

            {/* JSON-LD machine-readable layer */}
            {resume.jsonLd && (
              <details className="mt-4">
                <summary className="cursor-pointer text-xs text-muted-foreground flex items-center gap-2 list-none select-none">
                  <span>▶</span>
                  <span>JSON-LD machine-readable layer</span>
                  <span className="text-[11px] bg-muted border border-border/50 rounded px-1.5 py-0.5">schema.org/Person</span>
                </summary>
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-2">
                    Embedded in the page <code>&lt;head&gt;</code> as <code>application/ld+json</code>.
                  </p>
                  <pre className="text-[11px] leading-relaxed p-3 bg-muted border border-border/50 rounded-lg overflow-auto max-h-72 text-foreground">
                    {JSON.stringify(resume.jsonLd, null, 2)}
                  </pre>
                  <button
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(resume.jsonLd, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'resume-structured-data.json';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="mt-2 text-xs px-3 py-1.5 rounded border border-border hover:bg-muted transition-colors"
                  >
                    Download .json
                  </button>
                </div>
              </details>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border mt-8 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">Powered by Groq + Llama 3.3 70B</p>
        </div>
      </div>
    </div>
  );
}
