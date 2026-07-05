import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthContext';
import type { DateRange } from '@/features/period/period';
import { getLocalDb, LOCAL_USER_ID, newId, nowISO } from '@/lib/localDb';
import { supabase } from '@/lib/supabase';
import type { ExpenseRow, ExpenseStatus } from '@/types/database';
import { toISODate } from '@/utils/format';
import { uuidv4 } from '@/utils/uuid';

export interface ExpenseWithCategory extends ExpenseRow {
  category: { id: string; name: string; icon: string; color: string } | null;
}

export function expensesKey(range: DateRange | null): QueryKey {
  return ['expenses', range ? `${range.start}:${range.end}` : 'all'];
}

export interface ExpenseInput {
  description: string;
  price: number;
  categoryId: string;
  dateTransaction: string; // YYYY-MM-DD
  status: ExpenseStatus;
  recurrent: boolean;
}

function rowToExpenseWithCategory(row: Record<string, unknown>): ExpenseWithCategory {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    recurrent_id: row.recurrent_id as string | null,
    category_id: row.category_id as string,
    count_part: row.count_part as number,
    description: row.description as string,
    date_transaction: row.date_transaction as string,
    price: row.price as number,
    status: row.status as ExpenseStatus,
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
  };
}

async function fetchExpensesInRangeLocal(range: DateRange | null): Promise<ExpenseWithCategory[]> {
  const db = await getLocalDb();
  let sql =
    'SELECT e.*, c.id as cat_id, c.name as cat_name, c.icon as cat_icon, c.color as cat_color ' +
    'FROM expenses e LEFT JOIN categories c ON c.id = e.category_id';
  const params: string[] = [];
  if (range) {
    sql += ' WHERE e.date_transaction >= ? AND e.date_transaction <= ?';
    params.push(range.start, range.end);
  }
  sql += ' ORDER BY e.date_transaction DESC';
  const rows = await db.getAllAsync<Record<string, unknown>>(sql, params);
  return rows.map(rowToExpenseWithCategory);
}

