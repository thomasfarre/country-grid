create extension if not exists "pgcrypto";

create table if not exists public.match_history (
  id uuid primary key default gen_random_uuid(),
  room_id text not null,
  seed text not null,
  created_at timestamptz not null default now(),
  scores jsonb not null,
  constraint room_seed_unique unique (room_id, seed)
);

alter table public.match_history enable row level security;
