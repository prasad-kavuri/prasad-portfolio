export interface RoutingRecommendation {
  model: string;
  rationale: string;
  executiveTradeoff: string;
}

export function getRoutingRecommendation(prompt: string): RoutingRecommendation {
  const lowerPrompt = prompt.toLowerCase();

  if (/function|class|def|code|python|javascript|typescript|sql/.test(lowerPrompt)) {
    return {
      model: 'qwen/qwen3-32b',
      rationale: 'Code-oriented request detected; route to coding-strong model.',
      executiveTradeoff: 'Balances quality for implementation tasks while containing premium-model spend.',
    };
  }

  if (prompt.length < 50 || /what is|who is|when|where|capital/.test(lowerPrompt)) {
    return {
      model: 'llama-3.1-8b-instant',
      rationale: 'Low-complexity/factual request detected; route to fastest low-cost tier.',
      executiveTradeoff: 'Minimizes latency and token cost for high-volume simple queries.',
    };
  }

  if (/analyze|compare|explain|evaluate|strategy|architecture/.test(lowerPrompt)) {
    return {
      model: 'llama-3.3-70b-versatile',
      rationale: 'Analytical prompt detected; route to higher-capability reasoning tier.',
      executiveTradeoff: 'Spends more per query only where deeper reasoning quality is likely to matter.',
    };
  }

  return {
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    rationale: 'General medium-complexity request; route to balanced capability tier.',
    executiveTradeoff: 'Keeps quality and latency balanced when complexity is ambiguous.',
  };
}
