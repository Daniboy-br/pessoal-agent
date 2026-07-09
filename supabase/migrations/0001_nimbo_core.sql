-- Nimbo core schema v1
-- Projeto: pessoal-agent / Nimbo
-- Decisão-base: um Nimbo com 5 agentes; guia central = agente 1; 4 especialistas emergentes.

begin;

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Helpers
-- ------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ------------------------------------------------------------
-- Usuários beta e perfil
-- ------------------------------------------------------------

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  email text unique,
  display_name text,
  beta_status text not null default 'invited' check (beta_status in ('invited', 'onboarded', 'active', 'paused', 'deleted')),
  locale text not null default 'pt-BR',
  timezone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger trg_app_users_updated_at
before update on public.app_users
for each row execute function public.set_updated_at();

create table if not exists public.beta_invites (
  id uuid primary key default gen_random_uuid(),
  invite_code text unique not null,
  invited_name text,
  invited_contact text,
  status text not null default 'unused' check (status in ('unused', 'used', 'revoked')),
  app_user_id uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  used_at timestamptz
);

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid not null unique references public.app_users(id) on delete cascade,
  nickname text,
  tone_preference text,
  onboarding_answers jsonb not null default '{}'::jsonb,
  preferences jsonb not null default '{}'::jsonb,
  current_context jsonb not null default '{}'::jsonb,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_user_profiles_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Nimbo e agentes
-- ------------------------------------------------------------

