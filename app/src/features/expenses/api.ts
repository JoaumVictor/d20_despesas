import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ExpenseRow, ExpenseStatus } from '@/types/database';
import { monthRange, toISODate } from '@/utils/format';
import { uuidv4 } from '@/utils/uuid';

export interface ExpenseWithCategory extends ExpenseRow {
  category: { id: string; name: string; icon: string; color: string } | null;
}

export function expensesKey(monthISO: string): QueryKey {
  return ['expenses', monthISO];
}

export interface ExpenseInput {
  description: string;
  price: number;
  categoryId: string;
  dateTransaction: string; // YYYY-MM-DD
  status: ExpenseStatus;
  recurrent: boolean;
}

async function fetchExpensesOfMonth(reference: Date): Promise<ExpenseWithCategory[]> {
  const { start, end } = monthRange(reference);
  const { data, error } = await supabase
    .from('expenses')
    .select('*, category:categories(id, name, icon, color)')
    .gte('date_transaction', start)
    .lte('date_transaction', end)
    .order('date_transaction', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ExpenseWithCategory[];
}

/** Chave de mês (YYYY-MM) usada no cache. */
export function monthCacheKey(reference: Date): string {
  return toISODate(reference).slice(0, 7);
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

export function useExpenses(reference: Date) {
  return useQuery({
    queryKey: expensesKey(monthCacheKey(reference)),
    queryFn: () => fetchExpensesOfMonth(reference),
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

async function toggleStatus(id: string, status: ExpenseStatus): Promise<void> {
  const { error } = await supabase.from('expenses').update({ status }).eq('id', id);
  if (error) throw error;
}

function useInvalidateExpenses() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['expenses'] });
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

export function useToggleStatus() {
  const invalidate = useInvalidateExpenses();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ExpenseStatus }) =>
      toggleStatus(id, status),
    onSuccess: invalidate,
  });
}
