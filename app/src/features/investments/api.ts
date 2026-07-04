import { useMemo } from 'react';
import { useExpensesByRange } from '@/features/expenses/api';

export interface InvestmentPoint {
  monthKey: string; // YYYY-MM
  label: string; // "jan/26"
  cumulative: number;
}

const MONTHS_SHORT = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
];

function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-');
  return `${MONTHS_SHORT[Number(m) - 1]}/${y.slice(2)}`;
}

/**
 * Patrimônio acumulado (sem rendimentos): soma, mês a mês, de tudo lançado na
 * categoria "Investimentos" — série all-time, independe do filtro de período.
 */
export function useInvestmentSeries() {
  const { data: expenses, isLoading } = useExpensesByRange(null);

  const series = useMemo<InvestmentPoint[]>(() => {
    if (!expenses) return [];
    const byMonth = new Map<string, number>();
    for (const e of expenses) {
      if (e.category?.name !== 'Investimentos') continue;
      const mk = e.date_transaction.slice(0, 7);
      byMonth.set(mk, (byMonth.get(mk) ?? 0) + e.price);
    }
    const months = [...byMonth.keys()].sort();
    let running = 0;
    return months.map((mk) => {
      running += byMonth.get(mk) ?? 0;
      return { monthKey: mk, label: monthLabel(mk), cumulative: running };
    });
  }, [expenses]);

  return {
    series,
    total: series.length ? series[series.length - 1].cumulative : 0,
    isLoading,
  };
}
