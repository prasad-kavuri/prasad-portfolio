import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const BASE = 'https://raw.githubusercontent.com/prasad-kavuri/prasad-portfolio/main/';

describe('skill index links', () => {
  it('llms.txt points at a skills index that exists in the repo', () => {
    const llms = readFileSync(path.join(root, 'public/llms.txt'), 'utf8');
    const url = llms.match(/^skills-index:\s+(\S+)/m)?.[1] ?? '';
    expect(url.startsWith(BASE)).toBe(true);
    expect(existsSync(path.join(root, url.slice(BASE.length)))).toBe(true);
  });

  it('the agent-readiness page links the same index', () => {
    const page = readFileSync(path.join(root, 'src/app/agent-readiness/page.tsx'), 'utf8');
    expect(page).toContain('/blob/main/skills/index.json');
  });
});
