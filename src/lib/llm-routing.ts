import { CAPABLE_MODEL, CODE_MODEL, FAST_MODEL } from '@/lib/groq-models';

export interface RoutingRecommendation {
  model: string;
  rationale: string;
  executiveTradeoff: string;
}

export function getRoutingRecommendation(prompt: string): RoutingRecommendation {
  const lowerPrompt = prompt.toLowerCase();

  if (/function|class|def|code|python|javascript|typescript|sql/.test(lowerPrompt)) {
    return {
      model: CODE_MODEL.id,
      rationale: 'Code-oriented request detected; route to coding-strong model.',
      executiveTradeoff: 'Balances quality for implementation tasks while containing premium-model spend.',
    };
  }

  if (prompt.length < 50 || /what is|who is|when|where|capital/.test(lowerPrompt)) {
    return {
      model: FAST_MODEL.id,
      rationale: 'Low-complexity/factual request detected; route to fastest low-cost tier.',
      executiveTradeoff: 'Minimizes latency and token cost for high-volume simple queries.',
    };
  }

  if (/analyze|compare|explain|evaluate|strategy|architecture/.test(lowerPrompt)) {
    return {
      model: CAPABLE_MODEL.id,
      rationale: 'Analytical prompt detected; route to higher-capability reasoning tier.',
      executiveTradeoff: 'Spends more per query only where deeper reasoning quality is likely to matter.',
    };
  }

  return {
    model: FAST_MODEL.id,
    rationale: 'General request with no complexity signal; start on the fast, low-cost tier.',
    executiveTradeoff: 'Starts cheap and escalates only when analytical or coding signals appear.',
  };
}
