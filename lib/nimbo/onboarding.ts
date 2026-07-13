export type QuestionOption = {
  id: string;
  label: string;
  signals: string[];
};

export type OnboardingQuestion = {
  id: string;
  eyebrow: string;
  title: string;
  helper: string;
  type: "single" | "multi";
  options: QuestionOption[];
};

export type Answers = Record<string, string[]>;

export type AwakenedAgent = {
  slot: number;
  name: string;
  mission: string;
  focus: string;
  tone: string;
  firstMove: string;
  pillarEmphasis: string[];
};

export const onboardingQuestions: OnboardingQuestion[] = [
  {
    id: "areas",
    eyebrow: "Mapa inicial",
    title: "Em quais áreas você mais quer apoio hoje?",
    helper: "Pode escolher mais de uma. A ideia é só mapear onde o Nimbo deve prestar atenção primeiro.",
    type: "multi",
    options: [
      { id: "work", label: "Trabalho ou negócio", signals: ["negocio", "execucao", "decisao"] },
      { id: "health", label: "Saúde, energia ou rotina", signals: ["energia", "rotina", "constancia"] },
      { id: "money", label: "Finanças", signals: ["financas", "decisao", "clareza"] },
      { id: "study", label: "Estudos ou aprendizado", signals: ["conhecimento", "clareza", "constancia"] },
      { id: "family", label: "Relacionamentos ou família", signals: ["pessoal", "clareza", "memoria"] },
      { id: "home", label: "Casa e pendências práticas", signals: ["rotina", "execucao", "memoria"] },
      { id: "creative", label: "Ideias, criação ou projetos autorais", signals: ["criacao", "clareza", "projeto"] },
    ],
  },
  {
    id: "current_state",
    eyebrow: "Momento atual",
    title: "Qual frase parece mais com sua vida agora?",
    helper: "Sem resposta perfeita. Escolhe a mais próxima.",
    type: "single",
    options: [
      { id: "many_open", label: "Tenho muita coisa aberta e pouca clareza", signals: ["clareza", "sobrecarga", "decisao"] },
      { id: "execution_block", label: "Sei o que preciso fazer, mas travo na execução", signals: ["execucao", "constancia", "energia"] },
      { id: "building", label: "Estou construindo algo novo", signals: ["projeto", "criacao", "execucao"] },
      { id: "routine", label: "Quero organizar melhor minha rotina", signals: ["rotina", "constancia", "memoria"] },
      { id: "decisions", label: "Quero pensar melhor minhas decisões", signals: ["decisao", "clareza", "conhecimento"] },
      { id: "remember", label: "Quero registrar e lembrar melhor das coisas", signals: ["memoria", "rotina", "clareza"] },
    ],
  },
  {
    id: "project_count",
    eyebrow: "Carga mental",
    title: "Quantos projetos importantes você toca hoje?",
    helper: "Projeto pode ser trabalho, estudo, vida pessoal, negócio ou uma construção paralela.",
    type: "single",
    options: [
      { id: "one", label: "0 a 1", signals: ["foco", "profundidade"] },
      { id: "three", label: "2 a 3", signals: ["prioridade", "clareza"] },
      { id: "five", label: "4 a 5", signals: ["sobrecarga", "prioridade", "execucao"] },
      { id: "many", label: "Mais de 5", signals: ["sobrecarga", "memoria", "prioridade"] },
    ],
  },
  {
    id: "energy_loss",
    eyebrow: "Atrito",
    title: "Onde você sente mais perda de energia?",
    helper: "Escolha os pontos que mais drenam você na prática.",
    type: "multi",
    options: [
      { id: "priorities", label: "Decidir prioridades", signals: ["prioridade", "decisao", "clareza"] },
      { id: "remembering", label: "Lembrar pendências", signals: ["memoria", "rotina"] },
      { id: "starting", label: "Começar tarefas", signals: ["execucao", "energia"] },
      { id: "finishing", label: "Terminar tarefas", signals: ["execucao", "constancia"] },
      { id: "ideas", label: "Organizar ideias", signals: ["criacao", "clareza"] },
      { id: "communication", label: "Comunicar melhor", signals: ["clareza", "criacao", "pessoal"] },
      { id: "consistency", label: "Manter constância", signals: ["constancia", "rotina", "energia"] },
    ],
  },
  {
    id: "expected_help",
    eyebrow: "Ajuda esperada",
    title: "Que tipo de ajuda você espera de um agente pessoal?",
    helper: "Isso ajuda o Nimbo a entender o tipo de apoio mais útil no começo.",
    type: "multi",
    options: [
      { id: "remind", label: "Me lembrar das coisas", signals: ["memoria", "rotina"] },
      { id: "decide", label: "Me ajudar a decidir", signals: ["decisao", "clareza"] },
      { id: "plans", label: "Transformar ideias em planos", signals: ["criacao", "execucao", "clareza"] },
      { id: "accountability", label: "Me acompanhar com leveza", signals: ["constancia", "energia", "pessoal"] },
      { id: "research", label: "Pesquisar e resumir coisas", signals: ["conhecimento", "clareza"] },
      { id: "create", label: "Criar textos ou ideias", signals: ["criacao", "conhecimento"] },
      { id: "organize", label: "Organizar minha vida e projetos", signals: ["prioridade", "memoria", "execucao"] },
    ],
  },
  {
    id: "help_style",
    eyebrow: "Jeito de apoio",
    title: "Como você prefere receber ajuda?",
    helper: "O Nimbo deve se adaptar ao seu jeito, não o contrário.",
    type: "single",
    options: [
      { id: "direct", label: "Direta e objetiva", signals: ["objetivo", "execucao"] },
      { id: "calm", label: "Calma e explicada", signals: ["calmo", "clareza"] },
      { id: "questions", label: "Com perguntas antes de sugerir", signals: ["reflexivo", "pessoal"] },
      { id: "steps", label: "Com plano passo a passo", signals: ["execucao", "clareza"] },
      { id: "followup", label: "Com lembretes e acompanhamento", signals: ["memoria", "constancia"] },
    ],
  },
  {
    id: "balance",
    eyebrow: "Peso do Nimbo",
    title: "Você quer que o Nimbo seja mais...",
    helper: "Isso calibra o tom geral da experiência.",
    type: "single",
    options: [
      { id: "personal", label: "Pessoal", signals: ["pessoal", "calmo"] },
      { id: "professional", label: "Profissional", signals: ["negocio", "objetivo"] },
      { id: "hybrid", label: "Meio a meio", signals: ["pessoal", "negocio", "equilibrio"] },
    ],
  },
  {
    id: "mental_loop",
    eyebrow: "Loop mental",
    title: "O que mais aparece na sua cabeça durante a semana?",
    helper: "Pode marcar mais de um. Isso revela os focos recorrentes.",
    type: "multi",
    options: [
      { id: "work", label: "Trabalho", signals: ["negocio", "prioridade"] },
      { id: "money", label: "Dinheiro", signals: ["financas", "decisao"] },
      { id: "health", label: "Saúde", signals: ["energia", "rotina"] },
      { id: "family", label: "Família ou relacionamento", signals: ["pessoal", "memoria"] },
      { id: "future", label: "Futuro", signals: ["decisao", "clareza"] },
      { id: "study", label: "Estudos", signals: ["conhecimento", "constancia"] },
      { id: "ideas", label: "Ideias e projetos", signals: ["criacao", "projeto"] },
      { id: "loose_tasks", label: "Pendências soltas", signals: ["memoria", "execucao", "sobrecarga"] },
    ],
  },
  {
    id: "overloaded_help",
    eyebrow: "Quando pesa",
    title: "Quando você está sobrecarregado, o que mais ajuda?",
    helper: "Essa resposta orienta o primeiro gesto do Nimbo quando você voltar ao app.",
    type: "single",
    options: [
      { id: "clear_list", label: "Uma lista clara", signals: ["clareza", "execucao"] },
      { id: "conversation", label: "Uma conversa para organizar pensamento", signals: ["pessoal", "clareza"] },
      { id: "prioritize", label: "Alguém priorizar comigo", signals: ["prioridade", "decisao"] },
      { id: "small_steps", label: "Quebrar em passos pequenos", signals: ["execucao", "energia"] },
      { id: "capture", label: "Tirar coisas da cabeça e registrar", signals: ["memoria", "sobrecarga"] },
    ],
  },
  {
    id: "desired_feeling",
    eyebrow: "Primeira promessa",
    title: "Escolha uma frase que você gostaria de sentir usando o Nimbo",
    helper: "Não é slogan final. É uma pista de valor percebido.",
    type: "single",
    options: [
      { id: "start", label: "Agora eu sei por onde começar", signals: ["clareza", "execucao"] },
      { id: "memory", label: "Não preciso guardar tudo na cabeça", signals: ["memoria", "calmo"] },
      { id: "ideas", label: "Minhas ideias estão tomando forma", signals: ["criacao", "projeto"] },
      { id: "routine", label: "Minha rotina está menos solta", signals: ["rotina", "constancia"] },
      { id: "think", label: "Tenho apoio para pensar melhor", signals: ["decisao", "pessoal"] },
    ],
  },
];

