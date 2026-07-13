export type LlmRequest = {
  systemPrompt: string;
  userMessage: string;
};

export type LlmResponse = {
  provider: string;
  model: string;
  content: string;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostUsd?: number;
  raw?: unknown;
};

function fallbackGuideResponse(userMessage: string): LlmResponse {
  return {
    provider: "nimbo-fallback",
    model: "deterministic-guide-v0",
    content: [
      "Eu já tenho o começo do seu contexto e vou seguir com calma.",
      "Neste MVP, meu próximo passo é organizar o que você trouxe em uma direção prática, sem tentar resolver tudo de uma vez.",
      `Ponto de partida registrado: “${userMessage}”.`,
      "Se quiser, me diga uma coisa concreta que está ocupando sua cabeça agora e eu transformo isso em um primeiro mapa simples.",
    ].join("\n\n"),
    inputTokens: undefined,
    outputTokens: undefined,
    estimatedCostUsd: undefined,
  };
}

export async function callGuideLlm(request: LlmRequest): Promise<LlmResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.NIMBO_LLM_MODEL ?? "gpt-4.1-mini";

  if (!apiKey) return fallbackGuideResponse(request.userMessage);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: request.systemPrompt },
        { role: "user", content: request.userMessage },
      ],
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`LLM request failed (${response.status}): ${detail.slice(0, 500)}`);
  }

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content;

  if (!content) throw new Error("LLM response did not include assistant content");

  return {
    provider: "openai",
    model,
    content,
    inputTokens: json.usage?.prompt_tokens,
    outputTokens: json.usage?.completion_tokens,
    estimatedCostUsd: undefined,
    raw: { id: json.id, usage: json.usage },
  };
}
