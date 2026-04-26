/**
 * Generate executive PDF resume from public/resume.md
 * Usage: node scripts/generate-pdf.mjs
 * Output: public/prasad-kavuri-vp-ai-engineering-2026.pdf
 */
import puppeteer from 'puppeteer';
import { marked } from 'marked';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUTPUT = join(ROOT, 'public', 'prasad-kavuri-vp-ai-engineering-2026.pdf');

const md = readFileSync(join(ROOT, 'public', 'resume.md'), 'utf-8');
const body = marked.parse(md);

const CSS = `
  *, *::before, *::after { box-sizing: border-box; }

  @page {
    size: letter;
    margin: 0.6in 0.7in;
  }

  body {
    font-family: system-ui, -apple-system, Helvetica, Arial, sans-serif;
    font-size: 10.5pt;
    color: #111827;
    line-height: 1.45;
    margin: 0;
    padding: 0;
  }

  h1 {
    font-size: 18pt;
    font-weight: 700;
    margin: 0 0 4px 0;
    line-height: 1.2;
  }

  h2 {
    font-size: 12pt;
    font-weight: 700;
    border-bottom: 1px solid #e5e7eb;
    margin-top: 16px;
    margin-bottom: 6px;
    padding-bottom: 3px;
  }

  h3 {
    font-size: 11pt;
    font-weight: 700;
    margin-top: 8px;
    margin-bottom: 3px;
  }

  p {
    margin: 4px 0;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  ul, ol {
    margin: 4px 0 4px 1.2em;
    padding: 0;
    line-height: 1.5;
  }

  li {
    margin-bottom: 2px;
  }

  hr {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: 12px 0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5pt;
    margin: 6px 0;
  }

  th {
    background: #f3f4f6;
    text-align: left;
    padding: 4px 8px;
    font-weight: 600;
    border-bottom: 1px solid #d1d5db;
  }

  td {
    padding: 4px 8px;
    border-bottom: 1px solid #e5e7eb;
    vertical-align: top;
  }

  strong {
    font-weight: 600;
  }

  code {
    font-family: monospace;
    font-size: 9pt;
    background: #f3f4f6;
    padding: 1px 3px;
    border-radius: 2px;
  }
`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Prasad Kavuri — VP / Head of AI Engineering</title>
  <style>${CSS}</style>
</head>
<body>
${body}
</body>
</html>`;

console.log('Launching browser...');
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'networkidle0' });

console.log('Generating PDF...');
const pdfBuffer = await page.pdf({
  format: 'Letter',
  margin: { top: '0.6in', bottom: '0.6in', left: '0.7in', right: '0.7in' },
  printBackground: true,
  preferCSSPageSize: false,
  displayHeaderFooter: false,
});

await browser.close();

writeFileSync(OUTPUT, pdfBuffer);
const sizeKb = Math.round(pdfBuffer.length / 1024);
console.log(`✓ PDF written to ${OUTPUT}`);
console.log(`  Size: ${sizeKb} KB`);
