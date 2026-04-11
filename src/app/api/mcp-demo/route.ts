import { NextRequest } from "next/server";
import { Groq } from "groq-sdk";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat";
import profile from "@/data/profile.json";
import { detectPromptInjection, sanitizeLLMOutput } from "@/lib/rate-limit";
import { enforceRateLimit, jsonError, readJsonObject } from "@/lib/api";

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

type ToolArgs = Record<string, unknown>;

interface ToolCallLogEntry {
  tool: string;
  args: ToolArgs;
  result: string;
  duration_ms: number;
}

interface ToolResultMessage {
  role: "tool";
  tool_call_id: string;
  content: string;
}

function getStringArg(args: ToolArgs, key: string): string {
  const value = args[key];
  return typeof value === "string" ? value : "";
}

function getStringArrayArg(args: ToolArgs, key: string): string[] {
  const value = args[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function parseToolArgs(argumentsValue: unknown): ToolArgs {
  if (typeof argumentsValue === "string") {
    try {
      const parsed = JSON.parse(argumentsValue) as unknown;
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed as ToolArgs
        : {};
    } catch {
      return {};
    }
  }

  return argumentsValue && typeof argumentsValue === "object" && !Array.isArray(argumentsValue)
    ? argumentsValue as ToolArgs
    : {};
}

function executeTool(name: string, args: ToolArgs): string {
  if (name === "get_experience") {
    const company = getStringArg(args, "company").toLowerCase();
    if (!company) return "Company not found";

    const exp = profile.experience.find(
      (e) =>
        e.company.toLowerCase().includes(company) ||
        e.id.includes(company)
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
    const category = getStringArg(args, "category");
    const skills = profile.skills[
      category as keyof typeof profile.skills
    ];
    if (!skills) return "Category not found";
    return JSON.stringify({ category, skills });
  }

  if (name === "calculate_fit_score") {
    const requiredSkills = getStringArrayArg(args, "required_skills");
    const roleTitle = getStringArg(args, "role_title");
    const allSkills = [
      ...profile.skills.ai_ml,
      ...profile.skills.cloud_infrastructure,
      ...profile.skills.leadership,
      ...profile.skills.industry,
      ...profile.skills.core,
    ].map((s) => s.toLowerCase());

    const matched = requiredSkills.filter((skill) =>
      allSkills.some(
        (s) =>
          s.includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(s)
      )
    );

    const score = requiredSkills.length > 0
      ? Math.round((matched.length / requiredSkills.length) * 100)
      : 0;
    return JSON.stringify({
      role: roleTitle,
      score,
      matched_skills: matched,
      missing_skills: requiredSkills.filter((s) => !matched.includes(s)),
      total_required: requiredSkills.length,
    });
  }

  if (name === "get_achievements") {
    const company = getStringArg(args, "company").toLowerCase();
    let achievements = profile.achievements;
    if (company) {
      achievements = achievements.filter(
        (a) =>
          a.company.toLowerCase().includes(company) ||
          company === "multiple"
      );
    }
    return JSON.stringify(achievements);
  }

  return "Tool not found";
}

export async function POST(request: NextRequest) {
  const rateLimited = await enforceRateLimit(request);
  if (rateLimited) return rateLimited;

  const body = await readJsonObject(request);
  if (!body.ok) return body.response;

  const { query } = body.data;

  if (!query || typeof query !== 'string') {
    return jsonError('Query is required', 400);
  }
  if (query.length > 500) {
    return jsonError('Input too long', 400);
  }
  if (detectPromptInjection(query)) {
    return jsonError('Invalid input', 400);
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return jsonError('GROQ_API_KEY not configured', 500);
  }

  const groq = new Groq({ apiKey });
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
        finalAnswer: sanitizeLLMOutput(message.content || "I could not find relevant information."),
        totalDuration_ms: Date.now() - startTime,
      });
    }

    const toolCallLog: ToolCallLogEntry[] = [];
    const toolResultMessages: ToolResultMessage[] = [];

    // Step 2: Execute tools if called
    if (
      toolSelectionResponse.choices[0].message.tool_calls &&
      toolSelectionResponse.choices[0].message.tool_calls.length > 0
    ) {
      for (const toolCall of toolSelectionResponse.choices[0].message
        .tool_calls) {
        const toolStartTime = Date.now();
        const toolArgs = parseToolArgs(toolCall.function.arguments);
        const result = executeTool(toolCall.function.name, toolArgs);
        const duration = Date.now() - toolStartTime;

        toolCallLog.push({
          tool: toolCall.function.name,
          args: toolArgs,
          result,
          duration_ms: duration,
        });

        toolResultMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        });
      }
    }

    // Step 3: Call Groq again with tool results to get final answer
    let finalAnswer = "";

    if (toolResultMessages.length > 0) {
      // Build message history with tool results
      const messages: ChatCompletionMessageParam[] = [
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
        },
        ...toolResultMessages,
      ];

      const finalResponse = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages,
        max_tokens: 1024,
      });

      finalAnswer = sanitizeLLMOutput(
        finalResponse.choices[0].message.content || "No response generated"
      );
    } else {
      // No tools were called, use the initial response
      finalAnswer = sanitizeLLMOutput(
        toolSelectionResponse.choices[0].message.content || "No response generated"
      );
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
      { error: "Failed to process MCP demo request" },
      { status: 500 }
    );
  }
}
