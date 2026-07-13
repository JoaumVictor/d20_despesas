import { useQuery } from '@tanstack/react-query';
import { getLocalDb, LOCAL_USER_ID } from '@/lib/localDb';
import { supabase } from '@/lib/supabase';
import type { CategoryRow } from '@/types/database';
import { planDefaultCategories, type CategoryPlan } from './defaultCategories';

export const categoriesKey = ['categories'] as const;

async function fetchCategoriesLocal(): Promise<CategoryRow[]> {
  const db = await getLocalDb();
  return db.getAllAsync<CategoryRow>('SELECT * FROM categories ORDER BY id_sort ASC');
}

async function selectCategories(): Promise<CategoryRow[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('id_sort', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function fetchCategories(userId: string): Promise<CategoryRow[]> {
  if (userId === LOCAL_USER_ID) return fetchCategoriesLocal();

  const rows = await selectCategories();

  // Cobre o primeiro login (nenhuma categoria ainda) e quem já usa o app e
  // ficou sem as categorias padrão adicionadas depois.
  const plan = planDefaultCategories(rows);
  if (plan.missing.length === 0 && plan.iconFixes.length === 0) return rows;

  return applyCategoryPlan(userId, plan);
}

async function applyCategoryPlan(userId: string, plan: CategoryPlan): Promise<CategoryRow[]> {
  if (plan.missing.length > 0) {
    const rows = plan.missing.map((c) => ({
      user_id: userId,
      id_sort: c.idSort,
      name: c.name,
      icon: c.icon,
      color: c.color,
    }));
    const { error } = await supabase.from('categories').insert(rows);
    if (error) throw error;
  }

  for (const fix of plan.iconFixes) {
    const { error } = await supabase
      .from('categories')
      .update({ icon: fix.icon })
      .eq('id', fix.id);
    if (error) throw error;
  }

  return selectCategories();
}

export function useCategories(userId: string | undefined) {
  return useQuery({
    queryKey: categoriesKey,
    queryFn: () => fetchCategories(userId as string),
    enabled: Boolean(userId),
  });
}

export const categoryUsageKey = ['category-usage'] as const;

/** Nº de despesas por categoria (para ordenar por mais usadas). */
async function fetchCategoryUsage(userId: string): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};

  if (userId === LOCAL_USER_ID) {
    const db = await getLocalDb();
    const rows = await db.getAllAsync<{ category_id: string }>(
      'SELECT category_id FROM expenses',
    );
    for (const row of rows) counts[row.category_id] = (counts[row.category_id] ?? 0) + 1;
    return counts;
  }

  const { data, error } = await supabase.from('expenses').select('category_id');
  if (error) throw error;
  for (const row of (data ?? []) as { category_id: string }[]) {
    counts[row.category_id] = (counts[row.category_id] ?? 0) + 1;
  }
  return counts;
}

export function useCategoryUsage(userId: string | undefined) {
  return useQuery({
    queryKey: categoryUsageKey,
    queryFn: () => fetchCategoryUsage(userId as string),
    enabled: Boolean(userId),
  });
}
