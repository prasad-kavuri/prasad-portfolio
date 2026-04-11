import { NextRequest, NextResponse } from 'next/server';
import profile from '@/data/profile.json';
import { rateLimit, detectPromptInjection } from '@/lib/rate-limit';

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

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'anonymous';
    if (rateLimit(ip).limited) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { jobDescription, focusAreas } = (await req.json()) as RequestBody;

    if (!jobDescription || !jobDescription.trim()) {
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      );
    }

    if (jobDescription.length > 500) {
      return NextResponse.json({ error: 'Input too long' }, { status: 400 });
    }
    if (detectPromptInjection(jobDescription)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY not configured' },
        { status: 500 }
      );
    }

    const focusAreasText = focusAreas.length > 0 ? `\nFocus areas: ${focusAreas.join(', ')}` : '';

    // Build dynamically from profile data
    const topExperience = profile.experience.slice(0, 3)
      .map(exp => `${exp.company} - ${exp.title}: ${exp.highlights.join('. ')}`)
      .join('\n\n');

    const PRASAD_PROFILE = `PRASAD KAVURI - COMPLETE PROFILE FOR RESUME GENERATION:

${topExperience}

Education:
- MBA Strategic Marketing, Northern Illinois University (2012-2014)
- MCA, Osmania University (1999-2002)
- BSc Computer Maintenance & Engineering, Osmania University (1996-1999)

Skills: Agentic AI, LLM Orchestration, RAG, Vector Search, CrewAI, LangGraph,
AWS/Azure/GCP, Kubernetes, MLOps, LLMOps, Product Strategy, Data Platforms,
Distributed Systems, P&L Management, Global Team Leadership`;

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