const signalLabels: Record<string, string> = {
  negocio: "trabalho e construção",
  energia: "energia e ritmo",
  rotina: "rotina prática",
  constancia: "constância",
  financas: "decisões financeiras",
  conhecimento: "aprendizado e pesquisa",
  pessoal: "vida pessoal",
  memoria: "memória e registro",
  execucao: "execução",
  decisao: "decisão",
  clareza: "clareza",
  criacao: "criação",
  projeto: "projetos novos",
  sobrecarga: "sobrecarga mental",
  prioridade: "priorização",
  calmo: "calma",
  objetivo: "objetividade",
  reflexivo: "reflexão guiada",
  equilibrio: "equilíbrio pessoal-profissional",
  foco: "foco",
  profundidade: "profundidade",
};

const pillarBySignal: Record<string, string> = {
  memoria: "Memória",
  execucao: "Execução",
  conhecimento: "Conhecimento",
  clareza: "Clareza",
  criacao: "Criação",
  decisao: "Clareza",
  prioridade: "Clareza",
  rotina: "Execução",
  constancia: "Execução",
  projeto: "Criação",
  sobrecarga: "Memória",
  negocio: "Execução",
  pessoal: "Memória",
};

const nameOpeners = ["Compasso", "Núcleo", "Farol", "Ateliê", "Âncora", "Pulso", "Mapa", "Ritmo"];
const nameSubjects = ["de Clareza", "de Movimento", "de Foco", "de Continuidade", "de Ideias", "de Presença", "de Decisão", "de Ordem"];

