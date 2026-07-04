import type { ExpenseWithCategory } from './api';

export interface ExpenseFilters {
  text: string;
  categoryIds: string[];
  minCents: number | null;
  maxCents: number | null;
}

export const emptyFilters: ExpenseFilters = {
  text: '',
  categoryIds: [],
  minCents: null,
  maxCents: null,
};

// Faixa de marcas diacríticas combinantes (U+0300–U+036F) — via RegExp p/ manter o fonte ASCII.
const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g');

function normalize(s: string): string {
  return s.normalize('NFD').replace(DIACRITICS, '').toLocaleLowerCase('pt-BR');
}

/** Aplica os filtros (texto, categorias, faixa de valor) sobre a lista. */
export function applyFilters(
  list: ExpenseWithCategory[],
  f: ExpenseFilters,
): ExpenseWithCategory[] {
  const q = normalize(f.text.trim());
  const cats = f.categoryIds.length ? new Set(f.categoryIds) : null;
  return list.filter((e) => {
    if (cats && !cats.has(e.category_id)) return false;
    const cents = Math.round(e.price * 100);
    if (f.minCents != null && cents < f.minCents) return false;
    if (f.maxCents != null && cents > f.maxCents) return false;
    if (q) {
      const hay = normalize(`${e.description ?? ''} ${e.category?.name ?? ''}`);
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/** Nº de filtros ativos (texto + categorias + valor). */
export function activeFilterCount(f: ExpenseFilters): number {
  let n = 0;
  if (f.text.trim()) n += 1;
  if (f.categoryIds.length) n += 1;
  if (f.minCents != null) n += 1;
  if (f.maxCents != null) n += 1;
  return n;
}
