import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthContext';
import { firstOfMonthISO } from '@/features/period/period';
import { getLocalDb, LOCAL_USER_ID, newId, nowISO } from '@/lib/localDb';
import { supabase } from '@/lib/supabase';
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

async function fetchRemindersLocal(): Promise<ReminderWithCategory[]> {
  const db = await getLocalDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT r.*, c.id as cat_id, c.name as cat_name, c.icon as cat_icon, c.color as cat_color ' +
      'FROM reminders r LEFT JOIN categories c ON c.id = r.category_id ' +
      'ORDER BY r.due_day ASC',
  );
  return rows.map((row) => ({
    id: row.id as string,
    user_id: row.user_id as string,
    category_id: row.category_id as string,
    description: row.description as string,
    amount: row.amount as number,
    due_day: row.due_day as number,
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

async function fetchReminders(isLocal: boolean): Promise<ReminderWithCategory[]> {
  if (isLocal) return fetchRemindersLocal();
  const { data, error } = await supabase
    .from('reminders')
    .select('*, category:categories(id, name, icon, color)')
    .order('due_day', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as ReminderWithCategory[];
}

async function fetchCompletionsLocal(): Promise<
  Map<string, { resolution: ReminderResolution; expenseId: string | null }>
> {
  const db = await getLocalDb();
  const rows = await db.getAllAsync<{
    reminder_id: string;
    month: string;
    resolution: ReminderResolution;
    expense_id: string | null;
  }>('SELECT reminder_id, month, resolution, expense_id FROM reminder_completions');
  const map = new Map<string, { resolution: ReminderResolution; expenseId: string | null }>();
  for (const row of rows) {
    map.set(`${row.reminder_id}:${row.month}`, {
      resolution: row.resolution,
      expenseId: row.expense_id,
    });
  }
  return map;
}

async function fetchCompletions(
  isLocal: boolean,
): Promise<Map<string, { resolution: ReminderResolution; expenseId: string | null }>> {
  if (isLocal) return fetchCompletionsLocal();
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
  const { isLocal } = useAuth();
  return useQuery({ queryKey: remindersKey, queryFn: () => fetchReminders(isLocal) });
}

/** Lembretes com o estado do mês corrente (pendente ou concluído). */
export function useMonthReminders(): { data: MonthReminder[] | undefined; isLoading: boolean } {
  const { isLocal } = useAuth();
  const { data: reminders, isLoading: loadingReminders } = useReminders();
  const { data: completions, isLoading: loadingCompletions } = useQuery({
    queryKey: completionsKey,
    queryFn: () => fetchCompletions(isLocal),
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
      if (userId === LOCAL_USER_ID) {
        const db = await getLocalDb();
        await db.runAsync(
          'INSERT INTO reminders (id, user_id, category_id, description, amount, due_day, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NULL)',
          [newId(), userId, input.categoryId, input.description, input.amount, input.dueDay, nowISO()],
        );
        return;
      }
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
  const { isLocal } = useAuth();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ReminderInput }) => {
      if (isLocal) {
        const db = await getLocalDb();
        await db.runAsync(
          'UPDATE reminders SET category_id = ?, description = ?, amount = ?, due_day = ?, updated_at = ? WHERE id = ?',
          [input.categoryId, input.description, input.amount, input.dueDay, nowISO(), id],
        );
        return;
      }
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
  const { isLocal } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isLocal) {
        const db = await getLocalDb();
        await db.runAsync('DELETE FROM reminders WHERE id = ?', [id]);
        return;
      }
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

      if (userId === LOCAL_USER_ID) {
        const db = await getLocalDb();
        if (resolution === 'expense') {
          expenseId = newId();
          await db.runAsync(
            'INSERT INTO expenses (id, user_id, recurrent_id, category_id, count_part, description, date_transaction, price, status, created_at, updated_at) VALUES (?, ?, NULL, ?, 1, ?, ?, ?, ?, ?, NULL)',
            [
              expenseId,
              userId,
              reminder.category_id,
              reminder.description,
              toISODate(new Date()),
              reminder.amount,
              'PAY',
              nowISO(),
            ],
          );
        }
        await db.runAsync(
          'INSERT INTO reminder_completions (id, reminder_id, month, resolution, expense_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [newId(), reminder.id, mk, resolution, expenseId, nowISO()],
        );
        return;
      }

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
