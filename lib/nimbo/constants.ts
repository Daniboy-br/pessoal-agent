export const NIMBO_AGENT_COUNT = 5;

export const agentPillars = [
  { key: "memory", label: "Memória", description: "Contexto, histórico, preferências, padrões e decisões relevantes." },
  { key: "execution", label: "Execução", description: "Planos, tarefas, ações, follow-ups e entregas." },
  { key: "knowledge", label: "Conhecimento", description: "Fontes, repertório, aprendizados, referências e materiais." },
  { key: "clarity", label: "Clareza", description: "Sínteses, critérios, insights, definições e tradeoffs." },
  { key: "creation", label: "Criação", description: "Ideias, versões, rascunhos, hipóteses e exploração." },
] as const;

export const initialAgents = [
  { slot: 1, role: "guide", name: "Guia central", description: "Recebe o usuário, entende o contexto geral e coordena o Nimbo." },
  { slot: 2, role: "specialist", name: "Especialista emergente A", description: "Nasce do primeiro foco recorrente relevante." },
  { slot: 3, role: "specialist", name: "Especialista emergente B", description: "Aprofunda uma segunda necessidade real do usuário." },
  { slot: 4, role: "specialist", name: "Especialista emergente C", description: "Amplia o campo pessoal para outro contexto importante." },
  { slot: 5, role: "specialist", name: "Especialista emergente D", description: "Fecha a primeira sensação de Nimbo completo." },
] as const;
