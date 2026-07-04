-- =====================================================================
-- Compras parceladas: série + ocorrências (parcelas fantasma até confirmação)
-- Rode via psql (pooler) ou SQL Editor do Supabase.
-- =====================================================================

create table if not exists d20_despesas.installment_series (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  category_id         uuid not null references d20_despesas.categories (id) on delete restrict,
  description         text not null,
  amount              numeric(12, 2) not null check (amount > 0),
  total_installments  integer not null check (total_installments >= 2),
  start_month         date not null, -- 1º dia do mês da 1ª parcela
  -- se preenchido, nenhum fantasma >= esse número é gerado (série encerrada)
  cancelled_from      integer,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz
);

create index if not exists installment_series_user_idx
  on d20_despesas.installment_series (user_id);

drop trigger if exists installment_series_updated_at on d20_despesas.installment_series;
create trigger installment_series_updated_at
  before update on d20_despesas.installment_series
  for each row execute function d20_despesas.set_updated_at();

alter table d20_despesas.installment_series enable row level security;

drop policy if exists "own installment series" on d20_despesas.installment_series;
create policy "own installment series"
  on d20_despesas.installment_series
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------

create table if not exists d20_despesas.installment_occurrences (
  id                  uuid primary key default gen_random_uuid(),
  series_id           uuid not null references d20_despesas.installment_series (id) on delete cascade,
  installment_number  integer not null,
  month               date not null, -- 1º dia do mês daquela parcela
  status              text not null check (status in ('confirmed', 'cancelled')),
  expense_id          uuid references d20_despesas.expenses (id) on delete set null,
  created_at          timestamptz not null default now(),
  unique (series_id, installment_number)
);

create index if not exists installment_occurrences_series_idx
  on d20_despesas.installment_occurrences (series_id);

alter table d20_despesas.installment_occurrences enable row level security;

-- RLS via join na série (occurrences não têm user_id próprio)
drop policy if exists "own installment occurrences" on d20_despesas.installment_occurrences;
create policy "own installment occurrences"
  on d20_despesas.installment_occurrences
  for all
  using (
    exists (
      select 1 from d20_despesas.installment_series s
      where s.id = installment_occurrences.series_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from d20_despesas.installment_series s
      where s.id = installment_occurrences.series_id and s.user_id = auth.uid()
    )
  );
