import { useQuery } from '@tanstack/react-query';
import { getLocalDb, LOCAL_USER_ID } from '@/lib/localDb';
import { supabase } from '@/lib/supabase';
import type { CategoryRow } from '@/types/database';
import { DEFAULT_CATEGORIES } from './defaultCategories';

export const categoriesKey = ['categories'] as const;

async function fetchCategoriesLocal(): Promise<CategoryRow[]> {
  const db = await getLocalDb();
  return db.getAllAsync<CategoryRow>('SELECT * FROM categories ORDER BY id_sort ASC');
}

async function fetchCategories(userId: string): Promise<CategoryRow[]> {
  if (userId === LOCAL_USER_ID) return fetchCategoriesLocal();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('id_sort', { ascending: true });
  if (error) throw error;

  // Primeiro login: sem categorias ainda → cria o conjunto padrão.
  if (!data || data.length === 0) {
    return seedDefaultCategories(userId);
  }
  return data;
}

async function seedDefaultCategories(userId: string): Promise<CategoryRow[]> {
  const rows = DEFAULT_CATEGORIES.map((c) => ({
    user_id: userId,
    id_sort: c.idSort,
    name: c.name,
    icon: c.icon,
    color: c.color,
  }));
  const { data, error } = await supabase.from('categories').insert(rows).select('*');
  if (error) throw error;
  return data ?? [];
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