function scoreSignals(answers: Answers) {
  const scores = new Map<string, number>();

  for (const question of onboardingQuestions) {
    const selected = answers[question.id] ?? [];
    for (const option of question.options) {
      if (!selected.includes(option.id)) continue;
      for (const signal of option.signals) scores.set(signal, (scores.get(signal) ?? 0) + 1);
    }
  }

  return [...scores.entries()].sort((a, b) => b[1] - a[1]);
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function buildAgent(slot: number, signals: string[], offset: number): AwakenedAgent {
  const readable = signals.map((signal) => signalLabels[signal] ?? signal);
  const primary = readable[0] ?? "contexto";
  const secondary = readable[1] ?? "apoio prático";
  const opener = nameOpeners[(offset + slot) % nameOpeners.length];
  const subject = nameSubjects[(offset + signals.length + slot) % nameSubjects.length];
  const pillars = unique(signals.map((signal) => pillarBySignal[signal]).filter(Boolean));

  return {
    slot,
    name: `${opener} ${subject}`,
    mission: `Ajudar a transformar ${primary} e ${secondary} em uma direção mais simples de acompanhar.`,
    focus: readable.slice(0, 3).join(" · "),
    tone: signals.includes("calmo") || signals.includes("pessoal") ? "calmo, próximo e sem pressão" : "claro, prático e cuidadoso",
    firstMove: signals.includes("sobrecarga")
      ? "Fazer uma captura leve do que está aberto e separar o que pede ação, decisão ou só registro."
      : signals.includes("criacao")
        ? "Pegar uma ideia solta e transformar em primeira versão navegável."
        : signals.includes("execucao")
          ? "Escolher uma próxima ação pequena e tirar do campo mental."
          : "Fazer uma pergunta objetiva para aprofundar o sinal mais forte do perfil.",
    pillarEmphasis: pillars.length ? pillars.slice(0, 3) : ["Memória", "Clareza"],
  };
}

export function awakenAgents(answers: Answers): AwakenedAgent[] {
  const rankedSignals = scoreSignals(answers).map(([signal]) => signal);
  const fallback = ["clareza", "memoria", "execucao", "criacao", "pessoal", "rotina", "decisao", "conhecimento"];
  const signals = unique([...rankedSignals, ...fallback]);

  return [0, 1, 2, 3].map((index) => {
    const group = unique([
      signals[index],
      signals[index + 4],
      signals[(index * 2 + 3) % signals.length],
    ]).filter(Boolean);

    return buildAgent(index + 2, group, rankedSignals.length);
  });
}

export function getRankedSignals(answers: Answers) {
  return scoreSignals(answers).map(([signal, score]) => ({
    key: signal,
    label: signalLabels[signal] ?? signal,
    score,
  }));
}

export function buildProfileSummary(answers: Answers) {
  const ranked = getRankedSignals(answers);
  const topSignals = ranked.slice(0, 5).map((signal) => signal.label);

  if (topSignals.length === 0) {
    return "O Nimbo ainda está aguardando respostas suficientes para formar uma leitura inicial.";
  }

  return `Leitura inicial: seu Nimbo deve prestar atenção principalmente em ${topSignals.join(", ")}. Essa é uma fotografia inicial, não uma definição fechada.`;
}

export function completionPercentage(answers: Answers) {
  const answered = onboardingQuestions.filter((question) => (answers[question.id] ?? []).length > 0).length;
  return Math.round((answered / onboardingQuestions.length) * 100);
}
