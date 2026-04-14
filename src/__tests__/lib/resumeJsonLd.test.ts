import { describe, it, expect } from 'vitest';
import { generateResumeJsonLd, renderJsonLdScript, type ResumeData } from '@/lib/resumeJsonLd';

const baseData: ResumeData = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  headline: 'Senior AI Engineer',
  location: 'San Francisco, CA',
  summary: 'Experienced AI engineer building production LLM systems.',
  skills: ['Python', 'TypeScript', 'LangChain'],
  experience: [
    { title: 'AI Engineer',  company: 'Acme Corp', startDate: '2022-01', endDate: 'Present', description: 'Led LLM platform.' },
    { title: 'ML Engineer',  company: 'Beta Inc',  startDate: '2020-03', endDate: '2021-12' },
  ],
  education: [
    { degree: 'B.Sc. Computer Science', institution: 'State University', endDate: '2020', fieldOfStudy: 'Computer Science' },
  ],
  certifications: [
    { name: 'AWS Solutions Architect', issuer: 'Amazon', date: '2023-05' },
  ],
  urls: {
    linkedin:  'https://linkedin.com/in/janedoe',
    github:    'https://github.com/janedoe',
    portfolio: 'https://janedoe.dev',
  },
};

describe('generateResumeJsonLd', () => {
  it('output has correct @context and @type', () => {
    const result = generateResumeJsonLd(baseData);
    expect(result['@context']).toBe('https://schema.org');
    expect(result['@type']).toBe('Person');
  });

  it('name is always present', () => {
    const result = generateResumeJsonLd({ name: 'Min Data' });
    expect(result.name).toBe('Min Data');
  });

  it('email is included when provided', () => {
    const result = generateResumeJsonLd(baseData);
    expect(result.email).toBe('jane@example.com');
  });

  it('email is absent when not provided', () => {
    const result = generateResumeJsonLd({ name: 'Jane' });
    expect(result.email).toBeUndefined();
  });

  it('skills map to knowsAbout array', () => {
    const result = generateResumeJsonLd(baseData);
    expect(result.knowsAbout).toEqual(['Python', 'TypeScript', 'LangChain']);
  });

  it('empty skills array results in omitted knowsAbout key', () => {
    const result = generateResumeJsonLd({ name: 'Jane', skills: [] });
    expect(result.knowsAbout).toBeUndefined();
  });

  it('current employer (Present) maps to worksFor', () => {
    const result = generateResumeJsonLd(baseData);
    expect(result.worksFor).toEqual({ '@type': 'Organization', name: 'Acme Corp' });
  });

  it('past employers do NOT appear in worksFor', () => {
    const data: ResumeData = {
      name: 'Jane',
      experience: [
        { title: 'Engineer', company: 'Old Co', endDate: '2020-01' },
      ],
    };
    const result = generateResumeJsonLd(data);
    expect(result.worksFor).toBeUndefined();
  });

  it('experience with no endDate is treated as current and sets worksFor', () => {
    const data: ResumeData = {
      name: 'Jane',
      experience: [{ title: 'Engineer', company: 'Current Co' }],
    };
    const result = generateResumeJsonLd(data);
    expect(result.worksFor?.name).toBe('Current Co');
  });

  it('education maps to alumniOf array', () => {
    const result = generateResumeJsonLd(baseData);
    expect(result.alumniOf).toHaveLength(1);
    expect(result.alumniOf![0].name).toBe('State University');
  });

  it('certifications map to hasCredential array', () => {
    const result = generateResumeJsonLd(baseData);
    expect(result.hasCredential).toHaveLength(1);
    expect(result.hasCredential![0].name).toBe('AWS Solutions Architect');
  });

  it('certification issuer maps to recognizedBy.name', () => {
    const result = generateResumeJsonLd(baseData);
    expect(result.hasCredential![0].recognizedBy?.name).toBe('Amazon');
  });

  it('linkedin and github URLs appear in sameAs array', () => {
    const result = generateResumeJsonLd(baseData);
    expect(result.sameAs).toContain('https://linkedin.com/in/janedoe');
    expect(result.sameAs).toContain('https://github.com/janedoe');
  });

  it('all sameAs entries start with https://', () => {
    const result = generateResumeJsonLd(baseData);
    result.sameAs?.forEach(url => {
      expect(url.startsWith('https://')).toBe(true);
    });
  });

  it('mainEntityOfPage is set when canonicalUrl is provided', () => {
    const result = generateResumeJsonLd(baseData, 'https://example.com/resume');
    expect(result.mainEntityOfPage).toEqual({
      '@type': 'WebPage',
      '@id': 'https://example.com/resume',
    });
  });

  it('mainEntityOfPage is absent when canonicalUrl is omitted', () => {
    const result = generateResumeJsonLd(baseData);
    expect(result.mainEntityOfPage).toBeUndefined();
  });

  it('location maps to address.addressLocality', () => {
    const result = generateResumeJsonLd(baseData);
    expect(result.address).toEqual({ '@type': 'PostalAddress', addressLocality: 'San Francisco, CA' });
  });

  it('output with no optional fields does not include undefined keys', () => {
    const result = generateResumeJsonLd({ name: 'Min' });
    const json = JSON.stringify(result);
    expect(json).not.toContain('"undefined"');
    expect(json).not.toContain(':undefined');
  });

  it('output is valid JSON', () => {
    const result = generateResumeJsonLd(baseData);
    expect(() => JSON.stringify(result)).not.toThrow();
  });
});

describe('renderJsonLdScript', () => {
  it('returns a script tag with type application/ld+json', () => {
    const jsonLd = generateResumeJsonLd(baseData);
    const script = renderJsonLdScript(jsonLd);
    expect(script).toContain('<script type="application/ld+json">');
    expect(script).toContain('</script>');
  });

  it('embedded JSON is valid and round-trips', () => {
    const jsonLd = generateResumeJsonLd(baseData);
    const script = renderJsonLdScript(jsonLd);
    const match = script.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    expect(match).not.toBeNull();
    expect(() => JSON.parse(match![1])).not.toThrow();
  });
});
