import { test } from 'vitest';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseFrontmatter, buildIndex, render, main } from '../generate-skill-index.mjs';

const REAL = path.resolve(process.cwd(), 'skills');

function fixture(skills) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'skills-'));
  for (const [name, body] of Object.entries(skills)) {
    mkdirSync(path.join(dir, name));
    writeFileSync(path.join(dir, name, 'SKILL.md'), body);
  }
  return dir;
}

test('parses plain and folded descriptions', () => {
  assert.deepEqual(parseFrontmatter('---\nname: a\ndescription: One line. Use when x.\n---\nbody'), {
    name: 'a',
    description: 'One line. Use when x.',
  });
  assert.deepEqual(parseFrontmatter('---\nname: b\ndescription: >\n  First line\n  second line. Use when y.\n---\n'), {
    name: 'b',
    description: 'First line second line. Use when y.',
  });
  assert.deepEqual(parseFrontmatter('no frontmatter'), { name: undefined, description: undefined });
});

test('lists skills sorted, with raw GitHub entrypoints, and ignores folders without SKILL.md', () => {
  const dir = fixture({ zeta: '---\nname: zeta\ndescription: Z. Use when z.\n---\n', alpha: '---\nname: alpha\ndescription: A. Use when a.\n---\n' });
  mkdirSync(path.join(dir, 'notes'));
  const index = buildIndex(dir);
  assert.deepEqual(index.skills.map((s) => s.name), ['alpha', 'zeta']);
  assert.match(index.skills[0].entrypoint, /^https:\/\/raw\.githubusercontent\.com\/prasad-kavuri\/prasad-portfolio\/main\/skills\/alpha\/SKILL\.md$/);
});

test('rejects a name that does not match its folder, and a missing description', () => {
  assert.throws(() => buildIndex(fixture({ a: '---\nname: b\ndescription: x\n---\n' })), /must match its folder/);
  assert.throws(() => buildIndex(fixture({ a: '---\nname: a\n---\n' })), /missing description/);
});

test('--check passes when the file matches and fails when it is stale or missing', () => {
  const dir = fixture({ a: '---\nname: a\ndescription: A. Use when a.\n---\n' });
  assert.equal(main(['--check'], dir), 1);
  assert.equal(main([], dir), 0);
  assert.equal(main(['--check'], dir), 0);
  writeFileSync(path.join(dir, 'a', 'SKILL.md'), '---\nname: a\ndescription: Changed. Use when a.\n---\n');
  assert.equal(main(['--check'], dir), 1);
});

test('the committed skills/index.json matches the SKILL.md files', () => {
  assert.equal(readFileSync(path.join(REAL, 'index.json'), 'utf8'), render(buildIndex(REAL)));
});
