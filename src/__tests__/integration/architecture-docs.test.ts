import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { demos } from '@/data/demos';

const routePaths = [
  '/api/llm-router',
  '/api/mcp-demo',
  '/api/multi-agent',
  '/api/portfolio-assistant',
  '/api/resume-download',
  '/api/resume-generator',
];

describe('architecture artifact and documentation', () => {
  it('ships the architecture diagram as a public SVG asset', () => {
    expect(existsSync('public/architecture-diagram.svg')).toBe(true);

    const svg = readFileSync('public/architecture-diagram.svg', 'utf8');
    expect(svg).toContain('<svg');
    expect(svg).toContain('UI Layer');
    expect(svg).toContain('Agentic Orchestration Layer');
    expect(svg).toContain('AI Services Layer');
    expect(svg).toContain('Data and External Services');
  });

  it('documents the current API routes and live demos', () => {
    const docs = readFileSync('docs/ARCHITECTURE.md', 'utf8');

    for (const route of routePaths) {
      expect(docs).toContain(route);
    }

    for (const demo of demos) {
      expect(docs).toContain(demo.title);
      expect(docs).toContain(demo.href);
    }
  });

  it('embeds the canonical architecture artifact in README and docs', () => {
    const readme = readFileSync('README.md', 'utf8');
    const docs = readFileSync('docs/ARCHITECTURE.md', 'utf8');

    expect(readme).toContain('public/architecture-diagram.svg');
    expect(docs).toContain('../public/architecture-diagram.svg');
  });
});
