#!/usr/bin/env node
// Builds skills/index.json (name, description, entrypoint per skill) from the SKILL.md files (SPEC-0031).
// `node scripts/generate-skill-index.mjs`          writes the file
// `node scripts/generate-skill-index.mjs --check`  exits 1 if the committed file is stale
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAW_BASE = 'https://raw.githubusercontent.com/prasad-kavuri/prasad-portfolio/main/skills';
const GENERATOR = 'scripts/generate-skill-index.mjs';

/** Name and one-line description from a SKILL.md's frontmatter (plain or `>` folded). */
export function parseFrontmatter(text) {
  const fm = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  const name = fm.match(/^name:\s*(.+)$/m)?.[1].trim();
  const description = fm
    .match(/^description:\s*>?\s*\n?([\s\S]*)$/m)?.[1]
    .replace(/\s+/g, ' ')
    .trim();
  return { name, description };
}

export function buildIndex(skillsDir) {
  const skills = readdirSync(skillsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(path.join(skillsDir, d.name, 'SKILL.md')))
    .map((d) => {
      const { name, description } = parseFrontmatter(readFileSync(path.join(skillsDir, d.name, 'SKILL.md'), 'utf8'));
      if (name !== d.name) throw new Error(`skills/${d.name}/SKILL.md: name "${name}" must match its folder`);
      if (!description) throw new Error(`skills/${d.name}/SKILL.md: missing description`);
      return { name, description, entrypoint: `${RAW_BASE}/${d.name}/SKILL.md` };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  return { generator: GENERATOR, skills };
}

export function render(index) {
  return `${JSON.stringify(index, null, 2)}\n`;
}

export function main(argv, skillsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../skills')) {
  const target = path.join(skillsDir, 'index.json');
  const next = render(buildIndex(skillsDir));
  if (argv.includes('--check')) {
    const current = existsSync(target) ? readFileSync(target, 'utf8') : '';
    if (current !== next) {
      console.error('skills/index.json is out of date. Run: node scripts/generate-skill-index.mjs');
      return 1;
    }
    console.log('skills/index.json is up to date.');
    return 0;
  }
  writeFileSync(target, next);
  console.log(`Wrote ${target}`);
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  process.exit(main(process.argv.slice(2)));
}