create table if not exists public.nimbo_profiles (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid not null unique references public.app_users(id) on delete cascade,
  name text not null default 'Nimbo',
  status text not null default 'forming' check (status in ('forming', 'active', 'complete', 'paused', 'archived')),
  agent_limit integer not null default 5 check (agent_limit >= 1),
  completed_at timestamptz,
  expansion_enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_nimbo_profiles_updated_at
before update on public.nimbo_profiles
for each row execute function public.set_updated_at();

create table if not exists public.nimbo_agents (
  id uuid primary key default gen_random_uuid(),
  nimbo_profile_id uuid not null references public.nimbo_profiles(id) on delete cascade,
  app_user_id uuid not null references public.app_users(id) on delete cascade,
  slot integer not null check (slot >= 1),
  agent_kind text not null check (agent_kind in ('guide', 'specialist')),
  name text not null,
  codename text,
  description text,
  emergence_reason text,
  territory text,
  status text not null default 'draft' check (status in ('draft', 'suggested', 'active', 'paused', 'archived')),
  tone_profile jsonb not null default '{}'::jsonb,
  prompt_version text not null default 'nimbo-agent-v0',
  metadata jsonb not null default '{}'::jsonb,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(nimbo_profile_id, slot),
  constraint nimbo_agents_slot_limit_chk check (slot <= 5 or agent_kind = 'specialist'),
  constraint nimbo_agents_guide_slot_chk check ((agent_kind = 'guide' and slot = 1) or agent_kind = 'specialist')
);

create index if not exists idx_nimbo_agents_user_status on public.nimbo_agents(app_user_id, status);
create index if not exists idx_nimbo_agents_nimbo_slot on public.nimbo_agents(nimbo_profile_id, slot);

create trigger trg_nimbo_agents_updated_at
before update on public.nimbo_agents
for each row execute function public.set_updated_at();

-- Pilares internos de funcionamento. Não são personagens, são capacidades de cada agente.
create table if not exists public.agent_pillars (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.nimbo_agents(id) on delete cascade,
  pillar_key text not null check (pillar_key in ('memory', 'execution', 'knowledge', 'clarity', 'creation')),
  emphasis text not null default 'standard' check (emphasis in ('low', 'standard', 'high', 'signature')),
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(agent_id, pillar_key)
);

create trigger trg_agent_pillars_updated_at
before update on public.agent_pillars
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Conversas e mensagens
-- ------------------------------------------------------------

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid not null references public.app_users(id) on delete cascade,
  nimbo_profile_id uuid not null references public.nimbo_profiles(id) on delete cascade,
  agent_id uuid references public.nimbo_agents(id) on delete set null,
  title text,
  mode text not null default 'free' check (mode in ('free', 'decision', 'writing', 'organize', 'planning', 'reflection')),
  status text not null default 'open' check (status in ('open', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  last_message_at timestamptz
);

create index if not exists idx_conversations_user_last on public.conversations(app_user_id, last_message_at desc nulls last);
create index if not exists idx_conversations_agent on public.conversations(agent_id, last_message_at desc nulls last);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  app_user_id uuid references public.app_users(id) on delete set null,
  agent_id uuid references public.nimbo_agents(id) on delete set null,
  role text not null check (role in ('user', 'assistant', 'system', 'tool')),
  content text not null,
  content_type text not null default 'text',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_conversation_created on public.messages(conversation_id, created_at);

-- ------------------------------------------------------------
-- Pilares em dados: memória, execução, conhecimento, clareza e criação
-- ------------------------------------------------------------

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid not null references public.app_users(id) on delete cascade,
  agent_id uuid references public.nimbo_agents(id) on delete cascade,
  scope text not null default 'nimbo' check (scope in ('nimbo', 'agent', 'shared')),
  memory_type text not null default 'note' check (memory_type in ('preference', 'person', 'goal', 'constraint', 'decision', 'pattern', 'recurring_theme', 'note')),
  content text not null,
  normalized_content jsonb not null default '{}'::jsonb,
  confidence numeric not null default 0.7 check (confidence >= 0 and confidence <= 1),
  sensitivity text not null default 'normal' check (sensitivity in ('low', 'normal', 'sensitive')),
  status text not null default 'candidate' check (status in ('candidate', 'active', 'rejected', 'archived')),
  source_message_id uuid references public.messages(id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  archived_at timestamptz
);

create index if not exists idx_memories_user_status on public.memories(app_user_id, status, created_at desc);
create index if not exists idx_memories_agent_status on public.memories(agent_id, status, created_at desc);

create table if not exists public.execution_items (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid not null references public.app_users(id) on delete cascade,
  agent_id uuid references public.nimbo_agents(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'done', 'blocked', 'cancelled')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  due_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_execution_items_user_status on public.execution_items(app_user_id, status, created_at desc);
create trigger trg_execution_items_updated_at before update on public.execution_items for each row execute function public.set_updated_at();

create table if not exists public.knowledge_items (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid not null references public.app_users(id) on delete cascade,
  agent_id uuid references public.nimbo_agents(id) on delete set null,
  title text not null,
  source_url text,
  content text,
  summary text,
  tags text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_knowledge_items_user_created on public.knowledge_items(app_user_id, created_at desc);
create trigger trg_knowledge_items_updated_at before update on public.knowledge_items for each row execute function public.set_updated_at();

create table if not exists public.clarity_notes (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid not null references public.app_users(id) on delete cascade,
  agent_id uuid references public.nimbo_agents(id) on delete set null,
  note_type text not null default 'insight' check (note_type in ('insight', 'decision', 'definition', 'tradeoff', 'principle', 'question')),
  title text,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_clarity_notes_user_created on public.clarity_notes(app_user_id, created_at desc);
create trigger trg_clarity_notes_updated_at before update on public.clarity_notes for each row execute function public.set_updated_at();

create table if not exists public.creation_artifacts (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid not null references public.app_users(id) on delete cascade,
  agent_id uuid references public.nimbo_agents(id) on delete set null,
  artifact_type text not null default 'draft' check (artifact_type in ('idea', 'draft', 'version', 'prompt', 'concept', 'experiment')),
  title text,
  content text not null,
  status text not null default 'draft' check (status in ('draft', 'selected', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_creation_artifacts_user_created on public.creation_artifacts(app_user_id, created_at desc);
create trigger trg_creation_artifacts_updated_at before update on public.creation_artifacts for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Observabilidade e segurança
-- ------------------------------------------------------------

create table if not exists public.llm_calls (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid references public.app_users(id) on delete set null,
  agent_id uuid references public.nimbo_agents(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  provider text,
  model text,
  prompt_version text,
  input_tokens integer,
  output_tokens integer,
  total_cost_usd numeric,
  status text not null default 'success' check (status in ('success', 'error', 'cancelled')),
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_llm_calls_user_created on public.llm_calls(app_user_id, created_at desc);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid references public.app_users(id) on delete set null,
  event_type text not null,
  actor_type text not null default 'system' check (actor_type in ('system', 'user', 'admin', 'agent')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_events_user_created on public.audit_events(app_user_id, created_at desc);

-- ------------------------------------------------------------
-- Seeds mínimos de prompt/versionamento
-- ------------------------------------------------------------

create table if not exists public.prompt_versions (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  version text not null,
  title text not null,
  body text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(key, version)
);

insert into public.prompt_versions (key, version, title, body, status)
values
  ('nimbo-guide', 'v0', 'Guia central do Nimbo', 'Você é o guia central do Nimbo: entende o contexto geral do usuário, preserva a visão do todo e coordena quando especialistas devem entrar em cena.', 'active'),
  ('nimbo-specialist', 'v0', 'Especialista emergente do Nimbo', 'Você é um especialista emergente do Nimbo. Use memória, execução, conhecimento, clareza e criação para atuar no contexto específico do usuário.', 'active')
on conflict (key, version) do nothing;

-- ------------------------------------------------------------
-- RLS inicial: bloqueia acesso anônimo por padrão; servidor usa service role.
-- Política de usuário final será refinada quando auth beta entrar.
-- ------------------------------------------------------------

alter table public.app_users enable row level security;
alter table public.beta_invites enable row level security;
alter table public.user_profiles enable row level security;
alter table public.nimbo_profiles enable row level security;
alter table public.nimbo_agents enable row level security;
alter table public.agent_pillars enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.memories enable row level security;
alter table public.execution_items enable row level security;
alter table public.knowledge_items enable row level security;
alter table public.clarity_notes enable row level security;
alter table public.creation_artifacts enable row level security;
alter table public.llm_calls enable row level security;
alter table public.audit_events enable row level security;
alter table public.prompt_versions enable row level security;

commit;
