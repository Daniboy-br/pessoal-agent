# MAPA — pessoal-agent

App local do Nimbo/Pessoal-Agent.

## Objetivo

Construir o MVP do Nimbo como agente pessoal com guia central, memória percebida e especialistas emergentes.

## Regra arquitetural

- Não criar backend agentic do zero quando OpenClaw ou Hermes Agent já tiverem padrão funcional para o mesmo problema.
- Referências locais canônicas:
  - `referencias/plataformas-agenticas/openclaw/`
  - `referencias/plataformas-agenticas/hermes-agent/`
- Antes de evoluir runtime, memória, sessões, skills/tools, permissões, observabilidade ou orquestração, consultar e copiar/adaptar os padrões dessas bases.
- Personalizações do Nimbo devem ser pequenas e justificadas, partindo do que já funciona nas referências.

## Arquivos importantes

- `STATUS.md` — resumo executivo curto para retomada rápida do app.
- `README.md` — instruções técnicas do projeto.
- `.env.example` — exemplo de variáveis, sem segredos.
- `.env.local` — credenciais locais ignoradas pelo Git; não expor.
- `supabase/migrations/` — migrations do schema Nimbo.
- `app/` e `lib/` — app Next.js/TypeScript.

## Relação com o cérebro

- Estratégia, decisões e PRDs ficam em `brains/daniel-pessoal-cerebro/memory/projects/agente-pessoal-hype-personas/`.
- Este diretório é o app executável/local.

## Cuidados

- Não versionar segredos.
- Não confundir Nimbo com “Nimble”.
- Mudanças destrutivas em Supabase exigem confirmação explícita.
