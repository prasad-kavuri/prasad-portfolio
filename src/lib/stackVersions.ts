// Runs at build time (server-side import) — versions are baked into the build.
// Versions don't change at runtime, only at build time.
import pkg from '../../package.json';

function ver(name: string): string {
  const deps = { ...(pkg.dependencies as Record<string, string>), ...(pkg.devDependencies as Record<string, string>) };
  const raw = deps[name] ?? '—';
  // Strip ^ ~ >= prefixes
  return String(raw).replace(/^[\^~>=]+/, '');
}

export const STACK_VERSIONS = {
  nextjs:          ver('next'),
  react:           ver('react'),
  tailwind:        ver('tailwindcss'),
  typescript:      ver('typescript'),
  groqSdk:         ver('groq-sdk'),
  transformersJs:  ver('@huggingface/transformers'),
  vitest:          ver('vitest'),
  playwright:      ver('@playwright/test'),
} as const;

export const STACK_LABELS: [string, string][] = [
  ['Next.js',          STACK_VERSIONS.nextjs],
  ['React',            STACK_VERSIONS.react],
  ['Tailwind CSS',     STACK_VERSIONS.tailwind],
  ['TypeScript',       STACK_VERSIONS.typescript],
  ['Groq SDK',         STACK_VERSIONS.groqSdk],
  ['Transformers.js',  STACK_VERSIONS.transformersJs],
  ['Vitest',           STACK_VERSIONS.vitest],
  ['Playwright',       STACK_VERSIONS.playwright],
];
