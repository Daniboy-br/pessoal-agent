# Feature — Agent Turns

## O que é

`agent_turns` é a tabela que registra cada turno executado por um agente do Nimbo.

Um turno é diferente de uma mensagem: ele representa o ciclo completo de runtime, incluindo entrada do usuário, prompt, chamada LLM ou fallback, resposta, custo, latência, status e erro.

## Para que serve

Serve para tornar o Nimbo auditável e observável desde o começo, seguindo padrões de Hermes/OpenClaw.

Com essa tabela, conseguimos responder:

- qual agente respondeu;
- em qual conversa;
- qual mensagem entrou;
- qual mensagem saiu;
- qual provider/model foi usado;
- quanto tempo levou;
- se deu erro;
- quantas chamadas foram feitas;
- qual versão de prompt estava ativa.

## Como funciona

1. `AgentTurnService` cria um turno com status `running`.
2. A mensagem do usuário já foi salva antes do turno.
3. O prompt é montado pelo `PromptBuilder`.
4. O LLM ou fallback gera a resposta.
5. A resposta é salva em `messages`.
6. O turno é finalizado como `completed` ou `error`.

## Arquivos/tabelas envolvidos

- Migration: `supabase/migrations/0003_agent_turns.sql`
- Tabela: `public.agent_turns`
- Serviço: `lib/nimbo/agent-turn-service.ts`
- Rota consumidora: `app/api/chat/route.ts`

## O que já está pronto

- Tabela criada.
- Índices por conversa, usuário, agente e status.
- RLS habilitado.
- Grants para `service_role`.
- Registro de status, provider, model, tokens, custo estimado, latência, erro e metadados.

## O que ainda falta

- Policies RLS para usuário autenticado.
- Campos/tabelas futuras para tool calls.
- Dashboard de observabilidade.
- Custo estimado real por modelo.

## Como verificar

```bash
npm run check:supabase
```

Depois de chamar `POST /api/chat`, consultar a tabela `agent_turns` no Supabase e confirmar que um novo turno foi criado.
