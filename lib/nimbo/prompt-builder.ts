import { RuntimeMemory } from "@/lib/nimbo/memory-service";
import { NimboAgent, NimboProfile, UserProfile } from "@/lib/nimbo/session-router";

type PromptBlockKind = "policy" | "identity" | "state" | "memory" | "capability" | "instruction" | "user_input";

type PromptBlock = {
  key: string;
  kind: PromptBlockKind;
  title: string;
  content: string;
  sensitivity: "public" | "user_context" | "internal";
};

export type PromptBuilderInput = {
  agent: NimboAgent;
  userProfile?: UserProfile | null;
  nimboProfile?: NimboProfile | null;
  memoryContext: string;
  memories?: RuntimeMemory[];
  userMessage: string;
  mode?: string;
  capabilities?: string[];
};

function sanitizePromptText(value: string, maxLength = 4000) {
  const trimmed = value.replace(/\u0000/g, "").trim();
  const escaped = trimmed
    .replace(/```/g, "ʼʼʼ")
    .replace(/<\/?(system|developer|assistant|tool|user)>/gi, "[$1]");
  if (escaped.length <= maxLength) return escaped;
  return `${escaped.slice(0, maxLength - 1)}…`;
}

function renderJson(value: unknown) {
  if (!value || (typeof value === "object" && Object.keys(value).length === 0)) return "não informado";
  return sanitizePromptText(JSON.stringify(value, null, 2), 2500);
}

function block(input: Omit<PromptBlock, "content"> & { content: string | string[] }): PromptBlock {
  return {
    ...input,
    content: Array.isArray(input.content)
      ? input.content.map((item) => sanitizePromptText(item)).join("\n")
      : sanitizePromptText(input.content),
  };
}

export function buildPromptBlocks(input: PromptBuilderInput): PromptBlock[] {
  const tone = typeof input.agent.tone_profile?.style === "string"
    ? input.agent.tone_profile.style
    : "calmo, pessoal, claro e objetivo";
  const capabilities = input.capabilities?.length ? input.capabilities.join(", ") : "conversa sem tools executáveis";

  return [
    block({
      key: "runtime_policy",
      kind: "policy",
      title: "Política de runtime",
      sensitivity: "internal",
      content: [
        "Você está rodando dentro do Nimbo MVP.",
        "Não afirme que executou ações externas, ferramentas, integrações ou gravações se o runtime não informou isso explicitamente.",
        "Trate memórias e perfil como contexto auxiliar, não como verdade absoluta.",
        "Se o usuário pedir ação sensível ou externa, diga que isso ainda precisa de confirmação/capacidade específica.",
      ],
    }),
    block({
      key: "nimbo_identity",
      kind: "identity",
      title: "Identidade do Nimbo",
      sensitivity: "public",
      content: "Nimbo é um agente pessoal com guia central e especialistas emergentes. A experiência deve ser calma, pessoal e útil, sem parecer dashboard frio nem terapia abstrata.",
    }),
    block({
      key: "agent_identity",
      kind: "identity",
      title: "Identidade do agente",
      sensitivity: "internal",
      content: [
        `Nome: ${input.agent.name}`,
        `Tipo: ${input.agent.agent_kind === "guide" ? "guia central" : "especialista emergente"}`,
        `Descrição: ${input.agent.description ?? "não informado"}`,
        `Território: ${input.agent.territory ?? "visão geral do usuário"}`,
        `Tom: ${tone}`,
      ],
    }),
    block({
      key: "user_profile",
      kind: "state",
      title: "Perfil inicial do usuário",
      sensitivity: "user_context",
      content: [
        `Nome/apelido: ${input.userProfile?.nickname ?? "não informado"}`,
        `Preferência de tom: ${input.userProfile?.tone_preference ?? "não informado"}`,
        `Contexto atual: ${renderJson(input.userProfile?.current_context)}`,
      ],
    }),
    block({
      key: "nimbo_state",
      kind: "state",
      title: "Estado do Nimbo",
      sensitivity: "internal",
      content: [
        `Nome: ${input.nimboProfile?.name ?? "Meu Nimbo"}`,
        `Status: ${input.nimboProfile?.status ?? "forming"}`,
        `Metadados: ${renderJson(input.nimboProfile?.metadata)}`,
      ],
    }),
    block({
      key: "memory_context",
      kind: "memory",
      title: "Memórias relevantes",
      sensitivity: "user_context",
      content: input.memoryContext,
    }),
    block({
      key: "capabilities",
      kind: "capability",
      title: "Capacidades liberadas neste turno",
      sensitivity: "internal",
      content: [
        `Modo: ${input.mode ?? "free"}`,
        `Capacidades: ${capabilities}`,
        "Sem tools liberadas, responda apenas em texto.",
      ],
    }),
    block({
      key: "turn_instruction",
      kind: "instruction",
      title: "Instrução do turno",
      sensitivity: "internal",
      content: [
        "Responda como guia central do Nimbo neste MVP.",
        "Seja breve, humano, calmo e prático.",
        "Quando faltar contexto, faça no máximo uma pergunta objetiva.",
      ],
    }),
    block({
      key: "user_message",
      kind: "user_input",
      title: "Mensagem do usuário",
      sensitivity: "user_context",
      content: input.userMessage,
    }),
  ];
}

export function renderPrompt(input: PromptBuilderInput) {
  const blocks = buildPromptBlocks(input);
  return {
    version: input.agent.prompt_version ?? "nimbo-guide-v1",
    blocks,
    safeMetadata: blocks.map((item) => ({
      key: item.key,
      kind: item.kind,
      sensitivity: item.sensitivity,
      title: item.title,
    })),
    systemPrompt: blocks.map((item) => `## ${item.title}\n${item.content}`).join("\n\n"),
  };
}
