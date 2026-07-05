import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthContext';
import type { DateRange } from '@/features/period/period';
import { getLocalDb, LOCAL_USER_ID, newId, nowISO } from '@/lib/localDb';
import { supabase } from '@/lib/supabase';
import type { InstallmentSeriesRow } from '@/types/database';
import { firstOfMonthISO } from '@/features/period/period';
import { parseISODate, toISODate } from '@/utils/format';

export interface SeriesWithCategory extends InstallmentSeriesRow {
  category: { id: string; name: string; icon: string; color: string } | null;
}

export interface GhostInstallment {
  seriesId: string;
  installmentNumber: number;
  month: string; // YYYY-MM-01
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  description: string;
  amount: number;
  totalInstallments: number;
}

const seriesKey = ['installment-series'] as const;

async function fetchActiveSeriesLocal(): Promise<SeriesWithCategory[]> {
  const db = await getLocalDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT s.*, c.id as cat_id, c.name as cat_name, c.icon as cat_icon, c.color as cat_color ' +
      'FROM installment_series s LEFT JOIN categories c ON c.id = s.category_id ' +
      'ORDER BY s.created_at DESC',
  );
  return rows.map((row) => ({
    id: row.id as string,
    user_id: row.user_id as string,
    category_id: row.category_id as string,
    description: row.description as string,
    amount: row.amount as number,
    total_installments: row.total_installments as number,
    start_month: row.start_month as string,
    cancelled_from: row.cancelled_from as number | null,
    created_at: row.created_at as string,
    updated_at: (row.updated_at as string | null) ?? null,
    category: row.cat_id
      ? {
          id: row.cat_id as string,
          name: row.cat_name as string,
          icon: row.cat_icon as string,
          color: row.cat_color as string,
        }
      : null,
  }));
}

async function fetchActiveSeries(isLocal: boolean): Promise<SeriesWithCategory[]> {
  if (isLocal) return fetchActiveSeriesLocal();
  const { data, error } = await supabase
    .from('installment_series')
    .select('*, category:categories(id, name, icon, color)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as SeriesWithCategory[];
}

/**
 * Ocorrências (confirmadas/canceladas) de todas as séries do usuário.
 * Devolve array (não Set) — o cache do React Query é persistido em JSON no
 * AsyncStorage, e um Set vira `{}` (sem `.has()`) depois desse round-trip.
 */
async function fetchOccurrencesLocal(): Promise<string[]> {
  const db = await getLocalDb();
  const rows = await db.getAllAsync<{ series_id: string; installment_number: number }>(
    'SELECT series_id, installment_number FROM installment_occurrences',
  );
  return rows.map((o) => `${o.series_id}:${o.installment_number}`);
}

async function fetchOccurrences(isLocal: boolean): Promise<string[]> {
  if (isLocal) return fetchOccurrencesLocal();
  const { data, error } = await supabase
    .from('installment_occurrences')
    .select('series_id, installment_number');
  if (error) throw error;
  return (data ?? []).map((o) => `${o.series_id}:${o.installment_number}`);
}

export function useInstallmentSeries() {
  const { isLocal } = useAuth();
  return useQuery({ queryKey: seriesKey, queryFn: () => fetchActiveSeries(isLocal) });
}

function useDecidedOccurrences() {
  const { isLocal } = useAuth();
  return useQuery({
    queryKey: ['installment-occurrences'],
    queryFn: () => fetchOccurrences(isLocal),
  });
}

function addMonths(iso: string, delta: number): string {
  const [y, m] = iso.split('-').map(Number);
  return firstOfMonthISO(new Date(y, m - 1 + delta, 1));
}

/** Último dia (YYYY-MM-DD) do mês de um "YYYY-MM-01". */
function monthEnd(monthIso: string): string {
  const [y, m] = monthIso.split('-').map(Number);
  return toISODate(new Date(y, m, 0));
}

/**
 * Data de lançamento ao confirmar uma parcela: usa o dia-do-mês de hoje, mas
 * sempre dentro do **mês da própria parcela** (nunca o mês em que o usuário
 * confirmou) — evita a parcela cair no mês errado quando confirmada atrasada.
 */
function dateWithinMonth(monthIso: string): string {
  const now = new Date();
  const [y, m] = monthIso.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const day = Math.min(now.getDate(), lastDay);
  return toISODate(new Date(y, m - 1, day));
}

/**
 * Deriva os fantasmas (parcelas pendentes) que caem dentro do range visível,
 * a partir das séries ativas do usuário. Não grava nada — é só leitura/cálculo.
 */
export function useGhostInstallments(range: DateRange | null): GhostInstallment[] {
  const { data: series } = useInstallmentSeries();
  const { data: decidedList } = useDecidedOccurrences();

  return useMemo(() => {
    if (!series || !decidedList || !range) return [];
    const decided = new Set(Array.isArray(decidedList) ? decidedList : []);
    const ghosts: GhostInstallment[] = [];

    for (const s of series) {
      for (let n = 1; n <= s.total_installments; n++) {
        if (s.cancelled_from != null && n >= s.cancelled_from) break;
        if (decided.has(`${s.id}:${n}`)) continue; // já confirmada ou cancelada

        const month = addMonths(s.start_month, n - 1);
        // mostra o fantasma se o mês da parcela tiver qualquer sobreposição com o range visível
        if (monthEnd(month) < range.start || month > range.end) continue;

        ghosts.push({
          seriesId: s.id,
          installmentNumber: n,
          month,
          categoryId: s.category_id,
          categoryName: s.category?.name ?? 'Sem categoria',
          categoryIcon: s.category?.icon ?? '',
          categoryColor: s.category?.color ?? '#9ca3af',
          description: s.description,
          amount: s.amount,
          totalInstallments: s.total_installments,
        });
      }
    }
    return ghosts;
  }, [series, decidedList, range]);
}

function useInvalidateInstallments() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: seriesKey });
    qc.invalidateQueries({ queryKey: ['installment-occurrences'] });
    qc.invalidateQueries({ queryKey: ['expenses'] });
    qc.invalidateQueries({ queryKey: ['category-usage'] });
  };
}

