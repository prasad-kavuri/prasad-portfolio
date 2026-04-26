/**
 * Integration tests: security configuration integrity.
 * Verifies CSP, COOP/COEP, and no hardcoded secrets in source files.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';

function assertParsedObjectsHaveUniqueKeys(value: unknown) {
  if (!value || typeof value !== 'object') {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach(assertParsedObjectsHaveUniqueKeys);
    return;
  }

  const keys = Object.keys(value);
  expect(new Set(keys).size).toBe(keys.length);
  Object.values(value).forEach(assertParsedObjectsHaveUniqueKeys);
}

describe('Security configuration integrity', () => {
  it('next.config.ts sets Content-Security-Policy with blob: for WASM', () => {
    const config = readFileSync('next.config.ts', 'utf8');
    expect(config).toMatch(/Content-Security-Policy/);
    expect(config).toMatch(/blob:/);
  });

  it('CSP connect-src does not include a broad https: wildcard', () => {
    const config = readFileSync('next.config.ts', 'utf8');
    const proxy = readFileSync('src/proxy.ts', 'utf8');
    const configConnectSrc = config.match(/"connect-src ([^"]+)"/)?.[1] ?? '';
    const proxyConnectSrc = proxy.match(/connect-src ([^;]+);/)?.[1] ?? '';
    expect(configConnectSrc.split(/\s+/)).not.toContain('https:');
    expect(proxyConnectSrc.split(/\s+/)).not.toContain('https:');
    expect(config).toMatch(/https:\/\/api\.groq\.com/);
    expect(config).toMatch(/https:\/\/cdn-lfs\.huggingface\.co/);
  });

  it('next.config.ts sets worker-src for WASM web workers', () => {
    const config = readFileSync('next.config.ts', 'utf8');
    expect(config).toMatch(/worker-src/);
  });

  it('next.config.ts sets Cross-Origin-Opener-Policy for SharedArrayBuffer', () => {
    const config = readFileSync('next.config.ts', 'utf8');
    expect(config).toMatch(/Cross-Origin-Opener-Policy/);
  });

  it('next.config.ts sets Cross-Origin-Embedder-Policy', () => {
    const config = readFileSync('next.config.ts', 'utf8');
    expect(config).toMatch(/Cross-Origin-Embedder-Policy/);
  });

  it('proxy.ts also sets CSP and COOP headers (belt-and-suspenders)', () => {
    const proxy = readFileSync('src/proxy.ts', 'utf8');
    expect(proxy).toMatch(/Content-Security-Policy/);
    expect(proxy).toMatch(/Cross-Origin-Opener-Policy/);
    expect(proxy).toMatch(/worker-src/);
  });

  it('no Groq API keys hardcoded in LLM API routes', () => {
    const routes = [
      'src/app/api/llm-router/route.ts',
      'src/app/api/portfolio-assistant/route.ts',
      'src/app/api/multi-agent/route.ts',
    ];
    for (const file of routes) {
      const content = readFileSync(file, 'utf8');
      // Groq keys start with gsk_ followed by 40+ alphanumeric chars
      expect(content, `${file} must not contain hardcoded Groq key`).not.toMatch(
        /gsk_[a-zA-Z0-9]{40,}/
      );
    }
  });

  it('no OpenAI-style API keys hardcoded in source', () => {
    const routes = [
      'src/app/api/llm-router/route.ts',
      'src/app/api/portfolio-assistant/route.ts',
      'src/app/api/multi-agent/route.ts',
    ];
    for (const file of routes) {
      const content = readFileSync(file, 'utf8');
      expect(content, `${file} must not contain hardcoded OpenAI key`).not.toMatch(
        /sk-[a-zA-Z0-9]{40,}/
      );
    }
  });

  it('Groq-calling routes read API key from process.env (not hardcoded)', () => {
    // multi-agent proxies to a HuggingFace Space — no API key needed
    const groqRoutes = [
      'src/app/api/llm-router/route.ts',
      'src/app/api/portfolio-assistant/route.ts',
    ];
    for (const file of groqRoutes) {
      const content = readFileSync(file, 'utf8');
      expect(content, `${file} must use process.env for API key`).toMatch(
        /process\.env\./
      );
    }
  });

  it('rate-limit.ts uses SHA hashing — never stores raw IPs', () => {
    const content = readFileSync('src/lib/rate-limit.ts', 'utf8');
    expect(content).toMatch(/sha|hash|digest/i);
  });

  it('.env.local.example exists and documents required variables', () => {
    const example = readFileSync('.env.local.example', 'utf8');
    expect(example).toMatch(/GROQ_API_KEY/);
    expect(example).toMatch(/UPSTASH_REDIS_REST_URL/);
    expect(example).toMatch(/UPSTASH_REDIS_REST_TOKEN/);
  });

  it('publishes a valid machine-readable security posture summary', () => {
    const json = readFileSync('public/.well-known/security-posture.json', 'utf8');
    const posture = JSON.parse(json) as {
      schema_version?: string;
      controls?: Record<string, string>;
      residual_risks?: string[];
      validation_commands?: string[];
      security_policy_url?: string;
      threat_model_url?: string;
    };

    assertParsedObjectsHaveUniqueKeys(posture);
    expect(posture.schema_version).toBe('1.0');
    expect(posture.controls?.agent_sandbox).toContain('AGENTS.md');
    expect(posture.residual_risks).toContain('No formal third-party penetration test has been completed');
    expect(posture.validation_commands).toContain('npm run test:coverage');
    expect(posture.security_policy_url).toContain('SECURITY.md');
    expect(posture.threat_model_url).toContain('SECURITY_THREAT_MODEL.md');
  });

  it('documents the external security threat model', () => {
    expect(existsSync('docs/SECURITY_THREAT_MODEL.md')).toBe(true);
    const threatModel = readFileSync('docs/SECURITY_THREAT_MODEL.md', 'utf8');

    expect(threatModel).toContain('| Threat | Likelihood | Impact | Control | Residual Risk |');
    expect(threatModel).toContain('| SSRF | Low | High | DNS lookup + private IP block + redirect recheck | Very Low |');
    expect(threatModel).toContain('Agent Sandbox Contract');
    expect(threatModel).toContain('npm audit --audit-level=high');
  });

  it('documents no-secret and no-env-access rules for coding agents', () => {
    const agentDocs = `${readFileSync('AGENTS.md', 'utf8')}\n${readFileSync('CLAUDE.md', 'utf8')}`;

    expect(agentDocs).toContain('must not read, print, copy, summarize, commit, or expose `.env*`');
    expect(agentDocs).toContain('Vercel secrets, API keys, tokens, private logs');
    expect(agentDocs).toContain('Do not write outside this repository');
    expect(agentDocs).toContain('Human approval is required before changes touching security headers');
  });
});
