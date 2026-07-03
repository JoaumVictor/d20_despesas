import { useMemo } from 'react';
import { useExpenses, type ExpenseWithCategory } from '@/features/expenses/api';
import { formatCurrency } from '@/utils/format';

export interface CategorySlice {
  id: string;
  name: string;
  color: string;
  icon: string;
  value: number;
  pct: number; // 0..100 do total do mês
}

export interface DailyPoint {
  day: number;
  value: number;
}

export interface Insight {
  id: string;
  icon: string; // nome do MaterialCommunityIcons
  tone: 'up' | 'down' | 'neutral';
  title: string;
  text: string;
}

export interface MonthStats {
  total: number;
  previousTotal: number;
  deltaPct: number | null; // null quando não há dados do mês anterior
  count: number;
  byCategory: CategorySlice[];
  daily: DailyPoint[];
  peakDay: DailyPoint | null;
  insights: Insight[];
  isLoading: boolean;
  isEmpty: boolean;
}

const FALLBACK = { name: 'Sem categoria', color: '#9ca3af', icon: 'help-circle' };

function sum(list: ExpenseWithCategory[]): number {
  return list.reduce((s, e) => s + e.price, 0);
}

function buildBreakdown(expenses: ExpenseWithCategory[]): CategorySlice[] {
  const total = sum(expenses);
  const map = new Map<string, CategorySlice>();
  for (const e of expenses) {
    const cat = e.category;
    const key = cat?.id ?? 'sem';
    const cur =
      map.get(key) ??
      ({
        id: key,
        name: cat?.name ?? FALLBACK.name,
        color: cat?.color ?? FALLBACK.color,
        icon: cat?.icon ?? FALLBACK.icon,
        value: 0,
        pct: 0,
      } satisfies CategorySlice);
    cur.value += e.price;
    map.set(key, cur);
  }
  const slices = [...map.values()];
  for (const s of slices) s.pct = total > 0 ? (s.value / total) * 100 : 0;
  slices.sort((a, b) => b.value - a.value);
  return slices;
}

function buildDaily(expenses: ExpenseWithCategory[], reference: Date): DailyPoint[] {
  const daysInMonth = new Date(reference.getFullYear(), reference.getMonth() + 1, 0).getDate();
  const points: DailyPoint[] = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    value: 0,
  }));
  for (const e of expenses) {
    const day = Number(e.date_transaction.slice(8, 10));
    if (day >= 1 && day <= daysInMonth) points[day - 1].value += e.price;
  }
  return points;
}

function buildInsights(
  current: ExpenseWithCategory[],
  previous: ExpenseWithCategory[],
  breakdown: CategorySlice[],
): Insight[] {
  const insights: Insight[] = [];
  const total = sum(current);
  const prevTotal = sum(previous);

  // 1) Comparação do total com o mês anterior.
  if (prevTotal > 0) {
    const delta = ((total - prevTotal) / prevTotal) * 100;
    const up = delta >= 0;
    insights.push({
      id: 'total',
      icon: up ? 'trending-up' : 'trending-down',
      tone: up ? 'up' : 'down',
      title: up
        ? `Você gastou ${Math.abs(delta).toFixed(0)}% a mais`
        : `Você economizou ${Math.abs(delta).toFixed(0)}%`,
      text: `Mês passado: ${formatCurrency(prevTotal)} · Agora: ${formatCurrency(total)}.`,
    });
  }

  // 2) Maior categoria do mês.
  if (breakdown.length > 0) {
    const top = breakdown[0];
    insights.push({
      id: 'top',
      icon: top.icon,
      tone: 'neutral',
      title: `Maior gasto: ${top.name}`,
      text: `${formatCurrency(top.value)} — ${top.pct.toFixed(0)}% do total do mês.`,
    });
  }

  // 3) Maior aumento por categoria vs. mês anterior.
  const prevByCat = new Map<string, number>();
  for (const e of previous) {
    const key = e.category?.id ?? 'sem';
    prevByCat.set(key, (prevByCat.get(key) ?? 0) + e.price);
  }
  let bestIncrease: { name: string; icon: string; pct: number; delta: number } | null = null;
  for (const s of breakdown) {
    const prev = prevByCat.get(s.id) ?? 0;
    if (prev > 0) {
      const inc = ((s.value - prev) / prev) * 100;
      if (inc > 5 && (!bestIncrease || inc > bestIncrease.pct)) {
        bestIncrease = { name: s.name, icon: s.icon, pct: inc, delta: s.value - prev };
      }
    }
  }
  if (bestIncrease) {
    insights.push({
      id: 'increase',
      icon: 'alert-circle-outline',
      tone: 'up',
      title: `+${bestIncrease.pct.toFixed(0)}% em ${bestIncrease.name}`,
      text: `${formatCurrency(bestIncrease.delta)} a mais com ${bestIncrease.name} que no mês passado. Hora de economizar nessa categoria.`,
    });
  }

  // TODO(metas): cards do tipo "sua meta era gastar no máx X% com Y" dependem da
  // feature Metas (orçamento por categoria), ainda não implementada.

  return insights;
}

/**
 * Agrega as estatísticas do mês de `reference`, comparando com o mês anterior.
 * Reusa `useExpenses` (mesmo cache do React Query da tela de Despesas).
 */
export function useMonthStats(reference: Date): MonthStats {
  const previousRef = useMemo(
    () => new Date(reference.getFullYear(), reference.getMonth() - 1, 1),
    [reference],
  );

  const current = useExpenses(reference);
  const previous = useExpenses(previousRef);

  return useMemo<MonthStats>(() => {
    const curData = current.data ?? [];
    const prevData = previous.data ?? [];
    const total = sum(curData);
    const previousTotal = sum(prevData);
    const byCategory = buildBreakdown(curData);
    const daily = buildDaily(curData, reference);
    const peakDay = daily.reduce<DailyPoint | null>(
      (max, p) => (p.value > 0 && (!max || p.value > max.value) ? p : max),
      null,
    );

    return {
      total,
      previousTotal,
      deltaPct: previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : null,
      count: curData.length,
      byCategory,
      daily,
      peakDay,
      insights: buildInsights(curData, prevData, byCategory),
      isLoading: current.isLoading || previous.isLoading,
      isEmpty: !current.isLoading && curData.length === 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.data, previous.data, current.isLoading, previous.isLoading, reference]);
}
