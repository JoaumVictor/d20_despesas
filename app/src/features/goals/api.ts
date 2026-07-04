import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

async function fetchGoals(): Promise<GoalWithCategory[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*, category:categories(id, name, icon, color)')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as GoalWithCategory[];
}

export function useGoals(userId: string | undefined) {
  return useQuery({
    queryKey: goalsKey,
    queryFn: fetchGoals,
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
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: GoalInput }) => {
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
  return useMutation({
    mutationFn: async (id: string) => {
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
      const { error } = await supabase.from('goals').delete().eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}
