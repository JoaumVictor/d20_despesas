import { formatMonthLabel, monthRange, toISODate } from '@/utils/format';

/**
 * Período global do app (filtro). "month" é um modo navegável (setas + swipe);
 * os demais são presets de intervalo. Serializável (persistido pelo store).
 */
export type PeriodKind =
  | 'month'
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last30'
  | 'year'
  | 'all';

export type Period =
  | { kind: 'month'; ref: string } // ref = YYYY-MM-DD (1º dia do mês)
  | { kind: Exclude<PeriodKind, 'month'> };

export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
}

/** Presets exibidos no filtro (fora o modo Mês, que tem UI própria). */
export const PERIOD_PRESETS: { kind: Exclude<PeriodKind, 'month'>; label: string }[] = [
  { kind: 'today', label: 'Hoje' },
  { kind: 'yesterday', label: 'Ontem' },
  { kind: 'last7', label: 'Últimos 7 dias' },
  { kind: 'last30', label: 'Últimos 30 dias' },
  { kind: 'year', label: 'Este ano' },
  { kind: 'all', label: 'Tudo' },
];

export function firstOfMonthISO(date: Date): string {
  return toISODate(new Date(date.getFullYear(), date.getMonth(), 1));
}

export const defaultPeriod: Period = { kind: 'month', ref: firstOfMonthISO(new Date()) };

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Converte o período em um intervalo de datas. `null` = sem limite (Tudo). */
export function periodToRange(period: Period): DateRange | null {
  const today = new Date();
  switch (period.kind) {
    case 'month': {
      const { start, end } = monthRange(new Date(period.ref));
      return { start, end };
    }
    case 'today':
      return { start: toISODate(today), end: toISODate(today) };
    case 'yesterday': {
      const y = addDays(today, -1);
      return { start: toISODate(y), end: toISODate(y) };
    }
    case 'last7':
      return { start: toISODate(addDays(today, -6)), end: toISODate(today) };
    case 'last30':
      return { start: toISODate(addDays(today, -29)), end: toISODate(today) };
    case 'year':
      return {
        start: toISODate(new Date(today.getFullYear(), 0, 1)),
        end: toISODate(new Date(today.getFullYear(), 11, 31)),
      };
    case 'all':
      return null;
  }
}

/** Rótulo legível do período (usado no cabeçalho). */
export function periodLabel(period: Period): string {
  switch (period.kind) {
    case 'month':
      return formatMonthLabel(new Date(period.ref));
    case 'today':
      return 'Hoje';
    case 'yesterday':
      return 'Ontem';
    case 'last7':
      return 'Últimos 7 dias';
    case 'last30':
      return 'Últimos 30 dias';
    case 'year':
      return 'Este ano';
    case 'all':
      return 'Tudo';
  }
}

/** Chave estável do período para cache do React Query. */
export function periodKey(period: Period): string {
  return period.kind === 'month' ? `month:${period.ref}` : period.kind;
}

/** Avança/volta o mês (só no modo Mês). */
export function shiftMonth(period: Period, delta: number): Period {
  if (period.kind !== 'month') return period;
  const d = new Date(period.ref);
  return { kind: 'month', ref: firstOfMonthISO(new Date(d.getFullYear(), d.getMonth() + delta, 1)) };
}
