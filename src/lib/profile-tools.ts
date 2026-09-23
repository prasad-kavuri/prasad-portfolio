/**
 * Profile tools — the read-only tools about Prasad's career that are exposed through the
 * natural-language demo (/api/mcp-demo), the real MCP server (/api/mcp), and the A2A agent.
 * One definition, one implementation, so every surface returns the same data.
 */
import profile from '@/data/profile.json';

export type ToolArgs = Record<string, unknown>;

export interface ProfileToolDefinition {
  name: 'get_experience' | 'search_skills' | 'get_achievements';
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, { type: 'string'; description: string }>;
    required?: string[];
  };
}

export const PROFILE_TOOLS: ProfileToolDefinition[] = [
  {
    name: "get_experience",
    description:
      "Retrieve Prasad's work experience for a specific company or time period",
    inputSchema: {
      type: "object" as const,
      properties: {
        company: {
          type: "string" as const,
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
      type: "object" as const,
      properties: {
        category: {
          type: "string" as const,
          description:
            "Category: ai_ml, cloud_infrastructure, leadership, industry, or core",
        },
      },
      required: ["category"],
    },
  },
  {
    name: "get_achievements",
    description: "Get quantified achievements and metrics from Prasad's career. Requires a caller credential with the read:profile scope (see /auth.md).",
    inputSchema: {
      type: "object" as const,
      properties: {
        company: {
          type: "string" as const,
          description: "Optional: filter by company name",
        },
      },
    },
  },
];

export const SKILL_CATEGORIES = ['ai_ml', 'cloud_infrastructure', 'leadership', 'industry', 'core'] as const;

export function getStringArg(args: ToolArgs, key: string): string {
  const value = args[key];
  return typeof value === "string" ? value : "";
}

export function executeProfileTool(name: string, args: ToolArgs): string {
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
