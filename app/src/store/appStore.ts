import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { defaultPeriod, type Period } from '@/features/period/period';

export type ThemeMode = 'system' | 'light' | 'dark';

interface AppState {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  period: Period;
  setPeriod: (period: Period) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      themeMode: 'system',
      setThemeMode: (themeMode) => set({ themeMode }),
      period: defaultPeriod,
      setPeriod: (period) => set({ period }),
    }),
    {
      name: 'd20-app-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Persiste só a preferência de tema; o período reinicia no mês atual.
      partialize: (state) => ({ themeMode: state.themeMode }),
    },
  ),
);
