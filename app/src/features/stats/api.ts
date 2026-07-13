import { useMemo } from 'react';
import { useExpensesByRange, type ExpenseWithCategory } from '@/features/expenses/api';
import { applyFilters, emptyFilters, type ExpenseFilters } from '@/features/expenses/filters';
import {
  periodToRange,
  shiftMonth,
  type Period,
  type DateRange,
} from '@/features/period/period';
import { formatCurrency, parseISODate, toISODate } from '@/utils/format';

export interface CategorySlice {
  id: string;
  name: string;
  color: string;
  icon: string;
  value: number;
  pct: number; // 0..100 do total do período
}

export interface DailyPoint {
  day: number; // dia do mês (rótulo)
  value: number;
  dateISO: string;
}

export interface Insight {
  id: string;
  icon: string; // nome do MaterialCommunityIcons (usado no InsightCard)
  tone: 'up' | 'down' | 'neutral';
  title: string;
  text: string;
}

export interface PeriodStats {
  total: number;
  previousTotal: number;
  deltaPct: number | null;
  count: number;
  byCategory: CategorySlice[];
  daily: DailyPoint[];
  peakDay: DailyPoint | null;
  insights: Insight[];
  isLoading: boolean;
  isEmpty: boolean;
}

const FALLBACK = { name: 'Sem categoria', color: '#9ca3af', icon: '' };
const DAY_MS = 86400000;

function sum(list: ExpenseWithCategory[]): number {
  return list.reduce((s, e) => s + e.price, 0);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
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

export function buildDaily(expenses: ExpenseWithCategory[], range: DateRange | null): DailyPoint[] {
  const byDay = new Map<string, number>();
  for (const e of expenses) {
    const iso = e.date_transaction.slice(0, 10);
    byDay.set(iso, (byDay.get(iso) ?? 0) + e.price);
  }

  let start: Date;
  let end: Date;
  if (range) {
    start = parseISODate(range.start);
    end = parseISODate(range.end);
  } else {
    const isos = [...byDay.keys()].sort();
    if (isos.length === 0) return [];
    start = parseISODate(isos[0]);
    end = parseISODate(isos[isos.length - 1]);
  }

  const span = Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
  // Intervalos curtos: um ponto por dia (mostra dias zerados). Longos: só dias com gasto.
  if (span > 0 && span <= 92) {
    const points: DailyPoint[] = [];
    for (let i = 0; i < span; i++) {
      const d = addDays(start, i);
      const iso = toISODate(d);
      points.push({ day: d.getDate(), value: byDay.get(iso) ?? 0, dateISO: iso });
    }
    return points;
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([iso, value]) => ({ day: parseISODate(iso).getDate(), value, dateISO: iso }));
}

function buildInsights(
  current: ExpenseWithCategory[],
  previous: ExpenseWithCategory[],
  breakdown: CategorySlice[],
): Insight[] {
  const insights: Insight[] = [];
  const total = sum(current);
  const prevTotal = sum(previous);

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

  if (breakdown.length > 0) {
    const top = breakdown[0];
    insights.push({
      id: 'top',
      icon: 'star',
      tone: 'neutral',
      title: `Maior gasto: ${top.name}`,
      text: `${formatCurrency(top.value)} — ${top.pct.toFixed(0)}% do total.`,
    });
  }

  const prevByCat = new Map<string, number>();
  for (const e of previous) {
    const key = e.category?.id ?? 'sem';
    prevByCat.set(key, (prevByCat.get(key) ?? 0) + e.price);
  }
  let bestIncrease: { name: string; pct: number; delta: number } | null = null;
  for (const s of breakdown) {
    const prev = prevByCat.get(s.id) ?? 0;
    if (prev > 0) {
      const inc = ((s.value - prev) / prev) * 100;
      if (inc > 5 && (!bestIncrease || inc > bestIncrease.pct)) {
        bestIncrease = { name: s.name, pct: inc, delta: s.value - prev };
      }
    }
  }
  if (bestIncrease) {
    insights.push({
      id: 'increase',
      icon: 'alert-circle-outline',
      tone: 'up',
      title: `+${bestIncrease.pct.toFixed(0)}% em ${bestIncrease.name}`,
      text: `${formatCurrency(bestIncrease.delta)} a mais com ${bestIncrease.name} que no mês passado. Hora de economizar.`,
    });
  }

  // TODO(metas): cards de "meta era gastar no máx X% com Y" dependem da feature Metas.
  return insights;
}

/**
 * Estatísticas do período ativo. A comparação "vs mês passado" só se aplica
 * ao modo Mês; nos presets, os cards de comparação são omitidos.
 * Os filtros valem também para o período anterior, senão a comparação misturaria
 * um total filtrado com um total cheio.
 */
export function usePeriodStats(
  period: Period,
  filters: ExpenseFilters = emptyFilters,
): PeriodStats {
  const range = useMemo(() => periodToRange(period), [period]);
  const isMonth = period.kind === 'month';
  const prevRange = useMemo(
    () => (isMonth ? periodToRange(shiftMonth(period, -1)) : null),
    [isMonth, period],
  );

  const current = useExpensesByRange(range);
  const previous = useExpensesByRange(prevRange, isMonth);

  return useMemo<PeriodStats>(() => {
    const curData = applyFilters(current.data ?? [], filters);
    const prevData = isMonth ? applyFilters(previous.data ?? [], filters) : [];
    const total = sum(curData);
    const previousTotal = sum(prevData);
    const byCategory = buildBreakdown(curData);
    const daily = buildDaily(curData, range);
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
      isLoading: current.isLoading || (isMonth && previous.isLoading),
      isEmpty: !current.isLoading && curData.length === 0,
    };
  }, [current.data, previous.data, current.isLoading, previous.isLoading, range, isMonth, filters]);
}

export interface CategorySeries {
  id: string;
  name: string;
  color: string;
  points: DailyPoint[];
}

/**
 * Série diária de gastos por categoria, para comparar visualmente 2+
 * categorias lado a lado no mesmo período (ex.: Mercado vs iFood).
 */
export function useCategoryDailySeries(
  period: Period,
  categoryIds: string[],
  filters: ExpenseFilters = emptyFilters,
): CategorySeries[] {
  const range = useMemo(() => periodToRange(period), [period]);
  const { data } = useExpensesByRange(range, categoryIds.length > 0);

  return useMemo(() => {
    if (!data || categoryIds.length === 0) return [];
    const visible = applyFilters(data, filters);
    return categoryIds.map((id) => {
      const ofCategory = visible.filter((e) => (e.category?.id ?? 'sem') === id);
      const cat = ofCategory[0]?.category;
      return {
        id,
        name: cat?.name ?? FALLBACK.name,
        color: cat?.color ?? FALLBACK.color,
        points: buildDaily(ofCategory, range),
      };
    });
  }, [data, categoryIds, range, filters]);
}
