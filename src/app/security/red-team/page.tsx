import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SITE_URL } from '@/data/site-config';
import { runRedTeam, type RedTeamCaseReport } from '@/lib/redteam/run';

const pageUrl = `${SITE_URL}/security/red-team`;

export const metadata: Metadata = {
  title: 'Red-Team Results — Prasad Kavuri',
  description:
    'Continuous adversarial testing of this portfolio’s own AI surfaces: prompt injection, obfuscation, tool poisoning, privilege and approval abuse, mapped to the OWASP Top 10 for LLM and Agentic Applications.',
  alternates: { canonical: pageUrl },
  openGraph: {
    title: 'Red-Team Results — Prasad Kavuri',
    description: 'Adversarial tests this portfolio runs against its own AI guardrails and agent, in CI and on every deploy.',
    url: pageUrl,
  },
};

const LAYER_LABELS: Record<string, string> = {
  'input-guard': 'Input guard',
  'tool-output-screen': 'Tool-output screening',
  'output-sanitizer': 'Output sanitizer',
  'tool-gateway': 'Tool gateway',
  'agent-policy': 'Agent policy',
  'human-approval': 'Human approval',
  'release-gate': 'Release gate',
};

const RESULT_STYLE: Record<RedTeamCaseReport['result'], { label: string; cls: string }> = {
  blocked: { label: 'Blocked', cls: 'text-green-600 dark:text-green-400' },
  allowed: { label: 'Passed', cls: 'text-green-600 dark:text-green-400' },
  missed: { label: 'Known gap', cls: 'text-amber-600 dark:text-amber-400' },
  false_positive: { label: 'False positive', cls: 'text-red-600 dark:text-red-400' },
};

export default function RedTeamPage() {
  const report = runRedTeam();
  const { totals, byLayer, byRisk } = report;
  const blockRate = totals.attacks ? Math.round((totals.attacksBlocked / totals.attacks) * 100) : 0;
  const attacks = report.cases.filter((c) => c.expected !== 'allowed');
  const risks = Object.entries(byRisk).sort(([a], [b]) => a.localeCompare(b));

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    '@id': `${pageUrl}#article`,
    headline: 'Red-team results for prasadkavuri.com',
    description: metadata.description,
    url: pageUrl,
    author: { '@id': `${SITE_URL}/#person` },
    about: report.frameworks,
  };

  return (
    <>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="min-h-screen bg-background text-foreground">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
        <div className="mx-auto max-w-5xl px-4 py-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Security evidence</p>
          <h1 className="mb-3 text-3xl font-bold">Red-Team Results</h1>
          <p className="mb-6 max-w-3xl text-muted-foreground">
            This portfolio exposes real AI surface: a public assistant, an MCP server, and an A2A agent that
            moves a (fictional) payment through approval. So it is attacked on every push and every deploy by
            an in-process adversarial corpus of {totals.cases} cases, each mapped to the{' '}
            <a className="underline underline-offset-2" href="https://genai.owasp.org/llm-top-10/" target="_blank" rel="noopener noreferrer">OWASP Top 10 for LLM</a>{' '}and{' '}
            <a className="underline underline-offset-2" href="https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications/" target="_blank" rel="noopener noreferrer">Agentic Applications</a>.
            The corpus is deterministic and model-free: no keys, no network, reproducible by anyone who clones the repo.
          </p>

          <div className="mb-8 grid gap-3 sm:grid-cols-4">
            {[
              { label: 'Attacks blocked', value: `${totals.attacksBlocked}/${totals.attacks}`, sub: `${blockRate}% of blockable attacks` },
              { label: 'False positives', value: String(totals.falsePositives), sub: `${totals.benign} benign controls` },
              { label: 'Documented gaps', value: String(totals.knownGaps), sub: 'with a backstop control' },
              { label: 'Unexpected results', value: String(totals.unexpected), sub: 'CI fails if non-zero' },
            ].map((s) => (
              <Card key={s.label} className="border-border bg-card p-4">
                <p className="text-2xl font-semibold">{s.value}</p>
                <p className="text-sm font-medium">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.sub}</p>
              </Card>
            ))}
          </div>

          <section className="mb-10">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Defense in depth, by layer</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(byLayer).map(([layer, v]) => (
                <Card key={layer} className="border-border bg-card p-4">
                  <p className="text-sm font-semibold">{LAYER_LABELS[layer] ?? layer}</p>
                  <p className="text-xs text-muted-foreground">{v.blocked}/{v.attacks} attacks stopped at this layer</p>
                </Card>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              An attack is counted at the first layer that stops it. Several layers cover the same attack, so a
              miss at one is not a breach.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">OWASP coverage</h2>
            <div className="flex flex-wrap gap-2">
              {risks.filter(([id]) => id !== 'false-positive').map(([id, v]) => (
                <span key={id} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs">
                  <span className="font-semibold">{id}</span>
                  <span className="text-muted-foreground">{v.blocked}/{v.attacks}</span>
                </span>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">All {attacks.length} attack cases</h2>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">ID</th>
                    <th className="px-3 py-2 font-medium">Attack</th>
                    <th className="px-3 py-2 font-medium">Layer</th>
                    <th className="px-3 py-2 font-medium">OWASP</th>
                    <th className="px-3 py-2 font-medium">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {attacks.map((c) => (
                    <tr key={c.id} className="border-t border-border align-top">
                      <td className="px-3 py-2 font-mono text-xs">{c.id}</td>
                      <td className="px-3 py-2">
                        {c.title}
                        {c.mitigation && <span className="mt-0.5 block text-xs text-muted-foreground">Backstop: {c.mitigation}</span>}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{LAYER_LABELS[c.layer] ?? c.layer}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{c.risks.filter((r) => r !== 'false-positive').join(', ')}</td>
                      <td className={`px-3 py-2 text-xs font-medium ${RESULT_STYLE[c.result].cls}`}>{RESULT_STYLE[c.result].label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Notes</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>The two documented gaps are semantic attacks a pattern guard cannot catch. Each lists the control that still prevents harm — payment release is decided by deterministic policy and a credentialed human approval, never by text in a request.</li>
              <li>This corpus runs against the portfolio&apos;s own code. Scanning a live site with an external tool against production targets is only done against a preview deployment, with authorization, never against third-party systems.</li>
              <li>Machine-readable: <Link className="underline underline-offset-2" href="/api/security/red-team">/api/security/red-team</Link>. Related: <Link className="underline underline-offset-2" href="/enterprise-ai-operating-model">operating model</Link>, <Link className="underline underline-offset-2" href="/governance">governance</Link>, <Link className="underline underline-offset-2" href="/demos/governed-agent-platform">flagship agent</Link>.</li>
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
