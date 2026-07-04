import type { ExpenseWithCategory } from '@/features/expenses/api';
import type { GoalWithCategory } from '@/features/goals/api';
import { goalsForMonth } from '@/features/goals/api';
import { formatCurrency, formatDate } from '@/utils/format';

/**
 * Engine de insights: geradores puros que transformam o histórico completo de
 * despesas (1 query cacheada) + metas em cards prontos. Sem I/O — barato de
 * rodar e fácil de espalhar pelo app via <InsightsCarousel scope=... />.
 */

export type InsightTone = 'up' | 'down' | 'neutral' | 'success' | 'warning';
export type InsightScope = 'despesas' | 'graficos' | 'metas';

export interface InsightItem {
  id: string;
  icon: string; // MaterialCommunityIcons
  tone: InsightTone;
  title: string;
  text: string;
  scopes: InsightScope[];
  /** maior = aparece primeiro no carrossel */
  priority: number;
}

export interface InsightContext {
  expenses: ExpenseWithCategory[]; // all-time, ordenado desc por data
  goals: GoalWithCategory[];
  now: Date;
}

const MONTHS_PT = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const WEEKDAYS_PT = [
  'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
  'quinta-feira', 'sexta-feira', 'sábado',
];

function monthKeyOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function catName(e: ExpenseWithCategory): string {
  return e.category?.name ?? 'Sem categoria';
}

/** Soma por categoria das despesas de um mês (YYYY-MM). */
export function monthSpendByCategory(
  expenses: ExpenseWithCategory[],
  monthKey: string,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of expenses) {
    if (e.date_transaction.slice(0, 7) !== monthKey) continue;
    map.set(e.category_id, (map.get(e.category_id) ?? 0) + e.price);
  }
  return map;
}

/** Soma por (categoria → mês) de todo o histórico. */
function categoryMonthMatrix(expenses: ExpenseWithCategory[]) {
  const byCat = new Map<string, { name: string; months: Map<string, number> }>();
  for (const e of expenses) {
    const mk = e.date_transaction.slice(0, 7);
    let entry = byCat.get(e.category_id);
    if (!entry) {
      entry = { name: catName(e), months: new Map() };
      byCat.set(e.category_id, entry);
    }
    entry.months.set(mk, (entry.months.get(mk) ?? 0) + e.price);
  }
  return byCat;
}

type Generator = (ctx: InsightContext) => InsightItem[];

/* ------------------------------------------------------------------ */
/* Geradores de META                                                    */
/* ------------------------------------------------------------------ */

const goalProgress: Generator = ({ expenses, goals, now }) => {
  const mk = monthKeyOf(now);
  const spend = monthSpendByCategory(expenses, mk);
  const items: InsightItem[] = [];

  for (const g of goalsForMonth(goals, mk)) {
    const name = g.category?.name ?? 'categoria';
    const spent = spend.get(g.category_id) ?? 0;
    const pct = (spent / g.amount) * 100;

    if (g.kind === 'limit') {
      if (pct >= 100) {
        items.push({
          id: `goal-over-${g.id}`,
          icon: 'alert-octagon',
          tone: 'warning',
          title: `Limite de ${name} estourado`,
          text: `Você planejava até ${formatCurrency(g.amount)} e já gastou ${formatCurrency(spent)} (${pct.toFixed(0)}%).`,
          scopes: ['despesas', 'metas', 'graficos'],
          priority: 100,
        });
      } else if (pct >= 80) {
        items.push({
          id: `goal-80-${g.id}`,
          icon: 'alert',
          tone: 'warning',
          title: `${pct.toFixed(0)}% do limite de ${name}`,
          text: `Restam ${formatCurrency(g.amount - spent)} do que você planejou. Segura a mão!`,
          scopes: ['despesas', 'metas'],
          priority: 90,
        });
      } else if (pct >= 50) {
        items.push({
          id: `goal-50-${g.id}`,
          icon: 'speedometer-medium',
          tone: 'neutral',
          title: `Metade do planejado em ${name}`,
          text: `Você já gastou ${pct.toFixed(0)}% do que planejava com ${name}. Vá mais devagar a partir de agora.`,
          scopes: ['despesas', 'metas'],
          priority: 70,
        });
      }
    } else {
      // target: marca a bater (ex.: investir R$X)
      if (pct >= 100) {
        items.push({
          id: `goal-hit-${g.id}`,
          icon: 'trophy',
          tone: 'success',
          title: `Marca batida em ${name}!`,
          text: `Você alcançou os ${formatCurrency(g.amount)} definidos em ${formatDate(g.created_at.slice(0, 10))}. Boa!!`,
          scopes: ['despesas', 'metas', 'graficos'],
          priority: 95,
        });
      } else if (pct > 0) {
        items.push({
          id: `goal-target-${g.id}`,
          icon: 'flag-checkered',
          tone: 'neutral',
          title: `${pct.toFixed(0)}% da marca de ${name}`,
          text: `Faltam ${formatCurrency(g.amount - spent)} para os ${formatCurrency(g.amount)} que você definiu.`,
          scopes: ['metas'],
          priority: 60,
        });
      }
    }
  }
  return items;
};

