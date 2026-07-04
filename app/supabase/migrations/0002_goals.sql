-- =====================================================================
-- Metas por categoria (limite de gasto ou marca a bater)
-- Rode via psql (pooler) ou SQL Editor do Supabase.
-- =====================================================================

create table if not exists d20_despesas.goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references d20_despesas.categories (id) on delete cascade,
  kind        text not null check (kind in ('limit', 'target')),
  amount      numeric(12, 2) not null check (amount > 0),
  -- null = meta recorrente (vale todo mês); senão vale só no mês indicado (1º dia)
  month       date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);

create index if not exists goals_user_idx
  on d20_despesas.goals (user_id, category_id);

-- Evita metas duplicadas do mesmo tipo p/ mesma categoria/mês.
create unique index if not exists goals_unique_recurrent_idx
  on d20_despesas.goals (user_id, category_id, kind)
  where month is null;

create unique index if not exists goals_unique_month_idx
  on d20_despesas.goals (user_id, category_id, kind, month)
  where month is not null;

drop trigger if exists goals_updated_at on d20_despesas.goals;
create trigger goals_updated_at
  before update on d20_despesas.goals
  for each row execute function d20_despesas.set_updated_at();

alter table d20_despesas.goals enable row level security;

drop policy if exists "own goals" on d20_despesas.goals;
create policy "own goals"
  on d20_despesas.goals
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
