import { NextRequest, NextResponse } from 'next/server';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  messages: Message[];
  useRAG: boolean;
}

// Knowledge base about Prasad Kavuri
const knowledgeBase = [
  {
    id: 'current-role',
    title: 'Current Role: Head of AI Engineering at Krutrim',
    content: 'Prasad Kavuri is currently Head of AI Engineering at Krutrim (March 2025 - Present), based in Naperville, IL. He leads enterprise adoption of agentic AI, moving AI from experimentation to measurable operating impact. He leads multi-model Generative and Agentic AI platform development including LLM orchestration, RAG, vector search, and real-time personalization powering India\'s first Agentic AI ecosystem — Kruti.ai.',
  },
  {
    id: 'krutrim-architecture',
    title: 'Krutrim: Agentic AI Platform Architecture',
    content: 'At Krutrim, Prasad led architecture and strategy for India\'s first Agentic AI platform (Kruti.ai), delivering 50% lower latency and 40% cost savings through multimodal Agentic AI. He built and scaled a global engineering team delivering enterprise-grade 24/7 PaaS capabilities, integrating diverse AI models and vendors into a unified ecosystem.',
  },
  {
    id: 'krutrim-agents',
    title: 'Krutrim: Domain-Specific AI Agents',
    content: 'At Krutrim, Prasad launched domain-specific AI agents for cab booking, food ordering, bill payments, and image generation, creating new B2B and B2C revenue streams. He drove technology vision for AI orchestration and SDK/API integration, ensuring adoption by enterprise clients and expansion of the Kruti.ai agent ecosystem.',
  },
  {
    id: 'ola-role',
    title: 'Ola: Senior Director of Engineering',
    content: 'Prasad was Senior Director of Engineering at Ola (September 2023 - February 2025), based in Naperville, IL. He led AI-driven platform transformation for Ola Maps, scaling cloud-native infrastructure, LLM-powered routing, and B2B APIs to 13,000+ customers, driving cost-efficient AI adoption across mobility.',
  },
  {
    id: 'ola-infrastructure',
    title: 'Ola Maps: Cloud-Native Infrastructure & Cost Reduction',
    content: 'At Ola, Prasad defined and executed a cloud-native roadmap that reduced infrastructure costs by 70% while enabling Ola Maps to scale API usage across millions of daily calls. He directed strategy and engineering for Ola Maps driving 13K+ B2B customers and built cross-functional engineering teams across the US and India.',
  },
  {
    id: 'ola-optimization',
    title: 'Ola Maps: AI-Powered Route Optimization',
    content: 'At Ola, Prasad introduced AI-powered real-time route optimization for fleet management, boosting ETA accuracy and customer satisfaction. He negotiated and managed strategic vendor partnerships, driving operational efficiency and accelerating adoption in electric mobility and transport sectors.',
  },
  {
    id: 'here-overview',
    title: 'HERE Technologies: 18.4 Year Journey',
    content: 'Prasad spent 18 years and 5 months at HERE Technologies (May 2005 - September 2023) in Chicago, IL, progressing from Senior Engineer to Director. His final role was Head of Infrastructure and Services (May 2023 - September 2023). Before that he was Director of Engineering for Highly Automated Driving (July 2021 - June 2023).',
  },
  {
    id: 'here-autonomous-driving',
    title: 'HERE Technologies: Highly Automated Driving',
    content: 'As Director of Engineering for Highly Automated Driving at HERE Technologies, Prasad delivered AI-enhanced HD mapping and lane-level automation systems, managing a global team of 85+ engineers across North America, Europe, and APAC. He championed AI/ML advancements in automated driving, improving map precision and safety applications for major OEMs.',
  },
  {
    id: 'here-progression',
    title: 'HERE Technologies: Career Progression',
    content: 'At HERE Technologies, Prasad held progressive roles: Sr Engineering Manager (January 2017 - June 2021), Engineering Manager (October 2012 - December 2016), Lead Engineer (April 2009 - October 2012), and Sr Engineer (May 2005 - April 2009). He built foundational map data pipelines, introduced Agile practices, and led cloud transformation.',
  },
  {
    id: 'early-career',
    title: 'Early Career: Paradigm, Denizens, eVision',
    content: 'Before HERE Technologies, Prasad worked at Paradigm Infotech Inc as Software Developer (November 2004 - April 2005) in Maryland, developing GUI and Middle Tier using C# on .NET architecture. He also worked at Denizens Systems Inc as Software Test Engineer (August 2002 - October 2004) in Toronto, creating test plans for pharmacy applications. His earliest role was Senior Network Engineer at eVision Cyber Solutions Limited (January 2000 - July 2002) in Hyderabad, India, responsible for designing, implementing, supporting, and managing complex data networks.',
  },
  {
    id: 'education',
    title: 'Education & Certifications',
    content: 'Prasad\'s education: MBA in Strategic Marketing from Northern Illinois University (2012-2014). Master of Computer Applications from Osmania University (1999-2002). Bachelor\'s degree in Computer Maintenance and Engineering from Osmania University (1996-1999). Certifications: ITIL Foundation Examination, Introduction to Responsible AI, How Business Thinkers Can Start Building AI Plugins With Semantic Kernel, and The Data Scientist\'s Toolbox.',
  },
  {
    id: 'technical-skills',
    title: 'Technical Skills: AI & Data',
    content: 'Prasad\'s top technical skills include: Product Strategy, Data Platforms, Distributed Systems, Agentic AI Architecture, Multi-Model LLM Orchestration, Retrieval-Augmented Generation (RAG), Vector Search and Embeddings, Transformer Models, Real-time Personalization, AI Agent Development, LLM Ops and MLOps.',
  },
  {
    id: 'cloud-infrastructure-skills',
    title: 'Cloud & Infrastructure Skills',
    content: 'Prasad\'s cloud and infrastructure skills: AWS, Azure, GCP, Kubernetes and Microservices, CI/CD and DevOps, Infrastructure as Code, Cloud-Native Architecture, API Platform Development, PaaS and Platform Ecosystems, SDK/API Integration, 24/7 Production Systems.',
  },
  {
    id: 'languages-location',
    title: 'Languages & Location',
    content: 'Prasad is fluent in Hindi, Telugu, and Urdu in addition to English. He is based in Naperville, IL (Greater Chicago Area). His contact: vbkpkavuri@gmail.com, phone 3126232488. LinkedIn: linkedin.com/in/pkavuri. Portfolio: prasadkavuri.com. GitHub: github.com/prasad-kavuri.',
  },
  {
    id: 'professional-summary',
    title: 'Professional Summary',
    content: 'Prasad\'s summary: 20+ years building platforms and leading engineering organizations with recent focus on helping companies adopt AI in a way that changes how they operate. Consistent work turning emerging AI capabilities into production systems, embedding AI into day-to-day workflows not just pilots, aligning engineering product and business teams around measurable outcomes.',
  },
  {
    id: 'leadership-scale',
    title: 'Leadership & Team Management',
    content: 'Prasad has led global teams of 200+ engineers across the US, Europe and India. He works closely with executive stakeholders on platform strategy, investment tradeoffs, and operating model decisions. He has operated in complex regulated environments where data quality and cross-functional alignment are critical.',
  },
  {
    id: 'industry-expertise',
    title: 'Industry Expertise',
    content: 'Prasad\'s industry expertise: Autonomous Systems, Computer Vision, Mobility and Transportation, Mapping and GIS, Automotive Technology, Fleet Management, Enterprise AI Integration, B2B SaaS Platforms, Electric Mobility, Digital Workflows.',
  },
  {
    id: 'key-achievements',
    title: 'Key Quantified Achievements',
    content: 'Prasad\'s key quantified achievements: 50% latency reduction at Krutrim, 40% cost savings at Krutrim, 70% infrastructure cost reduction at Ola, 13,000+ B2B customers at Ola Maps, 200+ engineers led globally, 85+ engineers at HERE Technologies, 18+ years at HERE Technologies, 20+ total years of experience.',
  },
  {
    id: 'background-philosophy',
    title: 'Background & Philosophy',
    content: 'Prasad brings deep expertise in helping companies adopt AI in ways that change how they operate. He has a consistent track record of turning emerging AI capabilities into production systems, embedding AI into day-to-day workflows (not just pilots), and aligning engineering, product and business teams around measurable outcomes. He excels at operating in complex, regulated environments where data quality and cross-functional collaboration are critical.',
  },
  {
    id: 'current-focus',
    title: 'Current Focus: Enterprise AI Adoption',
    content: 'At Krutrim, Prasad\'s current focus is on helping enterprises move AI from experimentation phase into measurable operating impact. His work spans agentic AI architecture, multi-model LLM orchestration, RAG implementations, and building domain-specific AI agents that drive tangible business value. He emphasizes turning AI capabilities into embedded, production-grade systems.',
  },
];

