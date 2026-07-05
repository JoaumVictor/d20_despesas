import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { firstOfMonthISO } from '@/features/period/period';
import type { ReminderResolution, ReminderRow } from '@/types/database';
import { toISODate } from '@/utils/format';

export interface ReminderWithCategory extends ReminderRow {
  category: { id: string; name: string; icon: string; color: string } | null;
}

export interface MonthReminder extends ReminderWithCategory {
  /** preenchido se já resolvido este mês */
  completion: { resolution: ReminderResolution; expenseId: string | null } | null;
}

const remindersKey = ['reminders'] as const;
const completionsKey = ['reminder-completions'] as const;

export interface ReminderInput {
  categoryId: string;
  description: string;
  amount: number;
  dueDay: number;
}

async function fetchReminders(): Promise<ReminderWithCategory[]> {
  const { data, error } = await supabase
    .from('reminders')
    .select('*, category:categories(id, name, icon, color)')
    .order('due_day', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as ReminderWithCategory[];
}

async function fetchCompletions(): Promise<
  Map<string, { resolution: ReminderResolution; expenseId: string | null }>
> {
  const { data, error } = await supabase
    .from('reminder_completions')
    .select('reminder_id, month, resolution, expense_id');
  if (error) throw error;
  const map = new Map<string, { resolution: ReminderResolution; expenseId: string | null }>();
  for (const row of data ?? []) {
    map.set(`${row.reminder_id}:${row.month}`, {
      resolution: row.resolution,
      expenseId: row.expense_id,
    });
  }
  return map;
}

export function useReminders() {
  return useQuery({ queryKey: remindersKey, queryFn: fetchReminders });
}

/** Lembretes com o estado do mês corrente (pendente ou concluído). */
export function useMonthReminders(): { data: MonthReminder[] | undefined; isLoading: boolean } {
  const { data: reminders, isLoading: loadingReminders } = useReminders();
  const { data: completions, isLoading: loadingCompletions } = useQuery({
    queryKey: completionsKey,
    queryFn: fetchCompletions,
  });

  const data = useMemo(() => {
    if (!reminders || !completions) return undefined;
    const mk = firstOfMonthISO(new Date());
    return reminders.map((r) => ({
      ...r,
      completion: completions.get(`${r.id}:${mk}`) ?? null,
    }));
  }, [reminders, completions]);

  return { data, isLoading: loadingReminders || loadingCompletions };
}

function useInvalidateReminders() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: remindersKey });
    qc.invalidateQueries({ queryKey: completionsKey });
    qc.invalidateQueries({ queryKey: ['expenses'] });
    qc.invalidateQueries({ queryKey: ['category-usage'] });
  };
}

export function useCreateReminder(userId: string) {
  const invalidate = useInvalidateReminders();
  return useMutation({
    mutationFn: async (input: ReminderInput) => {
      const { error } = await supabase.from('reminders').insert({
        user_id: userId,
        category_id: input.categoryId,
        description: input.description,
        amount: input.amount,
        due_day: input.dueDay,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateReminder() {
  const invalidate = useInvalidateReminders();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ReminderInput }) => {
      const { error } = await supabase
        .from('reminders')
        .update({
          category_id: input.categoryId,
          description: input.description,
          amount: input.amount,
          due_day: input.dueDay,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteReminder() {
  const invalidate = useInvalidateReminders();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reminders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

/** "Paguei": cria a despesa e/ou só marca concluído, gravando a completion do mês. */
export function useResolveReminder(userId: string) {
  const invalidate = useInvalidateReminders();
  return useMutation({
    mutationFn: async ({
      reminder,
      resolution,
    }: {
      reminder: ReminderWithCategory;
      resolution: ReminderResolution;
    }) => {
      const mk = firstOfMonthISO(new Date());
      let expenseId: string | null = null;

      if (resolution === 'expense') {
        const { data: expense, error: expenseErr } = await supabase
          .from('expenses')
          .insert({
            user_id: userId,
            category_id: reminder.category_id,
            description: reminder.description,
            price: reminder.amount,
            date_transaction: toISODate(new Date()),
            status: 'PAY',
          })
          .select('id')
          .single();
        if (expenseErr) throw expenseErr;
        expenseId = expense.id;
      }

      const { error: compErr } = await supabase.from('reminder_completions').insert({
        reminder_id: reminder.id,
        month: mk,
        resolution,
        expense_id: expenseId,
      });
      if (compErr) throw compErr;
    },
    onSuccess: invalidate,
  });
}
