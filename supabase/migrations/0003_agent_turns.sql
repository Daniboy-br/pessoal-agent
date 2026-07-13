-- Nimbo agent turns
-- Alinha o runtime do Nimbo ao padrão Hermes/OpenClaw: cada turno é auditável,
-- rastreável e separado de mensagens individuais.

begin;

create table if not exists public.agent_turns (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  app_user_id uuid not null references public.app_users(id) on delete cascade,
  nimbo_profile_id uuid references public.nimbo_profiles(id) on delete cascade,
  agent_id uuid references public.nimbo_agents(id) on delete set null,
  input_message_id uuid references public.messages(id) on delete set null,
  output_message_id uuid references public.messages(id) on delete set null,
  status text not null default 'started' check (status in ('started', 'running', 'completed', 'error', 'cancelled')),
  provider text,
  model text,
  prompt_version text not null default 'nimbo-guide-v0',
  input_tokens integer,
  output_tokens integer,
  estimated_cost_usd numeric,
  latency_ms integer,
  api_call_count integer not null default 0,
  exit_reason text,
  error_message text,
  interrupted boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agent_turns_token_nonnegative_chk check (
    (input_tokens is null or input_tokens >= 0) and
    (output_tokens is null or output_tokens >= 0) and
    (latency_ms is null or latency_ms >= 0) and
    api_call_count >= 0
  )
);

create index if not exists idx_agent_turns_conversation_started on public.agent_turns(conversation_id, started_at desc);
create index if not exists idx_agent_turns_user_started on public.agent_turns(app_user_id, started_at desc);
create index if not exists idx_agent_turns_agent_started on public.agent_turns(agent_id, started_at desc);
create index if not exists idx_agent_turns_status on public.agent_turns(status, started_at desc);

create trigger trg_agent_turns_updated_at
before update on public.agent_turns
for each row execute function public.set_updated_at();

alter table public.agent_turns enable row level security;

grant select, insert, update, delete on public.agent_turns to service_role;

commit;
