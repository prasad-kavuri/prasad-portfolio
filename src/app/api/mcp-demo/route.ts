import { NextRequest, NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import profile from "@/data/profile.json";
import { rateLimit, detectPromptInjection } from "@/lib/rate-limit";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MCP_TOOLS = [
  {
    name: "get_experience",
    description:
      "Retrieve Prasad's work experience for a specific company or time period",
    inputSchema: {
      type: "object",
      properties: {
        company: {
          type: "string",
          description: "Company name: krutrim, ola, or here",
        },
      },
      required: ["company"],
    },
  },
  {
    name: "search_skills",
    description: "Search Prasad's skills by category",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description:
            "Category: ai_ml, cloud_infrastructure, leadership, industry, or core",
        },
      },
      required: ["category"],
    },
  },
  {
    name: "calculate_fit_score",
    description:
      "Calculate how well Prasad fits a job role based on required skills",
    inputSchema: {
      type: "object",
      properties: {
        required_skills: {
          type: "array",
          items: { type: "string" },
          description: "List of required skills for the role",
        },
        role_title: {
          type: "string",
          description: "The job title being evaluated",
        },
      },
      required: ["required_skills", "role_title"],
    },
  },
  {
    name: "get_achievements",
    description: "Get quantified achievements and metrics from Prasad's career",
    inputSchema: {
      type: "object",
      properties: {
        company: {
          type: "string",
          description: "Optional: filter by company name",
        },
      },
    },
  },
];

const GROQ_TOOLS = MCP_TOOLS.map(tool => ({
  type: "function" as const,
  function: {
    name: tool.name,
    description: tool.description,
    parameters: tool.inputSchema,
  }
}));

function executeTool(name: string, args: any): string {
  if (name === "get_experience") {
    const exp = profile.experience.find(
      (e) =>
        e.company.toLowerCase().includes(args.company.toLowerCase()) ||
        e.id.includes(args.company.toLowerCase())
    );
    if (!exp) return "Company not found";
    return JSON.stringify({
      company: exp.company,
      title: exp.title,
      period: exp.period,
      highlights: exp.highlights,
      tags: exp.tags,
    });
  }

  if (name === "search_skills") {
    const skills = profile.skills[
      args.category as keyof typeof profile.skills
    ];
    if (!skills) return "Category not found";
    return JSON.stringify({ category: args.category, skills });
  }

  if (name === "calculate_fit_score") {
    const allSkills = [
      ...profile.skills.ai_ml,
      ...profile.skills.cloud_infrastructure,
      ...profile.skills.leadership,
      ...profile.skills.industry,
      ...profile.skills.core,
    ].map((s) => s.toLowerCase());

    const matched = args.required_skills.filter((skill: string) =>
      allSkills.some(
        (s) =>
          s.includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(s)
      )
    );

    const score = Math.round((matched.length / args.required_skills.length) * 100);
    return JSON.stringify({
      role: args.role_title,
      score,
      matched_skills: matched,
      missing_skills: args.required_skills.filter(
        (s: string) => !matched.includes(s)
      ),
      total_required: args.required_skills.length,
    });
  }

  if (name === "get_achievements") {
    let achievements = profile.achievements;
    if (args.company) {
      achievements = achievements.filter(
        (a) =>
          a.company.toLowerCase().includes(args.company.toLowerCase()) ||
          args.company.toLowerCase() === "multiple"
      );
    }
    return JSON.stringify(achievements);
  }

  return "Tool not found";
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
  if (rateLimit(ip).limited) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { query } = await request.json();

  if (!query || typeof query !== 'string') {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }
  if (query.length > 500) {
    return NextResponse.json({ error: 'Input too long' }, { status: 400 });
  }
  if (detectPromptInjection(query)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const startTime = Date.now();

  try {
    // Step 1: Initial call to Groq to select tools
    const toolSelectionResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: query,
        },
      ],
      tools: GROQ_TOOLS,
      tool_choice: "required",
      max_tokens: 1024,
    });

    const message = toolSelectionResponse.choices[0].message;

    if (!message.tool_calls || message.tool_calls.length === 0) {
      return Response.json({
        query,
        toolsDiscovered: 4,
        toolCallLog: [],
        finalAnswer: message.content || "I could not find relevant information.",
        totalDuration_ms: Date.now() - startTime,
      });
    }

    const toolCallLog: any[] = [];
    let toolResults: any[] = [];

    // Step 2: Execute tools if called
    if (
      toolSelectionResponse.choices[0].message.tool_calls &&
      toolSelectionResponse.choices[0].message.tool_calls.length > 0
    ) {
      for (const toolCall of toolSelectionResponse.choices[0].message
        .tool_calls) {
        const toolStartTime = Date.now();
        const toolArgs = typeof toolCall.function.arguments === 'string'
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments;
        const result = executeTool(toolCall.function.name, toolArgs);
        const duration = Date.now() - toolStartTime;

        toolCallLog.push({
          tool: toolCall.function.name,
          args: toolArgs,
          result,
          duration_ms: duration,
        });

        toolResults.push({
          type: "tool",
          tool_use_id: toolCall.id,
          content: result,
        });
      }
    }

    // Step 3: Call Groq again with tool results to get final answer
    let finalAnswer = "";

    if (toolResults.length > 0) {
      // Build message history with tool results
      const messages: any[] = [
        {
          role: "system",
          content: "You are an AI assistant with access to tools about Prasad Kavuri's professional profile. You MUST use the provided tools to answer questions. Always call at least one tool before answering. Never generate tool calls in XML format like <function=...>. Only use the standard JSON tool_calls format."
        },
        {
          role: "user",
          content: query
        },
        {
          role: "assistant",
          content: null,
          tool_calls: toolSelectionResponse.choices[0].message.tool_calls
        }
      ];

      // Add each tool result as a separate tool message
      const toolCalls = toolSelectionResponse.choices[0].message.tool_calls ?? [];

      for (const toolCall of toolCalls) {
        const toolArgs = typeof toolCall.function.arguments === 'string'
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments;
        const result = executeTool(toolCall.function.name, toolArgs);
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result
        });
      }

      const finalResponse = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages,
        max_tokens: 1024,
      });

      finalAnswer =
        finalResponse.choices[0].message.content || "No response generated";
    } else {
      // No tools were called, use the initial response
      finalAnswer =
        toolSelectionResponse.choices[0].message.content || "No response generated";
    }

    const totalDuration = Date.now() - startTime;

    return Response.json({
      query,
      toolsDiscovered: MCP_TOOLS.length,
      toolCallLog,
      finalAnswer,
      totalDuration_ms: totalDuration,
    });
  } catch (error) {
    console.error("MCP Demo Error:", error);
    return Response.json(
      {
        error: "Failed to process MCP demo request",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
