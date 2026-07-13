# Feature — Persistência do onboarding

## O que é

Persistência do pré-questionário inicial do Nimbo no Supabase.

Antes, o app só gerava uma prévia visual dos especialistas no client. Agora, ao completar as 10 perguntas, o usuário pode criar um “Meu Nimbo” real no banco.

## Para que serve

Serve para transformar o pré-questionário em estado persistente do produto:

- usuário beta;
- perfil inicial;
- Nimbo;
- guia central;
- especialistas despertados;
- pilares de cada agente;
- sinais e resumo percebido.

## Como funciona

1. Usuário responde as 10 perguntas.
2. A tela calcula sinais e especialistas via Motor de Despertar v0.
3. Usuário clica em “Criar Meu Nimbo”.
4. A rota `POST /api/onboarding/save` salva ou atualiza:
   - `app_users`;
   - `user_profiles`;
   - `nimbo_profiles`;
   - `nimbo_agents`;
   - `agent_pillars`.
5. O `appUserId` é guardado no `localStorage` para testes/dev sem login real.

## Arquivos/tabelas envolvidos

- UI: `app/page.tsx`
- Rota: `app/api/onboarding/save/route.ts`
- Motor: `lib/nimbo/onboarding.ts`
- Tabelas:
  - `app_users`
  - `user_profiles`
  - `nimbo_profiles`
  - `nimbo_agents`
  - `agent_pillars`

## O que já está pronto

- Rota server-side de persistência.
- Criação/reuso de usuário beta.
- Salvamento das respostas e sinais.
- Criação/atualização do Nimbo.
- Criação do guia central e dos 4 especialistas sugeridos.
- Criação dos pilares por agente.

## O que ainda falta

- Login real com Supabase Auth.
- RLS final com `auth.uid()`.
- Tela pós-onboarding “Meu Nimbo nasceu”.
- Validação/edição dos especialistas pelo usuário.

## Como verificar

1. Rodar o app:

```bash
npm run dev
```

2. Responder as 10 perguntas.
3. Clicar em “Criar Meu Nimbo”.
4. Verificar no Supabase se existem registros nas tabelas listadas acima.
