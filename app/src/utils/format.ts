/** Formata um número como moeda brasileira (R$). */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/** Extrai só os dígitos de um texto e interpreta como centavos. */
export function digitsToCents(text: string): number {
  const digits = text.replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

/** Formata centavos (inteiro) como moeda BRL. */
export function centsToBRL(cents: number): string {
  return formatCurrency(cents / 100);
}

/** Formata uma data ISO (YYYY-MM-DD) como dd/mm/yyyy. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

/** Rótulo "julho de 2026" a partir de um Date. */
export function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
}

/** Retorna o primeiro e o último dia do mês (YYYY-MM-DD) de uma data. */
export function monthRange(date: Date): { start: string; end: string } {
  const y = date.getFullYear();
  const m = date.getMonth();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);
  return { start: toISODate(start), end: toISODate(end) };
}

/** Converte um Date para YYYY-MM-DD (sem timezone). */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
