# CURRENT_TASK — Compras parceladas (parcelas fantasma até confirmação)

**Complexidade:** 🔴 Grande — tabelas novas (série + ocorrências), RLS, geração/confirmação/cancelamento de parcelas, e um novo tipo de item na lista de Despesas (card fantasma). Sem rebuild nativo.

---

## Objetivo

Ao criar uma despesa parcelada (ex.: TV em 12x), o app:
1. Cria a despesa **deste mês** normalmente (real, paga/em aberto como sempre).
2. Mostra um aviso: *"Você começa a pagar agora em junho e essa compra se repete até dezembro de 2026."*
3. Nos meses **futuros**, a parcela aparece na lista como **card fantasma** (pendente, visual diferenciado) — não é uma despesa de verdade ainda.
4. Ao chegar naquele mês, o usuário decide:
   - **✓ (check):** confirma — cria a despesa real daquele mês (mesma categoria/descrição/valor), status paga. O fantasma vira despesa de verdade.
   - **✗ (X):** abre um modal perguntando **"Cancelar só este mês"** ou **"Cancelar esta e todas as parcelas futuras"**.

---

## Decisão de arquitetura

### Substitui o "Repete no próximo mês?" atual
Hoje esse toggle só duplica a despesa para o mês seguinte, **de forma antecipada** (cria as 2 linhas na hora). Isso não serve mais pro caso de parcelamento (12x) nem para o fluxo de confirmação mês a mês. A caixa de seleção do form vira um **stepper de parcelas**: `1x` (padrão, sem repetição) até `Nx`. `1x` = comportamento atual sem repetição. `2x+` = cria a série nova.

> O campo antigo `expenses.recurrent_id` (duplicação simples) deixa de ser usado para novas despesas; despesas antigas com `recurrent_id` continuam funcionando como estão (não migradas, sem impacto).

### Tabelas novas
**`installment_series`** — a "compra parcelada" em si:
| campo | tipo |
|---|---|
| id | uuid pk |
| user_id | uuid → auth.users, cascade |
| category_id | uuid → categories |
| description | text |
| amount | numeric(12,2) — valor de cada parcela |
| total_installments | int (2..N) |
| start_month | date (1º dia do mês da 1ª parcela) |
| cancelled_from | int null — se preenchido, a série para de gerar fantasmas a partir dessa parcela (inclusive) |

**`installment_occurrences`** — uma linha por parcela (1..N):
| campo | tipo |
|---|---|
| id | uuid pk |
| series_id | uuid → installment_series, cascade |
| installment_number | int (1..N) |
| month | date (1º dia do mês daquela parcela) |
| status | text: `'confirmed' \| 'cancelled' \| 'pending'` (linha só existe pra confirmed/cancelled; pending é **calculado**, não gravado — ver abaixo) |
| expense_id | uuid null → expenses (preenchido quando confirmada) |

- Só gravamos ocorrência quando ela **sai do estado pendente** (confirmada ou cancelada). O estado "fantasma pendente" é **derivado**: existe se `month <= mês_atual`, `installment_number <= total_installments`, `(cancelled_from is null or installment_number < cancelled_from)`, e **não** há linha em `installment_occurrences` pra aquele `(series_id, installment_number)`.
- Isso evita gerar N linhas antecipadamente — simples e sem cron job.

### Integração na lista de Despesas
- `useGhostInstallments(range)` — para cada série ativa do usuário, calcula quais parcelas caem dentro do período visível e ainda não têm ocorrência gravada → gera itens fantasma (mesmo shape visual de `ExpenseItem`, mas com badge "Parcela 3/12 · pendente" e sem status pago/não pago).
- Fantasmas de **meses futuros** (além do atual) não aparecem soltos na lista — só quando o usuário navega até aquele mês (a lista já é por período, então isso é natural).
- Fantasma de mês **passado** que nunca foi confirmado nem cancelado: continua aparecendo (não desaparece sozinho) até o usuário decidir.

