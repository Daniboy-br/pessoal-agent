# Feature — Prompt Builder

## O que é

`PromptBuilder` é o módulo que monta o prompt do Nimbo por blocos auditáveis.

Ele evita que o prompt vire um texto gigante, difícil de debugar e impossível de versionar.

## Para que serve

Serve para organizar o contexto enviado ao guia central ou a um especialista.

Blocos atuais:

- identidade do Nimbo;
- identidade do agente;
- perfil inicial do usuário;
- estado do Nimbo;
- memórias relevantes;
- instrução do turno.

## Como funciona

1. `AgentTurnService` carrega agente, perfil, Nimbo e memórias.
2. Chama `renderPrompt(...)`.
3. O `PromptBuilder` devolve:
   - `version`;
   - lista de blocos;
   - `systemPrompt` renderizado.
4. O runtime salva os nomes dos blocos em `agent_turns.metadata` e `llm_calls.metadata`.

## Arquivos/tabelas envolvidos

- Serviço: `lib/nimbo/prompt-builder.ts`
- Consumidor: `lib/nimbo/agent-turn-service.ts`
- Tabelas impactadas:
  - `agent_turns`
  - `llm_calls`

## O que já está pronto

- Prompt por blocos.
- Versão de prompt por agente.
- Renderização simples para chamada LLM/fallback.
- Registro dos blocos usados no turno.

## O que ainda falta

- Sanitização de conteúdo externo contra prompt injection.
- Controle de tamanho/context compression.
- Snapshot seguro de prompt para debug, sem salvar conteúdo sensível por padrão.
- Blocos específicos para especialistas.

## Como verificar

Chamar `POST /api/chat` e confirmar que `agent_turns.metadata.prompt_blocks` contém os blocos usados no prompt.
