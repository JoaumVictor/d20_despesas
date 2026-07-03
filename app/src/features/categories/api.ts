import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { CategoryRow } from '@/types/database';
import { DEFAULT_CATEGORIES } from './defaultCategories';

export const categoriesKey = ['categories'] as const;

async function fetchCategories(userId: string): Promise<CategoryRow[]> {
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
async function fetchCategoryUsage(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from('expenses').select('category_id');
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as { category_id: string }[]) {
    counts[row.category_id] = (counts[row.category_id] ?? 0) + 1;
  }
  return counts;
}

export function useCategoryUsage(userId: string | undefined) {
  return useQuery({
    queryKey: categoryUsageKey,
    queryFn: fetchCategoryUsage,
    enabled: Boolean(userId),
  });
}
