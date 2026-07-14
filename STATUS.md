# STATUS — pessoal-agent / Nimbo app

Atualizado em: 2026-07-09

## Estado atual

- App local Next.js/TypeScript/Supabase criado para o Nimbo.
- Projeto Supabase novo conectado: `https://bvubdcpegsithqoizyow.supabase.co`.
- Credenciais locais ficam em `.env.local` com permissão restrita e ignoradas pelo Git.
- Migrations `0001_nimbo_core.sql` e `0002_nimbo_service_role_grants.sql` foram aplicadas no Supabase novo.
- Verificações registradas: `npm run check:supabase` passou com `schemaReady=true`; `npm run build` passou.

## Próximo passo recomendado

- Validar o deploy Vercel com onboarding real e depois criar UI de revisão de memórias candidatas, já em cima do `MemoryService` v0.

## Atualização — 2026-07-12

- Implementada v0 navegável da home com experiência híbrida, mais calma e pessoal.
- Adicionado pré-questionário objetivo de 10 perguntas tangíveis.
- Criado Motor de Despertar v0 em `lib/nimbo/onboarding.ts`, com scoring de sinais e geração combinatória de 4 especialistas contextuais.
- Ajustada a comunicação dos agentes 2-5 como slots vivos, não personagens fixos.
- Verificações passaram: `npm run typecheck` e `npm run build`.

## Atualização — 2026-07-13

- Daniel definiu Hermes Agent e OpenClaw como base arquitetural do core agentic do Nimbo.
- Plano de alinhamento salvo no cérebro pessoal: `brains/daniel-pessoal-cerebro/memory/projects/agente-pessoal-hype-personas/plano-alinhamento-arquitetural-nimbo-hermes-openclaw-2026-07-13.md`.
- Fase 1 executada: migration `0003_agent_turns.sql`, persistência do onboarding em `/api/onboarding/save`, runtime `AgentTurnService`, `PromptBuilder`, provider LLM/fallback e rota `/api/chat`.
- Regra de documentação aplicada: materiais criados em `docs/features/` para `agent_turns`, persistência do onboarding, `AgentTurnService` e `PromptBuilder`.
- Verificações passaram: `npm run typecheck`, `npm run build`, `npm run check:supabase` com env carregado, teste real de onboarding e teste real de chat.
- Próxima execução recomendada: Fase 2 do plano, criando `MemoryService` v0 e UI de revisão de memórias candidatas.

## Atualização — 2026-07-14

- Fase 2A de arquitetura executada seguindo a regra reference-first Hermes/OpenClaw.
- `AgentTurnService` deixou de concentrar responsabilidades e virou orquestrador.
- Criados `SessionRouter`, `MemoryService`, `ObservabilityService` e helpers de DB.
- `PromptBuilder` evoluído para v1 com blocos tipados, sanitização básica, capacidades permitidas e metadata segura.
- `MemoryService` agora faz prefetch de memórias ativas e cria candidata heurística pós-turno.
- `ObservabilityService` registra `turn_start`, `turn_end` e `turn_error` em `audit_events` com redaction metadata-only.
- Documentação funcional criada em `docs/features/runtime-architecture-v1.md`.
- Verificações passaram: `npm run typecheck`, `npm run build`, `npm run check:supabase`.

## Arquivos canônicos

- `MAPA.md`
- `README.md`
- `.env.example`
- `docs/setup/supabase.md`
- `supabase/migrations/`
- `app/`
- `lib/`

## Cuidados

- Não expor `.env.local`.
- Não aplicar migrations destrutivas sem confirmação.