export interface CreateInstallmentInput {
  categoryId: string;
  description: string;
  amount: number; // valor de cada parcela
  totalInstallments: number;
  startDate: string; // data da 1ª parcela (YYYY-MM-DD)
}

/** Cria a série + a despesa real do 1º mês + a 1ª ocorrência (confirmed). */
export function useCreateInstallmentPurchase(userId: string) {
  const invalidate = useInvalidateInstallments();
  return useMutation({
    mutationFn: async (input: CreateInstallmentInput) => {
      const startMonth = firstOfMonthISO(parseISODate(input.startDate));

      if (userId === LOCAL_USER_ID) {
        const db = await getLocalDb();
        const seriesId = newId();
        const expenseId = newId();
        const now = nowISO();
        await db.runAsync(
          'INSERT INTO installment_series (id, user_id, category_id, description, amount, total_installments, start_month, cancelled_from, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, NULL)',
          [seriesId, userId, input.categoryId, input.description, input.amount, input.totalInstallments, startMonth, now],
        );
        await db.runAsync(
          'INSERT INTO expenses (id, user_id, recurrent_id, category_id, count_part, description, date_transaction, price, status, created_at, updated_at) VALUES (?, ?, NULL, ?, 1, ?, ?, ?, ?, ?, NULL)',
          [expenseId, userId, input.categoryId, input.description, input.startDate, input.amount, 'PAY', now],
        );
        await db.runAsync(
          'INSERT INTO installment_occurrences (id, series_id, installment_number, month, status, expense_id, created_at) VALUES (?, ?, 1, ?, ?, ?, ?)',
          [newId(), seriesId, startMonth, 'confirmed', expenseId, now],
        );
        return;
      }

      const { data: series, error: seriesErr } = await supabase
        .from('installment_series')
        .insert({
          user_id: userId,
          category_id: input.categoryId,
          description: input.description,
          amount: input.amount,
          total_installments: input.totalInstallments,
          start_month: startMonth,
        })
        .select('*')
        .single();
      if (seriesErr) throw seriesErr;

      const { data: expense, error: expenseErr } = await supabase
        .from('expenses')
        .insert({
          user_id: userId,
          category_id: input.categoryId,
          description: input.description,
          price: input.amount,
          date_transaction: input.startDate,
          status: 'PAY',
        })
        .select('id')
        .single();
      if (expenseErr) throw expenseErr;

      const { error: occErr } = await supabase.from('installment_occurrences').insert({
        series_id: series.id,
        installment_number: 1,
        month: startMonth,
        status: 'confirmed',
        expense_id: expense.id,
      });
      if (occErr) throw occErr;
    },
    onSuccess: invalidate,
  });
}

