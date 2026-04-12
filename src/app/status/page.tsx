import Link from 'next/link';

export const metadata = {
  title: 'System Status — Prasad Kavuri',
  description: 'Live system status for prasadkavuri.com',
};

export default function StatusPage() {
  return (
    <main className="min-h-screen bg-background p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">System Status</h1>
      <p className="text-muted-foreground mb-8">
        prasadkavuri.com — last updated April 2026
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">🟢 All Systems Operational</h2>
        <div className="grid gap-3">
          {[
            ['AI Portfolio Assistant', 'Live · RAG + Streaming'],
            ['LLM Router', 'Live · Multi-model'],
            ['Multi-Agent System', 'Live · Groq'],
            ['MCP Tool Demo', 'Live · Tool calling'],
            ['Resume Generator', 'Live · PDF export'],
            ['RAG Pipeline', 'Live · Browser WASM'],
            ['Vector Search', 'Live · Browser WASM'],
            ['Multimodal Assistant', 'Live · WebGPU'],
            ['Model Quantization', 'Live · ONNX'],
          ].map(([name, status]) => (
            <div key={name} className="flex justify-between items-center p-3 rounded-lg border border-border">
              <span className="font-medium">{name}</span>
              <span className="text-sm text-green-500">✓ {status}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">🔒 Security Posture</h2>
        <div className="grid gap-2 text-sm">
          {[
            'Content Security Policy (CSP) — Active',
            'Rate Limiting (Upstash Redis) — Active',
            'SSRF Protection — Active',
            'XSS Sanitization (DOMPurify) — Active',
            'Prompt Injection Detection — Active',
            'Output Guardrails — Active',
            'SHA-256 IP Hashing — Active',
            'npm audit (CI-enforced) — 0 high/critical CVEs',
          ].map(item => (
            <div key={item} className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">🧪 Test Suite</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            ['Unit Tests', '314 passing'],
            ['E2E Tests', '149/150 passing'],
            ['Test Files', '27 files'],
            ['Coverage', '95%+ statements'],
            ['Fuzz Tests', 'Active'],
            ['LLM Evals', '27 eval cases'],
            ['Chaos Tests', 'Active'],
            ['CI Pipeline', 'Parallel (3 jobs)'],
          ].map(([label, value]) => (
            <div key={label} className="p-3 rounded-lg border border-border">
              <div className="text-muted-foreground">{label}</div>
              <div className="font-semibold text-green-500">{value}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">⚙️ Stack</h2>
        <div className="text-sm text-muted-foreground grid grid-cols-2 gap-2">
          {[
            'Next.js 16.2.3', 'React 19.2.5',
            'Tailwind CSS v4', 'TypeScript 5',
            'Groq SDK 1.1.2', 'Transformers.js v4',
            'Vitest 4', 'Playwright 1.59',
          ].map(item => (
            <span key={item} className="font-mono">▸ {item}</span>
          ))}
        </div>
      </section>

      <div className="mt-8 pt-8 border-t border-border text-sm text-muted-foreground">
        <Link href="/" className="hover:underline">← Back to portfolio</Link>
      </div>
    </main>
  );
}