/* ------------------------------------------------------------------ */
/* Geradores HISTÓRICOS (independem do filtro global)                   */
/* ------------------------------------------------------------------ */

const yearByCategory: Generator = ({ expenses, now }) => {
  const year = String(now.getFullYear());
  const byCat = new Map<string, number>();
  for (const e of expenses) {
    if (!e.date_transaction.startsWith(year)) continue;
    byCat.set(catName(e), (byCat.get(catName(e)) ?? 0) + e.price);
  }
  return [...byCat.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, total], i) => ({
      id: `year-cat-${name}`,
      icon: 'calendar-star',
      tone: 'neutral' as const,
      title: `${name} em ${year}`,
      text: `Este ano você já gastou ${formatCurrency(total)} com ${name}.`,
      scopes: ['graficos'] as InsightScope[],
      priority: 40 - i,
    }));
};

const recordMonth: Generator = ({ expenses, now }) => {
  const items: InsightItem[] = [];
  const mk = monthKeyOf(now);
  const matrix = categoryMonthMatrix(expenses);
  for (const [, { name, months }] of matrix) {
    if (months.size < 2) continue;
    const current = months.get(mk) ?? 0;
    if (current <= 0) continue;
    const max = Math.max(...months.values());
    if (current >= max) {
      items.push({
        id: `record-${name}`,
        icon: 'chart-bell-curve',
        tone: 'up',
        title: `Recorde em ${name}`,
        text: `Este é o mês em que você mais gastou com ${name} desde que usa o app (${formatCurrency(current)}).`,
        scopes: ['graficos'],
        priority: 55,
      });
    }
  }
  return items.slice(0, 2);
};

const seasonality: Generator = ({ expenses }) => {
  // mês do ano com maior média histórica por categoria (precisa de 2+ anos ou 4+ meses distintos)
  const matrix = categoryMonthMatrix(expenses);
  const items: InsightItem[] = [];
  for (const [, { name, months }] of matrix) {
    if (months.size < 4) continue;
    const byMonthOfYear = new Map<number, { total: number; n: number }>();
    for (const [mk, total] of months) {
      const m = Number(mk.slice(5, 7)) - 1;
      const cur = byMonthOfYear.get(m) ?? { total: 0, n: 0 };
      cur.total += total;
      cur.n += 1;
      byMonthOfYear.set(m, cur);
    }
    let best: { m: number; avg: number } | null = null;
    for (const [m, { total, n }] of byMonthOfYear) {
      const avg = total / n;
      if (!best || avg > best.avg) best = { m, avg };
    }
    if (best) {
      items.push({
        id: `season-${name}`,
        icon: 'weather-sunny',
        tone: 'neutral',
        title: `Padrão em ${name}`,
        text: `Em ${MONTHS_PT[best.m]} você geralmente gasta mais com ${name} (média de ${formatCurrency(best.avg)}).`,
        scopes: ['graficos'],
        priority: 30,
      });
    }
  }
  return items.slice(0, 2);
};

