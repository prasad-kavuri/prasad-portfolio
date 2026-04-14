/**
 * resumeJsonLd.ts
 *
 * Generates a schema.org/Person JSON-LD payload from structured resume data.
 *
 * JSON-LD is a machine-readable layer embedded in the resume page's <head>
 * or as a downloadable .json alongside the PDF. It allows AI-driven ATS
 * systems (Greenhouse, Lever, Workday) to parse candidate data without
 * relying on OCR or PDF text extraction.
 *
 * Reference: https://schema.org/Person
 * Validation:  https://validator.schema.org/
 */

export interface ResumeData {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  headline?: string;
  summary?: string;
  skills?: string[];
  experience?: Array<{
    title: string;
    company: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }>;
  education?: Array<{
    degree: string;
    institution: string;
    startDate?: string;
    endDate?: string;
    fieldOfStudy?: string;
  }>;
  projects?: Array<{
    name: string;
    description?: string;
    url?: string;
    technologies?: string[];
  }>;
  certifications?: Array<{
    name: string;
    issuer?: string;
    date?: string;
  }>;
  urls?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
    website?: string;
  };
}

export interface JsonLdPerson {
  '@context': 'https://schema.org';
  '@type': 'Person';
  name: string;
  email?: string;
  telephone?: string;
  address?: { '@type': 'PostalAddress'; addressLocality: string };
  description?: string;
  jobTitle?: string;
  knowsAbout?: string[];
  hasCredential?: Array<{
    '@type': 'EducationalOccupationalCredential';
    name: string;
    recognizedBy?: { '@type': 'Organization'; name: string };
    dateCreated?: string;
  }>;
  alumniOf?: Array<{
    '@type': 'EducationalOrganization';
    name: string;
    description?: string;
  }>;
  worksFor?: {
    '@type': 'Organization';
    name: string;
  };
  hasOccupation?: Array<{
    '@type': 'Occupation';
    name: string;
    occupationLocation?: { '@type': 'Organization'; name: string };
    description?: string;
    startDate?: string;
    endDate?: string;
  }>;
  sameAs?: string[];
  url?: string;
  mainEntityOfPage?: {
    '@type': 'WebPage';
    '@id': string;
  };
}

export function generateResumeJsonLd(data: ResumeData, canonicalUrl?: string): JsonLdPerson {
  const jsonLd: JsonLdPerson = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: data.name,
  };

  if (data.email) jsonLd.email = data.email;
  if (data.phone) jsonLd.telephone = data.phone;
  if (data.location) {
    jsonLd.address = { '@type': 'PostalAddress', addressLocality: data.location };
  }
  if (data.summary || data.headline) {
    jsonLd.description = data.summary ?? data.headline;
  }
  if (data.headline) jsonLd.jobTitle = data.headline;
  if (data.skills?.length) jsonLd.knowsAbout = data.skills;

  if (data.experience?.length) {
    const current = data.experience.find(
      e => !e.endDate || e.endDate.toLowerCase() === 'present'
    );
    if (current) {
      jsonLd.worksFor = { '@type': 'Organization', name: current.company };
    }
    jsonLd.hasOccupation = data.experience.map(e => ({
      '@type': 'Occupation' as const,
      name: e.title,
      occupationLocation: { '@type': 'Organization' as const, name: e.company },
      ...(e.description && { description: e.description }),
      ...(e.startDate && { startDate: e.startDate }),
      ...(e.endDate && e.endDate.toLowerCase() !== 'present' && { endDate: e.endDate }),
    }));
  }

  if (data.education?.length) {
    jsonLd.alumniOf = data.education.map(e => ({
      '@type': 'EducationalOrganization' as const,
      name: e.institution,
      ...(e.degree && e.fieldOfStudy
        ? { description: `${e.degree} in ${e.fieldOfStudy}` }
        : e.degree
        ? { description: e.degree }
        : {}),
    }));
  }

  if (data.certifications?.length) {
    jsonLd.hasCredential = data.certifications.map(c => ({
      '@type': 'EducationalOccupationalCredential' as const,
      name: c.name,
      ...(c.issuer && { recognizedBy: { '@type': 'Organization' as const, name: c.issuer } }),
      ...(c.date && { dateCreated: c.date }),
    }));
  }

  const sameAs: string[] = [];
  if (data.urls?.linkedin)  sameAs.push(data.urls.linkedin);
  if (data.urls?.github)    sameAs.push(data.urls.github);
  if (data.urls?.portfolio) sameAs.push(data.urls.portfolio);
  if (data.urls?.website)   sameAs.push(data.urls.website);
  if (sameAs.length) jsonLd.sameAs = sameAs;

  if (data.urls?.portfolio || data.urls?.website) {
    jsonLd.url = data.urls.portfolio ?? data.urls.website;
  }

  if (canonicalUrl) {
    jsonLd.mainEntityOfPage = { '@type': 'WebPage', '@id': canonicalUrl };
  }

  return jsonLd;
}

/**
 * Returns a <script> tag string for embedding in HTML <head>.
 * Safe to use with dangerouslySetInnerHTML — content is JSON only.
 */
export function renderJsonLdScript(jsonLd: JsonLdPerson): string {
  return `<script type="application/ld+json">${JSON.stringify(jsonLd, null, 0)}</script>`;
}
