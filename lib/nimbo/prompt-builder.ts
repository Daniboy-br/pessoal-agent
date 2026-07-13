type PromptBlock = {
  key: string;
  title: string;
  content: string;
};

export type PromptBuilderInput = {
  agent: {
    id: string;
    name: string;
    agent_kind: "guide" | "specialist";
    description?: string | null;
    territory?: string | null;
    tone_profile?: Record<string, unknown> | null;
    prompt_version?: string | null;
  };
  userProfile?: {
    nickname?: string | null;
    tone_preference?: string | null;
    current_context?: Record<string, unknown> | null;
  } | null;
  nimboProfile?: {
    name?: string | null;
    status?: string | null;
    metadata?: Record<string, unknown> | null;
  } | null;
  memories?: Array<{ memory_type: string; content: string; confidence?: number | null }>;
  userMessage: string;
};

function renderJson(value: unknown) {
  if (!value || (typeof value === "object" && Object.keys(value).length === 0)) return "não informado";
  return JSON.stringify(value, null, 2);
}

export function buildPromptBlocks(input: PromptBuilderInput): PromptBlock[] {
  const tone = typeof input.agent.tone_profile?.style === "string"
    ? input.agent.tone_profile.style
    : "calmo, pessoal, claro e objetivo";

  return [
    {
      key: "nimbo_identity",
      title: "Identidade do Nimbo",
      content: "Nimbo é um agente pessoal com guia central e especialistas emergentes. A experiência deve ser calma, pessoal e útil, sem parecer dashboard frio nem terapia abstrata.",
    },
    {
      key: "agent_identity",
      title: "Identidade do agente",
      content: [
        `Nome: ${input.agent.name}`,
        `Tipo: ${input.agent.agent_kind === "guide" ? "guia central" : "especialista emergente"}`,
        `Descrição: ${input.agent.description ?? "não informado"}`,
        `Território: ${input.agent.territory ?? "visão geral do usuário"}`,
        `Tom: ${tone}`,
      ].join("\n"),
    },
    {
      key: "user_profile",
      title: "Perfil inicial do usuário",
      content: [
        `Nome/apelido: ${input.userProfile?.nickname ?? "não informado"}`,
        `Preferência de tom: ${input.userProfile?.tone_preference ?? "não informado"}`,
        `Contexto atual: ${renderJson(input.userProfile?.current_context)}`,
      ].join("\n"),
    },
    {
      key: "nimbo_state",
      title: "Estado do Nimbo",
      content: [
        `Nome: ${input.nimboProfile?.name ?? "Meu Nimbo"}`,
        `Status: ${input.nimboProfile?.status ?? "forming"}`,
        `Metadados: ${renderJson(input.nimboProfile?.metadata)}`,
      ].join("\n"),
    },
    {
      key: "memory_context",
      title: "Memórias relevantes",
      content: input.memories?.length
        ? input.memories.map((memory) => `- [${memory.memory_type}] ${memory.content}`).join("\n")
        : "Nenhuma memória ativa recuperada para este turno.",
    },
    {
      key: "turn_instruction",
      title: "Instrução do turno",
      content: [
        "Responda como guia central do Nimbo neste MVP.",
        "Seja breve, humano, calmo e prático.",
        "Não finja ter capacidades ainda não implementadas.",
        "Quando faltar contexto, faça no máximo uma pergunta objetiva.",
        `Mensagem do usuário: ${input.userMessage}`,
      ].join("\n"),
    },
  ];
}

export function renderPrompt(input: PromptBuilderInput) {
  const blocks = buildPromptBlocks(input);
  return {
    version: input.agent.prompt_version ?? "nimbo-guide-v0",
    blocks,
    systemPrompt: blocks.map((block) => `## ${block.title}\n${block.content}`).join("\n\n"),
  };
}
