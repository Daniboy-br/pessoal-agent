# STATUS — pessoal-agent / Nimbo app

Atualizado em: 2026-07-09

## Estado atual

- App local Next.js/TypeScript/Supabase criado para o Nimbo.
- Projeto Supabase novo conectado: `https://bvubdcpegsithqoizyow.supabase.co`.
- Credenciais locais ficam em `.env.local` com permissão restrita e ignoradas pelo Git.
- Migrations `0001_nimbo_core.sql` e `0002_nimbo_service_role_grants.sql` foram aplicadas no Supabase novo.
- Verificações registradas: `npm run check:supabase` passou com `schemaReady=true`; `npm run build` passou.

## Próximo passo recomendado

- Implementar a primeira experiência navegável: onboarding → criação/seleção do perfil → tela “Meu Nimbo” com guia central + quatro especialistas emergentes → conversa inicial com memória percebida.

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
