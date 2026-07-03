-- =====================================================================
-- App Despesas — schema inicial
-- Rode no SQL Editor do Supabase (ou via `psql` usando DIRECT_CONNECTION).
-- Depois: Settings → API → Exposed schemas → adicione "d20_despesas".
-- =====================================================================

create schema if not exists d20_despesas;

grant usage on schema d20_despesas to anon, authenticated;
alter default privileges in schema d20_despesas
  grant all on tables to anon, authenticated;

-- ---------------------------------------------------------------------
-- Categorias
-- ---------------------------------------------------------------------
create table if not exists d20_despesas.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  id_sort    integer,
  name       text not null,
  icon       text not null,
  color      text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists categories_user_idx on d20_despesas.categories (user_id);

-- ---------------------------------------------------------------------
-- Despesas
-- ---------------------------------------------------------------------
create table if not exists d20_despesas.expenses (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  recurrent_id     uuid,
  category_id      uuid not null references d20_despesas.categories (id) on delete restrict,
  count_part       integer not null default 1,
  description      text not null,
  date_transaction date not null,
  price            numeric(12, 2) not null check (price >= 0),
  status           text not null default 'NOTPAY' check (status in ('PAY', 'NOTPAY')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz
);

create index if not exists expenses_user_month_idx
  on d20_despesas.expenses (user_id, date_transaction);

-- ---------------------------------------------------------------------
-- Trigger: mantém updated_at ("última alteração")
-- ---------------------------------------------------------------------
create or replace function d20_despesas.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists categories_updated_at on d20_despesas.categories;
create trigger categories_updated_at
  before update on d20_despesas.categories
  for each row execute function d20_despesas.set_updated_at();

drop trigger if exists expenses_updated_at on d20_despesas.expenses;
create trigger expenses_updated_at
  before update on d20_despesas.expenses
  for each row execute function d20_despesas.set_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security: cada usuário só acessa os próprios dados
-- ---------------------------------------------------------------------
alter table d20_despesas.categories enable row level security;
alter table d20_despesas.expenses   enable row level security;

create policy "own categories"
  on d20_despesas.categories
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own expenses"
  on d20_despesas.expenses
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
