# Pessoal Agent / Nimbo

POC do Nimbo: um campo pessoal com cinco agentes.

## Decisão de produto v1

- Um usuário tem **um Nimbo**.
- O Nimbo começa com **5 agentes no total**.
- O guia central é o primeiro agente.
- Os outros 4 agentes são especialistas emergentes moldados pelo contexto real do usuário.
- Memória, execução, conhecimento, clareza e criação são pilares internos de todo agente, não personagens principais.
- Expansão para mais agentes fica como evolução futura.

## Regra arquitetural

Nimbo não deve inventar um backend agentic do zero. OpenClaw e Hermes Agent são as referências-base para runtime, memória, sessões, skills/tools, permissões, observabilidade e orquestração.

Fluxo obrigatório antes de mexer no core:

1. localizar como OpenClaw e/ou Hermes resolvem o problema;
2. copiar/adaptar estrutura, semântica e regras que já funcionam;
3. personalizar só o necessário para Next.js + Supabase + experiência Nimbo;
4. documentar qualquer diferença relevante.

## Stack

- Next.js
- TypeScript
- Supabase

## Setup local

1. Instalar dependências:

```bash
npm install
```

2. Criar `.env.local` a partir de `.env.example`:

```bash
cp .env.example .env.local
```

3. Preencher as variáveis indicadas em `.env.example`.

4. Aplicar migrations no Supabase quando houver novas migrations:

```bash
set -a
. ./.env.local
set +a
SUPABASE_ACCESS_TOKEN="$SUPABASE_ACCESS_TOKEN" npx supabase db push --linked --yes
```

> Estado atual: projeto novo `bvubdcpegsithqoizyow` conectado, migrations `0001` e `0002` aplicadas, `npm run check:supabase` e `npm run build` passando. Não commitar `.env.local`.

5. Rodar localmente:

```bash
npm run dev
```

6. Ver diagnóstico:

```txt
/diagnostics/supabase
```

## Documentação funcional

Toda feature, rota, serviço ou tabela relevante criada no Nimbo deve ganhar material simples em `docs/features/` explicando função, fluxo, arquivos/tabelas envolvidos, status e forma de verificação.

Esse mapa funcional nasce junto com o desenvolvimento para manter claro tudo que o aplicativo já é capaz de fazer.

## Verificação

```bash
# carregar .env.local quando rodar fora do Next
set -a
. ./.env.local
set +a

npm run check:supabase
npm run typecheck
npm run build
```
