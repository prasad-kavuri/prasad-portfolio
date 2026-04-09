import { NextRequest, NextResponse } from 'next/server';

interface RequestBody {
  jobDescription: string;
  focusAreas: string[];
}

interface ResumeResponse {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  summary: string;
  experience: Array<{
    company: string;
    title: string;
    period: string;
    bullets: string[];
  }>;
  skills: string[];
  atsKeywords: string[];
}

const PRASAD_PROFILE = `PRASAD KAVURI - COMPLETE PROFILE FOR RESUME GENERATION:

Current: Head of AI Engineering at Krutrim (March 2025 - Present), Naperville IL
- Architected India's first Agentic AI platform (Kruti.ai) with 200+ engineers
- 50% latency reduction, 40% cost savings via multi-model LLM orchestration
- Built RAG pipelines, vector search, real-time personalization
- Domain-specific AI agents: cab booking, food ordering, bill payments, image generation
- Enterprise PaaS, SDK/API integration, 24/7 production systems

Previous: Senior Director of Engineering at Ola (Sep 2023 - Feb 2025), Naperville IL
- Launched Ola Maps B2B platform, 13,000+ enterprise customers
- 70% infrastructure cost reduction via cloud-native roadmap
- Scaled to millions of daily API calls
- AI-powered real-time route optimization, ETA accuracy
- Led 150+ engineers across US and India
- Strategic vendor partnerships, electric mobility

Previous: HERE Technologies (May 2005 - Sep 2023), Chicago IL - 18+ years
- Director of Engineering, Highly Automated Driving (Jul 2021 - Jun 2023)
- Led 85+ engineers globally across North America, Europe, APAC
- HD mapping and lane-level automation for autonomous driving
- Major OEM partnerships
- Sr Engineering Manager, Engineering Manager, Lead Engineer, Sr Engineer roles
- Cloud migration achieving 50% cost reduction
- Agile transformation, foundational map data pipelines

Education:
- MBA Strategic Marketing, Northern Illinois University (2012-2014)
- MCA, Osmania University (1999-2002)
- BSc Computer Maintenance & Engineering, Osmania University (1996-1999)

Skills: Agentic AI, LLM Orchestration, RAG, Vector Search, CrewAI, LangGraph,
AWS/Azure/GCP, Kubernetes, MLOps, LLMOps, Product Strategy, Data Platforms,
Distributed Systems, P&L Management, Global Team Leadership`;

export async function POST(req: NextRequest) {
  try {
    const { jobDescription, focusAreas } = (await req.json()) as RequestBody;

    if (!jobDescription || !jobDescription.trim()) {
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY not configured' },
        { status: 500 }
      );
    }

    const focusAreasText = focusAreas.length > 0 ? `\nFocus areas: ${focusAreas.join(', ')}` : '';

    const systemPrompt = `You are an expert resume writer and ATS optimization specialist.
Your task is to generate a tailored resume JSON for Prasad Kavuri based on a job description.

${PRASAD_PROFILE}

Instructions:
1. Analyze the job description to extract: required skills, seniority level, industry/domain, and key responsibilities
2. Generate a match score (0-100) based on skill alignment
3. Identify matched skills from Prasad's experience
4. Identify missing skills that were requested
5. Write a tailored professional summary (3-4 sentences) that highlights relevant experience
6. Select the 3 most relevant experience entries and tailor bullet points to match JD language
7. Extract the top 8-10 relevant skills
8. Identify 5-7 ATS keywords from the JD

Return ONLY valid JSON, no markdown or additional text.`;

    const userMessage = `Job Description:
${jobDescription}${focusAreasText}

Generate a tailored resume as JSON with this exact structure:
{
  "matchScore": number (0-100),
  "matchedSkills": string[],
  "missingSkills": string[],
  "summary": "string (3-4 sentences)",
  "experience": [
    {
      "company": "string",
      "title": "string",
      "period": "string",
      "bullets": ["bullet1", "bullet2", "bullet3"]
    }
  ],
  "skills": ["skill1", "skill2", ...],
  "atsKeywords": ["keyword1", "keyword2", ...]
}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Groq API error:', error);
      return NextResponse.json(
        { error: 'Failed to generate resume from Groq API' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Try to parse JSON from the response
    let parsedResume: ResumeResponse;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      parsedResume = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Error parsing resume JSON:', parseError, 'Content:', content);
      return NextResponse.json(
        { error: 'Failed to generate valid resume. Please try again.' },
        { status: 500 }
      );
    }

    // Validate the response structure
    if (!parsedResume.matchScore || !parsedResume.summary || !parsedResume.experience) {
      return NextResponse.json(
        { error: 'Invalid resume structure generated' },
        { status: 500 }
      );
    }

    return NextResponse.json(parsedResume);
  } catch (error) {
    console.error('Resume generator error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
