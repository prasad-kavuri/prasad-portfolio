/**
 * A2A v1.0 Agent Card for the portfolio agent (SPEC-0021). Served statically at
 * /.well-known/agent-card.json; a test keeps the static file identical to this builder's output.
 */
import { AgentCard } from '@a2a-js/sdk';

export const A2A_ENDPOINT = 'https://www.prasadkavuri.com/api/a2a';

export function buildAgentCard(): AgentCard {
  return {
    name: 'Prasad Kavuri — Portfolio Agent',
    description:
      "Answers questions about Prasad Kavuri's professional profile and runs the Governed Agent Platform reference workflow: a synthetic payment-exception review with per-tool authorization, human approval, and trajectory evaluation. All finance data is fictional.",
    supportedInterfaces: [{ url: A2A_ENDPOINT, protocolBinding: 'JSONRPC', protocolVersion: '1.0', tenant: '' }],
    provider: { organization: 'Prasad Kavuri (personal portfolio)', url: 'https://www.prasadkavuri.com' },
    version: '1.0.0',
    documentationUrl: 'https://www.prasadkavuri.com/demos/governed-agent-platform',
    capabilities: { streaming: false, pushNotifications: false, extensions: [], extendedAgentCard: false },
    securitySchemes: {
      agentAuth: {
        scheme: {
          $case: 'httpAuthSecurityScheme',
          value: {
            description: 'Bearer credential issued by the auth.md flow (https://www.prasadkavuri.com/auth.md). Scopes: read:profile, finance:sandbox.',
            scheme: 'Bearer',
            bearerFormat: 'auth.md HMAC token',
          },
        },
      },
    },
    securityRequirements: [],
    defaultInputModes: ['text/plain', 'application/json'],
    defaultOutputModes: ['application/json', 'text/plain'],
    skills: [
      {
        id: 'profile-brief',
        name: 'Profile brief',
        description: "Returns a structured brief of Prasad Kavuri's current role, prior roles, and headline outcomes. No credential required.",
        tags: ['profile', 'career', 'ai-platform-leadership'],
        examples: ["Who is Prasad Kavuri?", "Summarize Prasad's AI platform leadership."],
        inputModes: ['text/plain'],
        outputModes: ['application/json'],
        securityRequirements: [],
      },
      {
        id: 'payment-exception-review',
        name: 'Payment exception review (synthetic)',
        description:
          'Reviews a fictional payment exception (PX-1001…PX-1004) through a policy-enforcing tool gateway. Pauses in TASK_STATE_INPUT_REQUIRED for human approval above threshold or when untrusted data is detected; resume by sending {"decision":"approve"|"reject"} on the same task. Requires the finance:sandbox scope.',
        tags: ['agent-governance', 'human-approval', 'tool-authorization', 'finance-ops-sandbox'],
        examples: ['{"exceptionId":"PX-1002"}', 'Review payment exception PX-1003'],
        inputModes: ['application/json', 'text/plain'],
        outputModes: ['application/json'],
        securityRequirements: [{ schemes: { agentAuth: { list: ['finance:sandbox'] } } }],
      },
    ],
    signatures: [],
    iconUrl: undefined,
  };
}

export function agentCardJson(): unknown {
  return AgentCard.toJSON(buildAgentCard());
}
