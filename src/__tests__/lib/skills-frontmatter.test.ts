import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '../../../skills');
const dirs = readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);

describe('skill frontmatter', () => {
  it.each(dirs)('%s has a hyphen-case name and a "Use when" description under 1024 characters', (dir) => {
    const text = readFileSync(path.join(root, dir, 'SKILL.md'), 'utf8');
    const fm = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
    expect(fm.match(/^name:\s*(.+)$/m)?.[1].trim()).toBe(dir);
    expect(dir).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    const desc = fm.match(/^description:\s*>?\s*\n?([\s\S]*)$/m)?.[1].replace(/\s+/g, ' ').trim() ?? '';
    expect(desc.length).toBeGreaterThan(0);
    expect(desc.length).toBeLessThan(1024);
    expect(desc).toMatch(/Use when/);
  });
});
