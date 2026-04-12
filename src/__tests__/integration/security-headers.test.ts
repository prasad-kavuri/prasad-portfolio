/**
 * Integration tests: security configuration integrity.
 * Verifies CSP, COOP/COEP, and no hardcoded secrets in source files.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

describe('Security configuration integrity', () => {
  it('next.config.ts sets Content-Security-Policy with blob: for WASM', () => {
    const config = readFileSync('next.config.ts', 'utf8');
    expect(config).toMatch(/Content-Security-Policy/);
    expect(config).toMatch(/blob:/);
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
});