async function fetchExpensesInRange(
  range: DateRange | null,
  isLocal: boolean,
): Promise<ExpenseWithCategory[]> {
  if (isLocal) return fetchExpensesInRangeLocal(range);

  let query = supabase
    .from('expenses')
    .select('*, category:categories(id, name, icon, color)')
    .order('date_transaction', { ascending: false });
  if (range) {
    query = query.gte('date_transaction', range.start).lte('date_transaction', range.end);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as ExpenseWithCategory[];
}

async function fetchExpenseById(id: string, isLocal: boolean): Promise<ExpenseRow> {
  if (isLocal) {
    const db = await getLocalDb();
    const row = await db.getFirstAsync<ExpenseRow>('SELECT * FROM expenses WHERE id = ?', [id]);
    if (!row) throw new Error('Despesa não encontrada.');
    return row;
  }
  const { data, error } = await supabase.from('expenses').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export function useExpense(id: string | undefined) {
  const { isLocal } = useAuth();
  return useQuery({
    queryKey: ['expense', id],
    queryFn: () => fetchExpenseById(id as string, isLocal),
    enabled: Boolean(id) && id !== 'new',
  });
}

export function useExpensesByRange(range: DateRange | null, enabled = true) {
  const { isLocal } = useAuth();
  return useQuery({
    queryKey: expensesKey(range),
    queryFn: () => fetchExpensesInRange(range, isLocal),
    enabled,
  });
}

/** Avança uma data em um mês, preservando o dia quando possível. */
function nextMonth(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const base = new Date(y, m - 1, d);
  base.setMonth(base.getMonth() + 1);
  return toISODate(base);
}

async function createExpense(userId: string, input: ExpenseInput): Promise<void> {
  const recurrentId = input.recurrent ? uuidv4() : null;

  const rows = [
    {
      user_id: userId,
      description: input.description,
      price: input.price,
      category_id: input.categoryId,
      date_transaction: input.dateTransaction,
      status: input.status,
      recurrent_id: recurrentId,
    },
  ];

  // Recorrência: já gera a ocorrência do próximo mês compartilhando o recurrent_id.
  if (input.recurrent) {
    rows.push({
      ...rows[0],
      date_transaction: nextMonth(input.dateTransaction),
      status: 'NOTPAY',
    });
  }

  if (userId === LOCAL_USER_ID) {
    const db = await getLocalDb();
    const now = nowISO();
    for (const row of rows) {
      await db.runAsync(
        'INSERT INTO expenses (id, user_id, recurrent_id, category_id, count_part, description, date_transaction, price, status, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, NULL)',
        [
          newId(),
          row.user_id,
          row.recurrent_id,
          row.category_id,
          row.description,
          row.date_transaction,
          row.price,
          row.status,
          now,
        ],
      );
    }
    return;
  }

  const { error } = await supabase.from('expenses').insert(rows);
  if (error) throw error;
}

async function updateExpense(id: string, input: ExpenseInput, isLocal: boolean): Promise<void> {
  if (isLocal) {
    const db = await getLocalDb();
    await db.runAsync(
      'UPDATE expenses SET description = ?, price = ?, category_id = ?, date_transaction = ?, status = ?, updated_at = ? WHERE id = ?',
      [input.description, input.price, input.categoryId, input.dateTransaction, input.status, nowISO(), id],
    );
    return;
  }
  const { error } = await supabase
    .from('expenses')
    .update({
      description: input.description,
      price: input.price,
      category_id: input.categoryId,
      date_transaction: input.dateTransaction,
      status: input.status,
    })
    .eq('id', id);
  if (error) throw error;
}

async function deleteExpense(id: string, isLocal: boolean): Promise<void> {
  if (isLocal) {
    const db = await getLocalDb();
    await db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
    return;
  }
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

async function deleteAllExpenses(userId: string): Promise<void> {
  if (userId === LOCAL_USER_ID) {
    const db = await getLocalDb();
    await db.runAsync('DELETE FROM expenses');
    return;
  }
  const { error } = await supabase.from('expenses').delete().eq('user_id', userId);
  if (error) throw error;
}

async function toggleStatus(id: string, status: ExpenseStatus, isLocal: boolean): Promise<void> {
  if (isLocal) {
    const db = await getLocalDb();
    await db.runAsync('UPDATE expenses SET status = ?, updated_at = ? WHERE id = ?', [
      status,
      nowISO(),
      id,
    ]);
    return;
  }
  const { error } = await supabase.from('expenses').update({ status }).eq('id', id);
  if (error) throw error;
}

function useInvalidateExpenses() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['expenses'] });
    qc.invalidateQueries({ queryKey: ['category-usage'] });
  };
}

export function useCreateExpense(userId: string) {
  const invalidate = useInvalidateExpenses();
  return useMutation({
    mutationFn: (input: ExpenseInput) => createExpense(userId, input),
    onSuccess: invalidate,
  });
}

export function useUpdateExpense() {
  const invalidate = useInvalidateExpenses();
  const { isLocal } = useAuth();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ExpenseInput }) =>
      updateExpense(id, input, isLocal),
    onSuccess: invalidate,
  });
}

export function useDeleteExpense() {
  const invalidate = useInvalidateExpenses();
  const { isLocal } = useAuth();
  return useMutation({
    mutationFn: (id: string) => deleteExpense(id, isLocal),
    onSuccess: invalidate,
  });
}

/** Apaga todas as despesas do usuário (mantém categorias e metas). */
export function useDeleteAllExpenses(userId: string) {
  const invalidate = useInvalidateExpenses();
  return useMutation({
    mutationFn: () => deleteAllExpenses(userId),
    onSuccess: invalidate,
  });
}

export function useToggleStatus() {
  const invalidate = useInvalidateExpenses();
  const { isLocal } = useAuth();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ExpenseStatus }) =>
      toggleStatus(id, status, isLocal),
    onSuccess: invalidate,
  });
}
