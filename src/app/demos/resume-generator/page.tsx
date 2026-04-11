'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Check, Download, Loader } from 'lucide-react';
import { ThemeToggle } from "@/components/theme-toggle";

interface ResumeData {
  matchScore: number;
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
}

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

export default function ResumeGeneratorPage() {
  const [jobDescription, setJobDescription] = useState('');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleFocusAreaChange = (area: string) => {
    setFocusAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const handleExample = () => {
    setJobDescription(EXAMPLE_JD);
    setError('');
  };

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      setError('Please paste a job description');
      return;
    }

    setIsLoading(true);
    setError('');
    setResume(null);

    try {
      const response = await fetch('/api/resume-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription,
          focusAreas,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate resume');
      }

      const data = await response.json();
      setResume(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
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
    if (!resume) return;

    const resumeText = `TAILORED RESUME

PROFESSIONAL SUMMARY
${resume.summary}

EXPERIENCE
${resume.experience
  .map(
    exp => `
${exp.title}
${exp.company} | ${exp.period}
${exp.bullets.map(b => `• ${b}`).join('\n')}
`
  )
  .join('\n')}

SKILLS
${resume.skills.join(' • ')}

ATS KEYWORDS
${resume.atsKeywords.join(', ')}`;

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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'from-green-900 to-green-800';
    if (score >= 60) return 'from-yellow-900 to-yellow-800';
    return 'from-orange-900 to-orange-800';
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                href="/"
                className="hover:bg-card p-2 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Resume Generator</h1>
              <p className="text-sm text-muted-foreground">
                Paste a job description — get a tailored resume optimized for ATS
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Job Description
              </label>
              <textarea
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                maxLength={5000}
                className="w-full h-96 px-4 py-3 rounded-lg bg-card border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">
                Focus Areas (optional)
              </label>
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
                onClick={handleGenerate}
                disabled={isLoading}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Analyzing JD...</span>
                  </>
                ) : (
                  'Generate Tailored Resume'
                )}
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-900/20 border border-red-800 text-red-200 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="space-y-4">
            {resume ? (
              <>
                {/* Match Score */}
                <div className="flex justify-center">
                  <div
                    className={`relative w-32 h-32 rounded-full bg-gradient-to-br ${getScoreBgColor(
                      resume.matchScore
                    )} flex items-center justify-center shadow-lg`}
                  >
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${getScoreColor(resume.matchScore)}`}>
                        {resume.matchScore}%
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Match Score</div>
                    </div>
                  </div>
                </div>

                {/* Matched Skills */}
                <div>
                  <h3 className="text-sm font-medium mb-2 text-muted-foreground">Matched Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {resume.matchedSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full bg-green-900/30 border border-green-700 text-green-300 text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing Skills */}
                {resume.missingSkills.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-muted-foreground">Missing Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {resume.missingSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-full bg-orange-900/30 border border-orange-700 text-orange-300 text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ATS Keywords */}
                <div>
                  <h3 className="text-sm font-medium mb-2 text-muted-foreground">ATS Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {resume.atsKeywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full bg-blue-900/30 border border-blue-700 text-blue-300 text-xs font-medium"
                      >
                        {keyword}
                      </span>
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
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-foreground">{exp.title}</h4>
                          <p className="text-xs text-muted-foreground">{exp.company}</p>
                          <p className="text-xs text-muted-foreground">{exp.period}</p>
                        </div>
                      </div>
                      <ul className="space-y-1">
                        {exp.bullets.map((bullet, bidx) => (
                          <li key={bidx} className="text-xs text-muted-foreground flex gap-2">
                            <span className="text-muted-foreground">•</span>
                            <span>{bullet}</span>
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
                      <span
                        key={idx}
                        className="px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs"
                      >
                        {skill}
                      </span>
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
                      <>
                        <Check className="w-4 h-4 text-green-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Resume
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-center">
                <p>Paste a job description and click "Generate Tailored Resume"</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border mt-8 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by Groq + Llama 3.3 70B
          </p>
        </div>
      </div>
    </div>
  );
}