/** Confirma uma parcela fantasma: cria a despesa real do mês + grava a ocorrência. */
export function useConfirmInstallment(userId: string) {
  const invalidate = useInvalidateInstallments();
  return useMutation({
    mutationFn: async (ghost: GhostInstallment) => {
      if (userId === LOCAL_USER_ID) {
        const db = await getLocalDb();
        const expenseId = newId();
        const now = nowISO();
        await db.runAsync(
          'INSERT INTO expenses (id, user_id, recurrent_id, category_id, count_part, description, date_transaction, price, status, created_at, updated_at) VALUES (?, ?, NULL, ?, 1, ?, ?, ?, ?, ?, NULL)',
          [expenseId, userId, ghost.categoryId, ghost.description, dateWithinMonth(ghost.month), ghost.amount, 'PAY', now],
        );
        await db.runAsync(
          'INSERT INTO installment_occurrences (id, series_id, installment_number, month, status, expense_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [newId(), ghost.seriesId, ghost.installmentNumber, ghost.month, 'confirmed', expenseId, now],
        );
        return;
      }

      const { data: expense, error: expenseErr } = await supabase
        .from('expenses')
        .insert({
          user_id: userId,
          category_id: ghost.categoryId,
          description: ghost.description,
          price: ghost.amount,
          date_transaction: dateWithinMonth(ghost.month),
          status: 'PAY',
        })
        .select('id')
        .single();
      if (expenseErr) throw expenseErr;

      const { error: occErr } = await supabase.from('installment_occurrences').insert({
        series_id: ghost.seriesId,
        installment_number: ghost.installmentNumber,
        month: ghost.month,
        status: 'confirmed',
        expense_id: expense.id,
      });
      if (occErr) throw occErr;
    },
    onSuccess: invalidate,
  });
}

/** Cancela uma parcela: só esta, ou esta e todas as futuras (encerra a série). */
export function useCancelInstallment() {
  const invalidate = useInvalidateInstallments();
  const { isLocal } = useAuth();
  return useMutation({
    mutationFn: async ({
      ghost,
      scope,
    }: {
      ghost: GhostInstallment;
      scope: 'this' | 'remaining';
    }) => {
      if (isLocal) {
        const db = await getLocalDb();
        await db.runAsync(
          'INSERT INTO installment_occurrences (id, series_id, installment_number, month, status, expense_id, created_at) VALUES (?, ?, ?, ?, ?, NULL, ?)',
          [newId(), ghost.seriesId, ghost.installmentNumber, ghost.month, 'cancelled', nowISO()],
        );
        if (scope === 'remaining') {
          await db.runAsync('UPDATE installment_series SET cancelled_from = ? WHERE id = ?', [
            ghost.installmentNumber,
            ghost.seriesId,
          ]);
        }
        return;
      }

      const { error: occErr } = await supabase.from('installment_occurrences').insert({
        series_id: ghost.seriesId,
        installment_number: ghost.installmentNumber,
        month: ghost.month,
        status: 'cancelled',
      });
      if (occErr) throw occErr;

      if (scope === 'remaining') {
        const { error: seriesErr } = await supabase
          .from('installment_series')
          .update({ cancelled_from: ghost.installmentNumber })
          .eq('id', ghost.seriesId);
        if (seriesErr) throw seriesErr;
      }
    },
    onSuccess: invalidate,
  });
}
