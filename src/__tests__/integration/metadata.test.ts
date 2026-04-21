/**
 * Integration tests: SEO metadata, AI discovery files, and canonical URLs.
 * Reads source files directly — verifies correctness without a running server.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

describe('SEO metadata integrity', () => {
  it('layout.tsx title is "VP / Head of AI Engineering"', () => {
    const layout = readFileSync('src/app/layout.tsx', 'utf8');
    expect(layout).toMatch(/VP \/ Head of AI Engineering/);
  });

  it('layout.tsx contains JSON-LD Person schema in JSX body', () => {
    const layout = readFileSync('src/app/layout.tsx', 'utf8');
    expect(layout).toMatch(/application\/ld\+json/);
    expect(layout).toMatch(/@type.*Person/);
  });

  it('layout.tsx JSON-LD includes Knowledge Panel identity signals', () => {
    const layout = readFileSync('src/app/layout.tsx', 'utf8');
    expect(layout).toMatch(/personId = `\$\{SITE_URL\}\/#person`/);
    expect(layout).toMatch(/profile-photo\.jpg/);
    expect(layout).toMatch(/sameAs/);
    expect(layout).toMatch(/alumniOf/);
    expect(layout).toMatch(/hasOccupation/);
  });

  it('layout.tsx JSON-LD includes Organization schema for leadership role', () => {
    const layout = readFileSync('src/app/layout.tsx', 'utf8');
    expect(layout).toMatch(/@type.*Organization/);
    expect(layout).toMatch(/organization-krutrim/);
    expect(layout).toMatch(/Head of AI Engineering/);
  });

  it('page.tsx JSON-LD includes Breadcrumb and Speakable schema', () => {
    const page = readFileSync('src/app/page.tsx', 'utf8');
    expect(page).toMatch(/BreadcrumbList/);
    expect(page).toMatch(/SpeakableSpecification/);
    expect(page).toMatch(/#profile-name/);
    expect(page).toMatch(/#profile-summary/);
  });

  it('homepage includes keyboard-accessible skip link and main content target', () => {
    const page = readFileSync('src/app/page.tsx', 'utf8');
    expect(page).toMatch(/Skip to main content/);
    expect(page).toMatch(/href=\"#main-content\"/);
    expect(page).toMatch(/main id=\"main-content\"/);
  });

  it('layout.tsx JSON-LD includes Calendly in sameAs', () => {
    const layout = readFileSync('src/app/layout.tsx', 'utf8');
    expect(layout).toMatch(/calendly\.com\/vbkpkavuri/);
  });

  it('layout.tsx contains openGraph metadata', () => {
    const layout = readFileSync('src/app/layout.tsx', 'utf8');
    expect(layout).toMatch(/openGraph/);
    expect(layout).toMatch(/profile-photo\.jpg/);
  });

  it('layout.tsx twitter card is summary_large_image', () => {
    const layout = readFileSync('src/app/layout.tsx', 'utf8');
    expect(layout).toMatch(/card.*summary_large_image/);
  });

  it('all prasadkavuri.com URLs in layout.tsx use www', () => {
    const layout = readFileSync('src/app/layout.tsx', 'utf8');
    expect(layout).not.toMatch(/https:\/\/prasadkavuri\.com/);
  });

  it('robots.txt exists and disallows /api/', () => {
    const robots = readFileSync('public/robots.txt', 'utf8');
    expect(robots).toMatch(/Disallow: \/api\//);
  });

  it('robots.txt points to www sitemap', () => {
    const robots = readFileSync('public/robots.txt', 'utf8');
    expect(robots).toMatch(/sitemap\.xml/);
  });

  it('llms.txt exists with correct identity and availability', () => {
    const llmsTxt = readFileSync('public/llms.txt', 'utf8');
    expect(llmsTxt).toMatch(/Prasad Kavuri/);
    expect(llmsTxt).toMatch(/VP \/ Head/);
    expect(llmsTxt).toMatch(/calendly\.com/);
    const demoLines = llmsTxt.match(/^- .+: https:\/\/www\.prasadkavuri\.com\/demos\//gm) ?? [];
    expect(demoLines).toHaveLength(13);
    expect(llmsTxt).toMatch(/AI Evaluation Showcase/);
    expect(llmsTxt).toMatch(/Enterprise Control Plane/);
    expect(llmsTxt).toMatch(/Native Browser AI Skill/);
    expect(llmsTxt).toMatch(/AI Spatial Intelligence & World Generation/);
  });

  it('demos index page exists with CollectionPage structured data and canonical route', () => {
    const demosPage = readFileSync('src/app/demos/page.tsx', 'utf8');
    expect(demosPage).toMatch(/CollectionPage/);
    expect(demosPage).toMatch(/SoftwareApplication/);
    expect(demosPage).toContain("canonical: '/demos'");
  });

  it('capabilities page exists with metadata and CollectionPage structured data', () => {
    const capabilitiesPage = readFileSync('src/app/capabilities/page.tsx', 'utf8');
    expect(capabilitiesPage).toMatch(/title:\s*'AI Platform Capabilities'/);
    expect(capabilitiesPage).toMatch(/CollectionPage/);
    expect(capabilitiesPage).toContain('/capabilities');
  });

  it('governance route has dedicated metadata layout with canonical URL', () => {
    const governanceLayout = readFileSync('src/app/governance/layout.tsx', 'utf8');
    expect(governanceLayout).toMatch(/title:\s*'Governance Dashboard'/);
    expect(governanceLayout).toContain("canonical: 'https://www.prasadkavuri.com/governance'");
  });

  it('sitemap includes capabilities route for crawler discovery', () => {
    const sitemapSource = readFileSync('src/app/sitemap.ts', 'utf8');
    expect(sitemapSource).toContain('/capabilities');
  });

  it('security.txt disclosure contact matches profile email', () => {
    const securityTxt = readFileSync('public/.well-known/security.txt', 'utf8');
    const profile = JSON.parse(readFileSync('src/data/profile.json', 'utf8'));
    expect(securityTxt).toContain(`Contact: mailto:${profile.personal.email}`);
    expect(securityTxt).toMatch(/Canonical: https:\/\/www\.prasadkavuri\.com\/\.well-known\/security\.txt/);
  });

  it('ai-agent-manifest.json is valid JSON with required fields', () => {
    const raw = readFileSync('public/.well-known/ai-agent-manifest.json', 'utf8');
    const manifest = JSON.parse(raw);
    expect(manifest).toHaveProperty('name');
    expect(manifest).toHaveProperty('expertise');
    expect(manifest).toHaveProperty('contact');
    expect(manifest).toHaveProperty('demos');
    expect(manifest.name).toMatch(/Prasad Kavuri/);
    expect(manifest.contact).toHaveProperty('calendly');
    expect(Array.isArray(manifest.demos)).toBe(true);
    expect(manifest.demos).toHaveLength(13);
    expect(manifest.demos.some((d: { name: string }) => d.name === 'AI Evaluation Showcase')).toBe(true);
    expect(manifest.demos.some((d: { name: string }) => d.name === 'Enterprise Control Plane')).toBe(true);
    expect(manifest.demos.some((d: { name: string }) => d.name === 'Native Browser AI Skill')).toBe(true);
    expect(manifest.demos.some((d: { name: string }) => d.name === 'AI Spatial Intelligence & World Generation')).toBe(true);
  });

  it('ai-agent-manifest.json includes indexing-friendly enrichment fields', () => {
    const raw = readFileSync('public/.well-known/ai-agent-manifest.json', 'utf8');
    const manifest = JSON.parse(raw);

    expect(manifest).toHaveProperty('experience_summary');
    expect(manifest).toHaveProperty('credentials');
    expect(manifest).toHaveProperty('agent_capabilities');
    expect(manifest).toHaveProperty('domains');
    expect(manifest).toHaveProperty('target_roles');
    expect(manifest).toHaveProperty('certifications');

    // companies may be verbose strings (e.g. "Ex-Krutrim (...)") — check containment
    expect(manifest.credentials.companies.some((c: string) => c.includes('Krutrim'))).toBe(true);
    expect(manifest.credentials.companies.some((c: string) => c.includes('Ola'))).toBe(true);
    expect(manifest.credentials.companies.some((c: string) => c.includes('HERE'))).toBe(true);
    expect(manifest.credentials.focus_areas).toEqual(
      expect.arrayContaining(['Enterprise AI Platforms', 'Agentic AI Systems', 'AI governance'])
    );
    expect(manifest.certifications[0].name).toContain('Google Cloud Certified - Generative AI Leader');
  });

  it('profile.json personal.title is "VP / Head of AI Engineering"', () => {
    const profile = JSON.parse(readFileSync('src/data/profile.json', 'utf8'));
    expect(profile.personal.title).toBe('VP / Head of AI Engineering');
  });

  it('profile.json portfolio URL uses www', () => {
    const profile = JSON.parse(readFileSync('src/data/profile.json', 'utf8'));
    expect(profile.personal.portfolio).toMatch(/www\.prasadkavuri\.com/);
  });

  it('portfolio assistant metadata uses retrieval-grounding language (not strict RAG wording)', () => {
    const metadataSource = readFileSync('src/app/demos/portfolio-assistant/metadata.ts', 'utf8');
    expect(metadataSource).toMatch(/retrieval/i);
    expect(metadataSource).not.toMatch(/Streaming RAG chatbot/i);
  });

  it('global styles include visible keyboard focus treatment for links', () => {
    const globalStyles = readFileSync('src/app/globals.css', 'utf8');
    expect(globalStyles).toMatch(/a:focus-visible/);
    expect(globalStyles).toMatch(/outline:\s*2px/);
  });
});
