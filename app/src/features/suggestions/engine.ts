import type { ExpenseWithCategory } from '@/features/expenses/api';

export interface RecurringSuggestion {
  /** Chave estável (inclui o mês) — usada para dispensar/cache. */
  key: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  description: string; // como foi digitada da última vez (não normalizada)
  amount: number; // valor sugerido (do lançamento mais recente)
  monthsMatched: number; // confiança: quantos dos últimos 3 meses bateram
}

const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g');
const EXTRA_SPACES = /\s+/g;
const EDGE_PUNCT = /^[.,;:!?\-\s]+|[.,;:!?\-\s]+$/g;

/**
 * Normaliza a descrição pra comparar recorrência de forma tolerante:
 * ignora maiúsculas/minúsculas, acentos, espaços duplicados e pontuação
 * nas bordas (ex.: "Energia", "energia", "Energia." e "  ENERGIA  " batem).
 */
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLocaleLowerCase('pt-BR')
    .replace(EXTRA_SPACES, ' ')
    .replace(EDGE_PUNCT, '')
    .trim();
}

function monthKeyOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonthKey(now: Date, delta: number): string {
  const d = new Date(now.getFullYear(), now.getMonth() + delta, 1);
  return monthKeyOf(d);
}

/**
 * Detecta despesas recorrentes: mesma categoria + descrição normalizada
 * aparecendo em ≥2 dos últimos 3 meses, sem lançamento ainda neste mês.
 * `dismissed` = chaves (com mês embutido) que o usuário já fechou.
 */
export function detectRecurringSuggestions(
  expenses: ExpenseWithCategory[],
  now: Date,
  dismissed: Set<string>,
): RecurringSuggestion[] {
  const currentMonth = monthKeyOf(now);
  const priorMonths = [1, 2, 3].map((n) => shiftMonthKey(now, -n));

  interface Group {
    categoryId: string;
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
    description: string;
    monthsSeen: Set<string>;
    latest: { date: string; amount: number } | null;
    seenThisMonth: boolean;
  }

  const groups = new Map<string, Group>();

  for (const e of expenses) {
    const desc = e.description?.trim();
    if (!desc || !e.category) continue; // sem descrição não dá pra identificar recorrência
    const mk = e.date_transaction.slice(0, 7);
    const groupKey = `${e.category_id}::${normalize(desc)}`;

    let g = groups.get(groupKey);
    if (!g) {
      g = {
        categoryId: e.category_id,
        categoryName: e.category.name,
        categoryIcon: e.category.icon,
        categoryColor: e.category.color,
        description: desc,
        monthsSeen: new Set(),
        latest: null,
        seenThisMonth: false,
      };
      groups.set(groupKey, g);
    }

    if (mk === currentMonth) {
      g.seenThisMonth = true;
    } else if (priorMonths.includes(mk)) {
      g.monthsSeen.add(mk);
    }

    if (!g.latest || e.date_transaction > g.latest.date) {
      g.latest = { date: e.date_transaction, amount: e.price };
      g.description = desc; // mantém a descrição mais recente
    }
  }

  const suggestions: RecurringSuggestion[] = [];
  for (const [groupKey, g] of groups) {
    if (g.seenThisMonth) continue;
    if (g.monthsSeen.size < 2) continue;
    if (!g.latest) continue;

    const key = `${currentMonth}:${groupKey}`;
    if (dismissed.has(key)) continue;

    suggestions.push({
      key,
      categoryId: g.categoryId,
      categoryName: g.categoryName,
      categoryIcon: g.categoryIcon,
      categoryColor: g.categoryColor,
      description: g.description,
      amount: g.latest.amount,
      monthsMatched: g.monthsSeen.size,
    });
  }

  suggestions.sort((a, b) => b.monthsMatched - a.monthsMatched);
  return suggestions.slice(0, 4);
}
