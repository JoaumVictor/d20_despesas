-- =====================================================================
-- Lembretes fixos (ex.: "Internet, R$90, todo dia 10") + estado mensal
-- Rode via psql (pooler) ou SQL Editor do Supabase.
-- =====================================================================

create table if not exists d20_despesas.reminders (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  category_id  uuid not null references d20_despesas.categories (id) on delete restrict,
  description  text not null,
  amount       numeric(12, 2) not null check (amount > 0),
  due_day      integer not null check (due_day between 1 and 31),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz
);

create index if not exists reminders_user_idx
  on d20_despesas.reminders (user_id);

drop trigger if exists reminders_updated_at on d20_despesas.reminders;
create trigger reminders_updated_at
  before update on d20_despesas.reminders
  for each row execute function d20_despesas.set_updated_at();

alter table d20_despesas.reminders enable row level security;

drop policy if exists "own reminders" on d20_despesas.reminders;
create policy "own reminders"
  on d20_despesas.reminders
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- Estado mensal: sem linha = pendente naquele mês (reseta sozinho, sem cron)
-- ---------------------------------------------------------------------
create table if not exists d20_despesas.reminder_completions (
  id           uuid primary key default gen_random_uuid(),
  reminder_id  uuid not null references d20_despesas.reminders (id) on delete cascade,
  month        date not null, -- 1º dia do mês
  resolution   text not null check (resolution in ('expense', 'done_only')),
  expense_id   uuid references d20_despesas.expenses (id) on delete set null,
  created_at   timestamptz not null default now(),
  unique (reminder_id, month)
);

create index if not exists reminder_completions_reminder_idx
  on d20_despesas.reminder_completions (reminder_id);

alter table d20_despesas.reminder_completions enable row level security;

drop policy if exists "own reminder completions" on d20_despesas.reminder_completions;
create policy "own reminder completions"
  on d20_despesas.reminder_completions
  for all
  using (
    exists (
      select 1 from d20_despesas.reminders r
      where r.id = reminder_completions.reminder_id and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from d20_despesas.reminders r
      where r.id = reminder_completions.reminder_id and r.user_id = auth.uid()
    )
  );
