# Runtime Architecture v1

## O que é

Camada de arquitetura do runtime agentic do Nimbo, criada para evitar que o app vire um backend improvisado de chat.

A estrutura segue a regra reference-first do projeto: copiar/adaptar padrões de OpenClaw e Hermes Agent antes de personalizar.

## Para que serve

Separar responsabilidades que antes ficavam concentradas no `AgentTurnService`:

- resolução de sessão/conversa/agente;
- busca e sincronização de memória;
- observabilidade de turno, LLM e auditoria;
- montagem de prompt por blocos;
- execução do turno do agente.

## Arquivos envolvidos

- `lib/nimbo/agent-turn-service.ts` — orquestra o turno, agora como coordenador.
- `lib/nimbo/session-router.ts` — resolve usuário, Nimbo, agente, conversa e `sessionKey`.
- `lib/nimbo/memory-service.ts` — faz prefetch de memórias ativas e cria candidatas pós-turno.
- `lib/nimbo/observability-service.ts` — registra turnos, chamadas LLM e eventos metadata-only.
- `lib/nimbo/prompt-builder.ts` — monta prompt v1 com blocos tipados e sanitização básica.
- `lib/nimbo/db-utils.ts` — helpers pequenos para resultados Supabase e normalização.

## Padrões de referência aplicados

### OpenClaw

- Sessão como unidade forte de continuidade.
- Eventos auditáveis metadata-only.
- Separação futura para tools/approvals.

### Hermes Agent

- Turno como loop coordenado por serviço.
- Prompt por blocos.
- Ciclo de memória `prefetch` antes e `syncTurn` depois.
- Observabilidade por request/turn.

## Fluxo atual

1. `POST /api/chat` chama `AgentTurnService.run`.
2. `SessionRouter` resolve usuário, perfil, Nimbo, agente e conversa.
3. Mensagem do usuário é persistida cedo.
4. `MemoryService.prefetch` busca memórias ativas.
5. `PromptBuilder` monta blocos v1.
6. `ObservabilityService.createTurn` cria `agent_turns`.
7. Provider LLM responde.
8. Resposta é salva em `messages`.
9. `llm_calls` e `agent_turns` são atualizados.
10. `MemoryService.syncTurn` cria memória candidata heurística.
11. `audit_events` recebe `turn_start`, `turn_end` ou `turn_error` sem conteúdo sensível completo.

## O que já está pronto

- Runtime dividido em serviços.
- `sessionKey` determinístico em metadata.
- Memória candidata pós-turno.
- Prompt v1 com sanitização básica e capacidades permitidas.
- Auditoria metadata-only para início/fim/erro de turno.
- Typecheck passou após a refatoração.

## O que falta

- UI para revisar memórias candidatas.
- `SessionRouter` com reaproveitamento de sessão aberta por `sessionKey`.
- `ToolRegistry` e tabelas de `tool_calls`.
- Approval layer (`allow-once`, `allow-always`, `deny`).
- Auth/RLS beta com `auth.uid()`.
- Streaming e retries/failover do provider.
- ObservabilityService com spans mais completos e `api_request_id` físico no schema.

## Como verificar

```bash
npm run typecheck
npm run build
npm run check:supabase
```

Teste funcional esperado:

1. completar onboarding;
2. chamar `/api/chat` com `appUserId`;
3. confirmar registros em `messages`, `agent_turns`, `llm_calls`, `audit_events` e memória `candidate`.