// Simple keyword-based RAG retrieval
function retrieveRelevantDocuments(query: string, topK = 3) {
  const keywords = query.toLowerCase().split(/\s+/);
  const scored = knowledgeBase.map(doc => {
    const text = (doc.title + ' ' + doc.content).toLowerCase();
    const score = keywords.filter(kw => text.includes(kw)).length;
    return { ...doc, score };
  });
  return scored
    .filter(doc => doc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ score, ...doc }) => doc);
}

export async function POST(req: NextRequest) {
  try {
    const { messages, useRAG } = (await req.json()) as RequestBody;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Get the last user message for RAG retrieval
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    // Always inject full knowledge base as base context
    const fullContext = knowledgeBase
      .map(doc => `${doc.title}: ${doc.content}`)
      .join('\n\n');

    let systemPrompt = `You are Prasad Kavuri's AI portfolio assistant.
You have complete knowledge about Prasad's professional background.
Answer questions accurately and specifically using the information below.
Be concise but informative. Never say you lack context — you have it all below.

PRASAD KAVURI - COMPLETE PROFILE:
${fullContext}`;

    let retrievedDocs = [];

    // Additionally highlight most relevant docs if RAG is enabled
    if (useRAG && lastUserMessage) {
      retrievedDocs = retrieveRelevantDocuments(lastUserMessage.content);
    }

    // Prepare messages for Groq API
    const groqMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages,
    ];

    // Call Groq API with streaming
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: groqMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Groq API error:', error);
      return NextResponse.json(
        { error: 'Failed to get response from Groq API' },
        { status: 500 }
      );
    }

    // Create a readable stream for streaming response
    const encoder = new TextEncoder();
    let buffer = '';

    const readableStream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += new TextDecoder().decode(value);
            const lines = buffer.split('\n');

            // Process complete lines
            for (let i = 0; i < lines.length - 1; i++) {
              const line = lines[i].trim();
              if (!line || line === 'data: [DONE]') continue;

              if (line.startsWith('data: ')) {
                try {
                  const json = JSON.parse(line.slice(6));
                  const content = json.choices?.[0]?.delta?.content || '';
                  if (content) {
                    controller.enqueue(encoder.encode(content));
                  }
                } catch {
                  // Skip malformed JSON
                }
              }
            }

            // Keep incomplete line in buffer
            buffer = lines[lines.length - 1];
          }

          // Include retrieved documents metadata at the end
          if (retrievedDocs.length > 0) {
            const metadata = `\n\n[Retrieved ${retrievedDocs.length} documents]`;
            controller.enqueue(encoder.encode(metadata));
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Retrieved-Docs': JSON.stringify(retrievedDocs),
      },
    });
  } catch (error) {
    console.error('Portfolio assistant error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
