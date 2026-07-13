import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { emptyFilters, type ExpenseFilters } from '@/features/expenses/filters';
import { defaultPeriod, type Period } from '@/features/period/period';

export type ThemeMode = 'system' | 'light' | 'dark';

interface AppState {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  period: Period;
  setPeriod: (period: Period) => void;
  /** Filtros (texto/categorias/valor) compartilhados entre Despesas e Gráficos. */
  filters: ExpenseFilters;
  setFilters: (filters: ExpenseFilters) => void;
  /** Mostra status paga/em aberto (lista + form). Desligado = só anotar gastos. */
  showPaidStatus: boolean;
  setShowPaidStatus: (value: boolean) => void;
  /** Mostra o carrossel de avisos/metas na tela de Despesas. */
  showAlertCards: boolean;
  setShowAlertCards: (value: boolean) => void;
  /** Chaves (com mês embutido) de sugestões de recorrência já dispensadas. */
  dismissedSuggestions: string[];
  dismissSuggestion: (key: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      themeMode: 'system',
      setThemeMode: (themeMode) => set({ themeMode }),
      period: defaultPeriod,
      setPeriod: (period) => set({ period }),
      filters: emptyFilters,
      setFilters: (filters) => set({ filters }),
      showPaidStatus: true,
      setShowPaidStatus: (showPaidStatus) => set({ showPaidStatus }),
      showAlertCards: true,
      setShowAlertCards: (showAlertCards) => set({ showAlertCards }),
      dismissedSuggestions: [],
      dismissSuggestion: (key) =>
        set((s) => ({ dismissedSuggestions: [...s.dismissedSuggestions, key] })),
    }),
    {
      name: 'd20-app-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Persiste as preferências; período e filtros reiniciam a cada sessão.
      partialize: (state) => ({
        themeMode: state.themeMode,
        showPaidStatus: state.showPaidStatus,
        showAlertCards: state.showAlertCards,
        dismissedSuggestions: state.dismissedSuggestions,
      }),
    },
  ),
);