const monthVsPrevious: Generator = ({ expenses, now }) => {
  const mk = monthKeyOf(now);
  const prev = monthKeyOf(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  let cur = 0;
  let old = 0;
  for (const e of expenses) {
    const k = e.date_transaction.slice(0, 7);
    if (k === mk) cur += e.price;
    else if (k === prev) old += e.price;
  }
  if (old <= 0 || cur <= 0) return [];
  const delta = ((cur - old) / old) * 100;
  const up = delta >= 0;
  return [
    {
      id: 'month-vs-prev',
      icon: up ? 'trending-up' : 'trending-down',
      tone: up ? 'up' : 'down',
      title: up
        ? `Gastos ${Math.abs(delta).toFixed(0)}% acima do mês passado`
        : `Você economizou ${Math.abs(delta).toFixed(0)}% vs. mês passado`,
      text: `Mês passado: ${formatCurrency(old)} · Este mês: ${formatCurrency(cur)}.`,
      scopes: ['graficos', 'despesas'],
      priority: 50,
    },
  ];
};

const biggestPurchase: Generator = ({ expenses, now }) => {
  const year = String(now.getFullYear());
  let best: ExpenseWithCategory | null = null;
  for (const e of expenses) {
    if (!e.date_transaction.startsWith(year)) continue;
    if (!best || e.price > best.price) best = e;
  }
  if (!best) return [];
  const label = best.description?.trim() || catName(best);
  return [
    {
      id: 'biggest-year',
      icon: 'podium-gold',
      tone: 'neutral',
      title: `Maior compra de ${year}`,
      text: `${label} — ${formatCurrency(best.price)} em ${formatDate(best.date_transaction)} (${catName(best)}).`,
      scopes: ['graficos'],
      priority: 35,
    },
  ];
};

const weekdayPattern: Generator = ({ expenses }) => {
  if (expenses.length < 10) return [];
  const totals = new Array(7).fill(0) as number[];
  for (const e of expenses) {
    const d = new Date(`${e.date_transaction.slice(0, 10)}T00:00:00`);
    totals[d.getDay()] += e.price;
  }
  const max = Math.max(...totals);
  if (max <= 0) return [];
  const day = totals.indexOf(max);
  return [
    {
      id: 'weekday',
      icon: 'calendar-week',
      tone: 'neutral',
      title: 'Seu dia de gastar',
      text: `${WEEKDAYS_PT[day].charAt(0).toUpperCase() + WEEKDAYS_PT[day].slice(1)} é o dia da semana em que você mais gasta (${formatCurrency(max)} no total).`,
      scopes: ['graficos'],
      priority: 20,
    },
  ];
};

const dailyAverage: Generator = ({ expenses, now }) => {
  const mk = monthKeyOf(now);
  let cur = 0;
  const allMonths = new Map<string, number>();
  for (const e of expenses) {
    const k = e.date_transaction.slice(0, 7);
    allMonths.set(k, (allMonths.get(k) ?? 0) + e.price);
    if (k === mk) cur += e.price;
  }
  if (allMonths.size < 2 || cur <= 0) return [];
  const day = now.getDate();
  const curAvg = cur / day;
  let histTotal = 0;
  let histDays = 0;
  for (const [k, total] of allMonths) {
    if (k === mk) continue;
    const [y, m] = k.split('-').map(Number);
    histTotal += total;
    histDays += new Date(y, m, 0).getDate();
  }
  const histAvg = histTotal / Math.max(histDays, 1);
  if (histAvg <= 0) return [];
  const delta = ((curAvg - histAvg) / histAvg) * 100;
  const up = delta >= 0;
  return [
    {
      id: 'daily-avg',
      icon: 'chart-line-variant',
      tone: up ? 'up' : 'down',
      title: `Média diária ${up ? 'acima' : 'abaixo'} do seu normal`,
      text: `Este mês: ${formatCurrency(curAvg)}/dia · Histórico: ${formatCurrency(histAvg)}/dia (${up ? '+' : ''}${delta.toFixed(0)}%).`,
      scopes: ['graficos'],
      priority: 25,
    },
  ];
};

const trend3m: Generator = ({ expenses, now }) => {
  const keys = [2, 1, 0].map((back) =>
    monthKeyOf(new Date(now.getFullYear(), now.getMonth() - back, 1)),
  );
  const matrix = categoryMonthMatrix(expenses);
  const items: InsightItem[] = [];
  for (const [, { name, months }] of matrix) {
    const vals = keys.map((k) => months.get(k) ?? 0);
    if (vals.some((v) => v <= 0)) continue;
    if (vals[2] > vals[1] && vals[1] > vals[0]) {
      items.push({
        id: `trend-up-${name}`,
        icon: 'stairs-up',
        tone: 'up',
        title: `${name} em alta há 3 meses`,
        text: `Gastos subindo: ${formatCurrency(vals[0])} → ${formatCurrency(vals[1])} → ${formatCurrency(vals[2])}.`,
        scopes: ['graficos'],
        priority: 45,
      });
    } else if (vals[2] < vals[1] && vals[1] < vals[0]) {
      items.push({
        id: `trend-down-${name}`,
        icon: 'stairs-down',
        tone: 'down',
        title: `${name} caindo há 3 meses`,
        text: `Boa! ${formatCurrency(vals[0])} → ${formatCurrency(vals[1])} → ${formatCurrency(vals[2])}.`,
        scopes: ['graficos'],
        priority: 45,
      });
    }
  }
  return items.slice(0, 2);
};

const paidRatio: Generator = ({ expenses, now }) => {
  const mk = monthKeyOf(now);
  let open = 0;
  let openCount = 0;
  for (const e of expenses) {
    if (e.date_transaction.slice(0, 7) !== mk) continue;
    if (e.status === 'NOTPAY') {
      open += e.price;
      openCount += 1;
    }
  }
  if (openCount === 0) return [];
  return [
    {
      id: 'open-month',
      icon: 'clock-alert-outline',
      tone: 'warning',
      title: `${openCount} despesa${openCount > 1 ? 's' : ''} em aberto`,
      text: `Você ainda tem ${formatCurrency(open)} para pagar este mês.`,
      scopes: ['despesas', 'graficos'],
      priority: 65,
    },
  ];
};

const GENERATORS: Generator[] = [
  goalProgress,
  yearByCategory,
  recordMonth,
  seasonality,
  monthVsPrevious,
  biggestPurchase,
  weekdayPattern,
  dailyAverage,
  trend3m,
  paidRatio,
];

/** Roda todos os geradores e devolve os cards do escopo, ordenados por prioridade. */
export function generateInsights(ctx: InsightContext, scope: InsightScope): InsightItem[] {
  const all: InsightItem[] = [];
  for (const gen of GENERATORS) {
    try {
      all.push(...gen(ctx));
    } catch {
      // um gerador com erro nunca derruba o carrossel
    }
  }
  return all
    .filter((i) => i.scopes.includes(scope))
    .sort((a, b) => b.priority - a.priority);
}
