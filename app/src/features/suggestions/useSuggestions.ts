import { useMemo } from 'react';
import { useExpensesByRange } from '@/features/expenses/api';
import { useAppStore } from '@/store/appStore';
import { detectRecurringSuggestions } from './engine';

/** Sugestões de recorrência ativas (não dispensadas) para o mês corrente. */
export function useSuggestions() {
  const { data: allExpenses } = useExpensesByRange(null);
  const dismissedSuggestions = useAppStore((s) => s.dismissedSuggestions);

  return useMemo(
    () => detectRecurringSuggestions(allExpenses ?? [], new Date(), new Set(dismissedSuggestions)),
    [allExpenses, dismissedSuggestions],
  );
}
