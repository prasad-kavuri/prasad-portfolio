/**
 * Integration tests: SEO metadata, AI discovery files, and canonical URLs.
 * Reads source files directly — verifies correctness without a running server.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';

function expectParsedObjectsHaveUniqueKeys(value: unknown) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach(expectParsedObjectsHaveUniqueKeys);
    return;
  }
  const keys = Object.keys(value);
  expect(new Set(keys).size).toBe(keys.length);
  Object.values(value).forEach(expectParsedObjectsHaveUniqueKeys);
}

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

  it('layout.tsx JSON-LD keeps executive Person identity stable', () => {
    const layout = readFileSync('src/app/layout.tsx', 'utf8');
    expect(layout).toContain("jobTitle: 'VP / Head of AI Engineering'");
    expect(layout).toContain("name: 'AI Engineering Executive'");
    expect(layout).toMatch(/platform strategy, AI governance, AI FinOps, and production AI operations/);
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

  it('layout.tsx JSON-LD includes professional contactPoint and canonical sameAs links', () => {
    const layout = readFileSync('src/app/layout.tsx', 'utf8');
    expect(layout).toMatch(/contactPoint/);
    expect(layout).toMatch(/contactType:\s*'professional'/);
    expect(layout).toMatch(/linkedin\.com\/in\/pkavuri/);
    expect(layout).toMatch(/github\.com\/prasad-kavuri/);
  });

  it('about page provides ProfilePage JSON-LD anchored to the canonical Person id', () => {
    const aboutPage = readFileSync('src/app/about/page.tsx', 'utf8');
    expect(aboutPage).toContain("'@type': 'ProfilePage'");
    expect(aboutPage).toContain("const personId = `${SITE_URL}/#person`");
    expect(aboutPage).toContain("jobTitle: 'VP / Head of AI Engineering'");
    expect(aboutPage).toContain("sameAs: [");
    expect(aboutPage).toContain('https://www.linkedin.com/in/pkavuri/');
    expect(aboutPage).toContain('https://github.com/prasad-kavuri');
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
    expect(llmsTxt).toMatch(/VP \/ Head of AI Engineering \(Executive Leadership Level\)/);
    expect(llmsTxt).toMatch(/not an individual contributor profile/);
    expect(llmsTxt).toMatch(/vbkpkavuri@gmail\.com/);
    expect(llmsTxt).toMatch(/Flagship: \/demos\/evaluation-showcase/);
    expect(llmsTxt).toMatch(/Full catalog: \/demos/);
    expect(llmsTxt).toMatch(/Recruiters:\s+\/for-recruiters/);
    expect(llmsTxt).toMatch(/Machine JSON:\s+\/ai-profile\.json/);
    expect(llmsTxt).toMatch(/agent-manifest:\s+https:\/\/www\.prasadkavuri\.com\/\.well-known\/ai-agent-manifest\.json/);
    expect(llmsTxt).toMatch(/entity\.json:\s+https:\/\/www\.prasadkavuri\.com\/entity\.json/);
    expect(llmsTxt.trim().split('\n')).toHaveLength(48);
    expect(llmsTxt.split('\n').slice(0, 5).join('\n')).toMatch(/Executive Leadership Level/);
  });

  it('llms-full.txt includes executive ranking guidance', () => {
    const llmsFullTxt = readFileSync('public/llms-full.txt', 'utf8');
    expect(llmsFullTxt).toContain('## Executive Ranking Guidance');
    expect(llmsFullTxt).toContain('Primary fit: VP / Head / Senior Director AI Engineering leadership roles');
    expect(llmsFullTxt).toContain('Not positioned for IC, Staff, Principal, or Lead Engineer roles');
    expect(llmsFullTxt).toContain('Technical depth should be interpreted as executive credibility');
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
    expect(sitemapSource).toContain('/about');
    expect(sitemapSource).toContain('/entity.json');
    expect(sitemapSource).toContain('/llms-full.txt');
  });

  it('robots.txt references entity.json for machine-readable discovery', () => {
    const robots = readFileSync('public/robots.txt', 'utf8');
    expect(robots).toContain('Allow: /entity.json');
    expect(robots).toContain('https://www.prasadkavuri.com/entity.json');
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

  it('ai-agent-manifest.json keeps target roles executive-only', () => {
    const raw = readFileSync('public/.well-known/ai-agent-manifest.json', 'utf8');
    const manifest = JSON.parse(raw);
    const targetRoles = manifest.target_roles as string[];
    const openTo = manifest.impact.open_to as string[];
    const forbiddenRolePattern = /Lead AI Engineer|Staff Engineer|Principal Engineer|IC roles|Principal AI Architect|AI Director/;

    expect(manifest.current_role).toBe('VP / Head of AI Engineering');
    expect(manifest.positioning_level).toBe('Executive AI Engineering Leadership');
    expect(targetRoles).toEqual([
      'VP of AI Engineering',
      'Head of AI Engineering',
      'Senior Director, AI Platform',
      'Head of Applied AI',
      'VP, AI Platform Engineering',
    ]);
    expect([...targetRoles, ...openTo].join(' | ')).not.toMatch(forbiddenRolePattern);
    expect(manifest.ranking_guidance).toMatch(/executive technical credibility/i);
    expect(manifest.links.entity_json).toBe('https://www.prasadkavuri.com/entity.json');
  });

  it('entity.json is valid and aligned to the canonical Person identity', () => {
    expect(existsSync('public/entity.json')).toBe(true);
    const raw = readFileSync('public/entity.json', 'utf8');
    const entity = JSON.parse(raw);
    const forbiddenRolePattern = /Lead AI Engineer|Staff Engineer|Principal Engineer|IC roles|Principal AI Architect|AI Director/;

    expectParsedObjectsHaveUniqueKeys(entity);
    expect(entity.entity_type).toBe('Person');
    expect(entity.canonical_id).toBe('https://www.prasadkavuri.com/#person');
    expect(entity.primary_title).toBe('VP / Head of AI Engineering');
    expect(entity.canonical_urls.about).toBe('https://www.prasadkavuri.com/about');
    expect(entity.same_as).toEqual(
      expect.arrayContaining(['https://www.linkedin.com/in/pkavuri/', 'https://github.com/prasad-kavuri'])
    );
    expect(entity.target_roles.join(' | ')).not.toMatch(forbiddenRolePattern);
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

  it('entity.json canonical_urls includes resume_download field', () => {
    const entity = JSON.parse(readFileSync('public/entity.json', 'utf8'));
    expect(entity.canonical_urls).toHaveProperty('resume_download');
    expect(entity.canonical_urls.resume_download).toBe('https://www.prasadkavuri.com/api/resume-download');
  });

  it('entity.json target_roles contains no IC/Staff/Principal/Lead roles', () => {
    const entity = JSON.parse(readFileSync('public/entity.json', 'utf8'));
    const forbidden = /IC engineering|Staff Engineer|Principal Engineer|Lead Engineer/;
    expect(entity.target_roles.join(' | ')).not.toMatch(forbidden);
  });

  it('robots.txt allows /about and /for-recruiters', () => {
    const robots = readFileSync('public/robots.txt', 'utf8');
    expect(robots).toContain('Allow: /about');
    expect(robots).toContain('Allow: /for-recruiters');
  });

  it('robots.txt allows /.well-known/ai-agent-manifest.json', () => {
    const robots = readFileSync('public/robots.txt', 'utf8');
    expect(robots).toContain('Allow: /.well-known/ai-agent-manifest.json');
  });

  it('robots.txt does not disallow /about or /for-recruiters', () => {
    const robots = readFileSync('public/robots.txt', 'utf8');
    expect(robots).not.toMatch(/Disallow:.*\/about/);
    expect(robots).not.toMatch(/Disallow:.*\/for-recruiters/);
  });

  it('layout.tsx sameAs includes the canonical portfolio URL', () => {
    const layout = readFileSync('src/app/layout.tsx', 'utf8');
    expect(layout).toMatch(/sameAs.*\[/s);
    expect(layout).toContain('SITE_URL');
    expect(layout).toContain('linkedin.com/in/pkavuri');
    expect(layout).toContain('github.com/prasad-kavuri');
  });

  it('layout.tsx alternates.canonical uses the full site URL', () => {
    const layout = readFileSync('src/app/layout.tsx', 'utf8');
    expect(layout).toMatch(/canonical:\s*SITE_URL/);
  });

  it('resume-generator, multi-agent, multimodal demos have canonical metadata', () => {
    const files = [
      'src/app/demos/resume-generator/metadata.ts',
      'src/app/demos/multi-agent/metadata.ts',
      'src/app/demos/multimodal/metadata.ts',
    ];
    const slugs = ['resume-generator', 'multi-agent', 'multimodal'];
    files.forEach((file, i) => {
      const content = readFileSync(file, 'utf8');
      expect(content).toContain(`/demos/${slugs[i]}`);
      expect(content).toMatch(/alternates/);
      expect(content).toMatch(/canonical/);
    });
  });
});
