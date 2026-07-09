# Setup Supabase — Nimbo

## Projeto remoto

Projeto Supabase novo usado pelo Nimbo:

- URL: `https://bvubdcpegsithqoizyow.supabase.co`
- Project ref: `bvubdcpegsithqoizyow`

## Estado atual

- `.env.local` existe localmente com permissão `0600` e é ignorado pelo Git.
- Credenciais vieram por 1Password share e não devem ser copiadas para docs, memória ou chat.
- O Supabase Access Token validou o projeto pela Management API.
- As legacy keys `anon` e `service_role` foram recuperadas pela Management API porque a nova `secret key` isolada não bastou para acessar as tabelas via PostgREST com RLS/permissões iniciais.
- Migrations aplicadas no Supabase novo:
  - `0001_nimbo_core.sql`
  - `0002_nimbo_service_role_grants.sql`
- Verificação passou: `npm run check:supabase` retornou `schemaReady=true`.
- Build passou: `npm run build`.

## Variáveis locais

Ver `.env.example`. Em resumo:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_ACCESS_TOKEN`

Nunca commitar `.env.local`.

## Aplicar novas migrations

Com `.env.local` preenchido:

```bash
set -a
. ./.env.local
set +a
SUPABASE_ACCESS_TOKEN="$SUPABASE_ACCESS_TOKEN" npx supabase db push --linked --yes
```

Antes de aplicar migration destrutiva, pedir confirmação explícita.

## Schema atual

`0001_nimbo_core.sql` cria:

- `app_users`, `beta_invites`, `user_profiles`;
- `nimbo_profiles`, `nimbo_agents`, `agent_pillars`;
- `conversations`, `messages`;
- `memories`, `execution_items`, `knowledge_items`, `clarity_notes`, `creation_artifacts`;
- `llm_calls`, `audit_events`, `prompt_versions`;
- RLS habilitado por padrão.

`0002_nimbo_service_role_grants.sql` concede permissões ao role `service_role` para uso server-side mantendo RLS habilitado.

## Próxima ação recomendada

Construir a primeira experiência navegável:

1. onboarding inicial;
2. criação/seleção do perfil;
3. tela “Meu Nimbo” com guia central + quatro especialistas emergentes;
4. conversa inicial com memória percebida.
