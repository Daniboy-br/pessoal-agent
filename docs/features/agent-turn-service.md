# Feature — AgentTurnService

## O que é

`AgentTurnService` é o serviço de runtime mínimo do Nimbo.

Ele orquestra um turno de conversa do guia central sem colocar toda a lógica dentro de uma API route.

## Para que serve

Serve para aproximar o backend do Nimbo dos padrões do Hermes/OpenClaw:

- turno explícito;
- mensagem persistida cedo;
- prompt separado;
- memória recuperada antes do turno;
- LLM/fallback chamado;
- resposta persistida;
- custo/latência/status registrados.

## Como funciona

1. Recebe `appUserId`, mensagem e opcionalmente `conversationId`.
2. Carrega perfil, Nimbo e guia central.
3. Cria conversa se necessário.
4. Salva a mensagem do usuário em `messages`.
5. Busca memórias ativas.
6. Monta prompt via `PromptBuilder`.
7. Cria registro em `agent_turns`.
8. Chama o provider LLM ou fallback determinístico.
9. Salva resposta em `messages`.
10. Registra chamada em `llm_calls`.
11. Finaliza `agent_turns` como `completed` ou `error`.

## Arquivos/tabelas envolvidos

- Serviço: `lib/nimbo/agent-turn-service.ts`
- Prompt: `lib/nimbo/prompt-builder.ts`
- Provider: `lib/nimbo/llm-provider.ts`
- Rota: `app/api/chat/route.ts`
- Tabelas:
  - `conversations`
  - `messages`
  - `agent_turns`
  - `llm_calls`
  - `memories`

## O que já está pronto

- Runtime sem tools.
- Guia central como agente principal.
- Fallback determinístico se `OPENAI_API_KEY` não estiver configurada.
- Registro de mensagens, turno e chamada LLM.

## O que ainda falta

- Tool dispatch.
- Memory sync pós-turno.
- Especialistas como advisors.
- Retries/fallbacks mais sofisticados.
- Streaming de resposta.
- Autenticação real do usuário.

## Como verificar

1. Salvar onboarding para obter `appUserId`.
2. Chamar:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"appUserId":"<uuid>","message":"quero organizar minha semana"}'
```

3. Confirmar registros em `conversations`, `messages`, `agent_turns` e `llm_calls`.
