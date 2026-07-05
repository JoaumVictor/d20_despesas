import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthContext';
import { getLocalDb, LOCAL_USER_ID, newId, nowISO } from '@/lib/localDb';
import { supabase } from '@/lib/supabase';
import type { GoalKind, GoalRow } from '@/types/database';

export interface GoalWithCategory extends GoalRow {
  category: { id: string; name: string; icon: string; color: string } | null;
}

export const goalsKey = ['goals'] as const;

export interface GoalInput {
  categoryId: string;
  kind: GoalKind;
  amount: number;
  /** null = recorrente; YYYY-MM-01 para meta de um mês específico */
  month: string | null;
}

async function fetchGoalsLocal(): Promise<GoalWithCategory[]> {
  const db = await getLocalDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT g.*, c.id as cat_id, c.name as cat_name, c.icon as cat_icon, c.color as cat_color ' +
      'FROM goals g LEFT JOIN categories c ON c.id = g.category_id ' +
      'ORDER BY g.created_at ASC',
  );
  return rows.map((row) => ({
    id: row.id as string,
    user_id: row.user_id as string,
    category_id: row.category_id as string,
    kind: row.kind as GoalKind,
    amount: row.amount as number,
    month: row.month as string | null,
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

async function fetchGoals(isLocal: boolean): Promise<GoalWithCategory[]> {
  if (isLocal) return fetchGoalsLocal();
  const { data, error } = await supabase
    .from('goals')
    .select('*, category:categories(id, name, icon, color)')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as GoalWithCategory[];
}

export function useGoals(userId: string | undefined) {
  const { isLocal } = useAuth();
  return useQuery({
    queryKey: goalsKey,
    queryFn: () => fetchGoals(isLocal),
    enabled: Boolean(userId),
  });
}

/** Metas válidas para um mês (YYYY-MM): recorrentes + específicas do mês. */
export function goalsForMonth(goals: GoalWithCategory[], monthKey: string): GoalWithCategory[] {
  return goals.filter((g) => g.month === null || g.month.slice(0, 7) === monthKey);
}

function useInvalidateGoals() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: goalsKey });
}

export function useCreateGoal(userId: string) {
  const invalidate = useInvalidateGoals();
  return useMutation({
    mutationFn: async (input: GoalInput) => {
      if (userId === LOCAL_USER_ID) {
        const db = await getLocalDb();
        await db.runAsync(
          'INSERT INTO goals (id, user_id, category_id, kind, amount, month, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NULL)',
          [newId(), userId, input.categoryId, input.kind, input.amount, input.month, nowISO()],
        );
        return;
      }
      const { error } = await supabase.from('goals').insert({
        user_id: userId,
        category_id: input.categoryId,
        kind: input.kind,
        amount: input.amount,
        month: input.month,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateGoal() {
  const invalidate = useInvalidateGoals();
  const { isLocal } = useAuth();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: GoalInput }) => {
      if (isLocal) {
        const db = await getLocalDb();
        await db.runAsync(
          'UPDATE goals SET category_id = ?, kind = ?, amount = ?, month = ?, updated_at = ? WHERE id = ?',
          [input.categoryId, input.kind, input.amount, input.month, nowISO(), id],
        );
        return;
      }
      const { error } = await supabase
        .from('goals')
        .update({
          category_id: input.categoryId,
          kind: input.kind,
          amount: input.amount,
          month: input.month,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteGoal() {
  const invalidate = useInvalidateGoals();
  const { isLocal } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isLocal) {
        const db = await getLocalDb();
        await db.runAsync('DELETE FROM goals WHERE id = ?', [id]);
        return;
      }
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

/** Apaga todas as metas do usuário (mantém categorias). */
export function useDeleteAllGoals(userId: string) {
  const invalidate = useInvalidateGoals();
  return useMutation({
    mutationFn: async () => {
      if (userId === LOCAL_USER_ID) {
        const db = await getLocalDb();
        await db.runAsync('DELETE FROM goals');
        return;
      }
      const { error } = await supabase.from('goals').delete().eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}
