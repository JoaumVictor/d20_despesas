-- =====================================================================
-- Contas de administrador + gestão de códigos de convite via RPC.
-- Mesma filosofia dos invite_codes: a tabela `admins` não tem NENHUMA
-- policy de acesso direto — só é lida através de `is_admin()`, e todas as
-- funções admin_* checam `is_admin()` internamente antes de fazer qualquer
-- coisa (então mesmo que alguém chame a RPC na unha, sem ser admin recebe
-- erro).
-- Rode via psql (pooler) ou SQL Editor do Supabase.
-- =====================================================================

create table if not exists d20_despesas.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table d20_despesas.admins enable row level security;
-- (sem policies — RLS habilitada + zero policies = zero acesso direto)

create or replace function d20_despesas.is_admin()
returns boolean
language sql
security definer
set search_path = d20_despesas, public
as $$
  select exists (select 1 from d20_despesas.admins where user_id = auth.uid());
$$;

grant execute on function d20_despesas.is_admin() to authenticated;

-- Primeiro admin
insert into d20_despesas.admins (user_id)
select id from auth.users where email = 'bescoito08@gmail.com'
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------
-- Gestão de códigos de convite (só admin)
-- ---------------------------------------------------------------------

create or replace function d20_despesas.admin_list_invite_codes(p_limit integer default 20, p_offset integer default 0)
returns table (
  code text,
  used_by uuid,
  used_by_email text,
  used_at timestamptz,
  created_at timestamptz,
  total_count bigint
)
language plpgsql
security definer
set search_path = d20_despesas, public
as $$
begin
  if not d20_despesas.is_admin() then
    raise exception 'not authorized';
  end if;
  return query
    select ic.code, ic.used_by, u.email::text, ic.used_at, ic.created_at,
           count(*) over () as total_count
    from d20_despesas.invite_codes ic
    left join auth.users u on u.id = ic.used_by
    order by ic.created_at desc
    limit p_limit offset p_offset;
end;
$$;

grant execute on function d20_despesas.admin_list_invite_codes(integer, integer) to authenticated;

create or replace function d20_despesas.admin_create_invite_code(p_code text)
returns void
language plpgsql
security definer
set search_path = d20_despesas, public
as $$
begin
  if not d20_despesas.is_admin() then
    raise exception 'not authorized';
  end if;
  insert into d20_despesas.invite_codes (code) values (lower(trim(p_code)));
end;
$$;

grant execute on function d20_despesas.admin_create_invite_code(text) to authenticated;

create or replace function d20_despesas.admin_delete_invite_code(p_code text)
returns void
language plpgsql
security definer
set search_path = d20_despesas, public
as $$
begin
  if not d20_despesas.is_admin() then
    raise exception 'not authorized';
  end if;
  delete from d20_despesas.invite_codes where code = lower(trim(p_code));
end;
$$;

grant execute on function d20_despesas.admin_delete_invite_code(text) to authenticated;

-- Renomeia e/ou libera de novo (reset) um código existente.
create or replace function d20_despesas.admin_update_invite_code(
  p_old_code text,
  p_new_code text,
  p_reset boolean default false
)
returns boolean
language plpgsql
security definer
set search_path = d20_despesas, public
as $$
declare
  v_rows integer;
begin
  if not d20_despesas.is_admin() then
    raise exception 'not authorized';
  end if;
  update d20_despesas.invite_codes
  set code = lower(trim(p_new_code)),
      used_by = case when p_reset then null else used_by end,
      used_at = case when p_reset then null else used_at end
  where code = lower(trim(p_old_code));
  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

grant execute on function d20_despesas.admin_update_invite_code(text, text, boolean) to authenticated;