### Ações do fantasma
- **✓:** `useConfirmInstallment` — cria a `expense` real (status `PAY`) + grava `installment_occurrences` (status `confirmed`, `expense_id`).
- **✗:** abre modal com 2 opções:
  - "Cancelar só este mês" → grava ocorrência `cancelled` para esse número, série segue normalmente nas próximas.
  - "Cancelar esta e as futuras" → grava ocorrência `cancelled` para esse número **e** seta `cancelled_from = installment_number` na série (nenhum fantasma além dele é gerado).

### Form de despesa
- Troca o switch "Repete no próximo mês?" por um stepper **"Parcelar em quantas vezes?"** (1 a 36, por exemplo), visível só em despesas **novas** (edição de uma parcela confirmada continua sendo uma despesa normal).
- Quando `> 1x`, mostra o texto dinâmico: *"Você começa a pagar agora em {mês/ano da 1ª parcela} e essa compra se repete até {mês/ano da última parcela}."*
- Ao salvar com `Nx`: cria a `installment_series` + a primeira `installment_occurrence` (confirmed, expense_id = despesa recém-criada) + a despesa real do mês atual.

---

## Checklist

### Subtarefa 1 — Banco
- [ ] Migration `0003_installments.sql`: `installment_series`, `installment_occurrences`, RLS, índices
- [ ] Rodar via psql, tipos TS (`InstallmentSeriesRow`, `InstallmentOccurrenceRow`)

### Subtarefa 2 — Criação (form)
- [ ] Stepper de parcelas no form + texto dinâmico do período
- [ ] `useCreateInstallmentPurchase` — cria série + 1ª ocorrência + despesa do mês atual

### Subtarefa 3 — Fantasmas na lista (checkpoint ✅)
- [ ] `useGhostInstallments(range)` — deriva pendências a partir das séries ativas
- [ ] Componente de card fantasma (visual diferenciado, badge "Parcela X/N")
- [ ] Mesclar fantasmas com despesas reais no `SectionList` de Despesas (por dia/mês)

### Subtarefa 4 — Confirmar / cancelar
- [ ] `useConfirmInstallment` (cria despesa + ocorrência confirmed)
- [ ] Modal "cancelar só este mês / cancelar todas as futuras" + mutations correspondentes
- [ ] Invalidação de cache (expenses + séries) após qualquer ação

### Validação
- [ ] `tsc --noEmit` limpo
- [ ] Emulador: criar compra 3x, ver fantasma no mês seguinte, confirmar (vira despesa real), criar outra e cancelar (só o mês / todas as futuras)

---

## Arquivos que serão afetados/criados
- `app/supabase/migrations/0003_installments.sql` (criado)
- `app/src/types/database.ts` (modificado)
- `app/src/features/installments/api.ts` (criado — CRUD + derivação de fantasmas)
- `app/src/features/installments/GhostExpenseItem.tsx` (criado)
- `app/src/features/installments/CancelInstallmentSheet.tsx` (criado)
- `app/src/app/(app)/expense/[id].tsx` (modificado — stepper de parcelas)
- `app/src/app/(app)/(tabs)/index.tsx` (modificado — mescla fantasmas na lista)

## Variáveis de ambiente
- Nenhuma nova.

## Critério de aceite
1. Criar despesa com "3x" gera a despesa deste mês + texto "começa em {mês} e se repete até {mês final}".
2. No mês seguinte, a parcela aparece como card fantasma (não conta no total de despesas reais).
3. ✓ no fantasma cria a despesa real daquele mês com os mesmos dados.
4. ✗ no fantasma abre o modal com as 2 opções; "só este mês" mantém as próximas; "todas as futuras" encerra a série ali.
5. `tsc --noEmit` limpo; validado no emulador com uma série de teste.

## Link do Figma
- (nenhum informado)

---

## Decisões confirmadas (usuário)
1. O stepper de parcelas **substitui** o switch "Repete no próximo mês?" (despesas antigas com `recurrent_id` continuam como estão, sem migração).
2. Fantasmas **não entram** na soma do total gasto do mês — só despesas reais contam, até a confirmação.
