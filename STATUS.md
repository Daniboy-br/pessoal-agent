# STATUS — pessoal-agent / Nimbo app

Atualizado em: 2026-07-09

## Estado atual

- App local Next.js/TypeScript/Supabase criado para o Nimbo.
- Projeto Supabase novo conectado: `https://bvubdcpegsithqoizyow.supabase.co`.
- Credenciais locais ficam em `.env.local` com permissão restrita e ignoradas pelo Git.
- Migrations `0001_nimbo_core.sql` e `0002_nimbo_service_role_grants.sql` foram aplicadas no Supabase novo.
- Verificações registradas: `npm run check:supabase` passou com `schemaReady=true`; `npm run build` passou.

## Próximo passo recomendado

- Evoluir a v0 navegável para persistir respostas/perfil no Supabase e transformar a prévia do Motor de Despertar em fluxo real de criação do “Meu Nimbo”.

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
