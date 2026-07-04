import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import type { DateRange } from '@/features/period/period';
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

async function fetchExpensesInRange(range: DateRange | null): Promise<ExpenseWithCategory[]> {
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

async function fetchExpenseById(id: string): Promise<ExpenseRow> {
  const { data, error } = await supabase.from('expenses').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export function useExpense(id: string | undefined) {
  return useQuery({
    queryKey: ['expense', id],
    queryFn: () => fetchExpenseById(id as string),
    enabled: Boolean(id) && id !== 'new',
  });
}

export function useExpensesByRange(range: DateRange | null, enabled = true) {
  return useQuery({
    queryKey: expensesKey(range),
    queryFn: () => fetchExpensesInRange(range),
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

  const { error } = await supabase.from('expenses').insert(rows);
  if (error) throw error;
}

async function updateExpense(id: string, input: ExpenseInput): Promise<void> {
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

async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

async function deleteAllExpenses(userId: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('user_id', userId);
  if (error) throw error;
}

async function toggleStatus(id: string, status: ExpenseStatus): Promise<void> {
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
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ExpenseInput }) =>
      updateExpense(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteExpense() {
  const invalidate = useInvalidateExpenses();
  return useMutation({ mutationFn: deleteExpense, onSuccess: invalidate });
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
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ExpenseStatus }) =>
      toggleStatus(id, status),
    onSuccess: invalidate,
  });
}
