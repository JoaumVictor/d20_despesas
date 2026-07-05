-- =====================================================================
-- Ajusta o fluxo de convite: agora o código só é pedido DEPOIS de escolher
-- a conta Google, e só se essa conta nunca tiver resgatado um código antes
-- (login de conta já existente passa direto).
-- Rode via psql (pooler) ou SQL Editor do Supabase.
-- =====================================================================

-- Desativa o código de teste
delete from d20_despesas.invite_codes where code = 'baianor';

-- Novos códigos de convite
insert into d20_despesas.invite_codes (code) values
  ('baianor_123asdff'),
  ('joaozinhoreidelas'),
  ('vitimthediver'),
  ('braboedudasilva'),
  ('darkoctopus000')
on conflict (code) do nothing;

-- Diz se o usuário autenticado atual já resgatou algum código de convite
-- (retorna false pra quem nunca resgatou nenhum — inclusive contas novas).
create or replace function d20_despesas.has_redeemed_invite()
returns boolean
language sql
security definer
set search_path = d20_despesas, public
as $$
  select exists (
    select 1 from d20_despesas.invite_codes where used_by = auth.uid()
  );
$$;

grant execute on function d20_despesas.has_redeemed_invite() to authenticated;

-- "Perdoa" quem já usava o app antes de existir esse sistema de convites —
-- sem isso, a primeira conta real ficaria travada pedindo um código que
-- nunca precisou existir.
insert into d20_despesas.invite_codes (code, used_by, used_at)
select 'grandfathered-bescoito', id, now()
from auth.users
where email = 'bescoito08@gmail.com'
on conflict (code) do nothing;
