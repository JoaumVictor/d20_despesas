-- =====================================================================
-- Códigos de convite: obrigatórios pra criar conta com Google.
-- A tabela em si NÃO tem nenhuma policy de SELECT/INSERT direta — só é
-- acessível através das duas funções abaixo (security definer), então
-- ninguém consegue listar os códigos existentes pela API.
-- Rode via psql (pooler) ou SQL Editor do Supabase.
-- =====================================================================

create table if not exists d20_despesas.invite_codes (
  code       text primary key,
  used_by    uuid references auth.users (id) on delete set null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);

alter table d20_despesas.invite_codes enable row level security;
-- (propositalmente sem nenhuma policy — RLS habilitada + zero policies = zero acesso direto)

-- Verifica se o código existe e ainda não foi usado. Não revela nada sobre
-- outros códigos (só true/false) — pode ser chamada por qualquer um, mesmo
-- deslogado, já que é isso que libera o botão de login.
create or replace function d20_despesas.check_invite_code(p_code text)
returns boolean
language sql
security definer
set search_path = d20_despesas, public
as $$
  select exists (
    select 1 from d20_despesas.invite_codes
    where code = lower(trim(p_code)) and used_by is null
  );
$$;

-- Marca o código como usado pelo usuário autenticado — atômico (UPDATE com
-- WHERE used_by is null), então em caso de corrida só uma conta consegue.
create or replace function d20_despesas.redeem_invite_code(p_code text)
returns boolean
language plpgsql
security definer
set search_path = d20_despesas, public
as $$
declare
  v_rows integer;
begin
  update d20_despesas.invite_codes
  set used_by = auth.uid(), used_at = now()
  where code = lower(trim(p_code)) and used_by is null;
  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

revoke all on d20_despesas.invite_codes from anon, authenticated;
grant execute on function d20_despesas.check_invite_code(text) to anon, authenticated;
grant execute on function d20_despesas.redeem_invite_code(text) to authenticated;
