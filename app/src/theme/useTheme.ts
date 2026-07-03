import { useColorScheme } from 'react-native';
import { useAppStore } from '@/store/appStore';
import { PALETTES, type ThemeColors, type ThemeName } from './palette';

/** Nome do tema resolvido (respeita "system"). */
export function useThemeName(): ThemeName {
  const mode = useAppStore((s) => s.themeMode);
  const system = useColorScheme();
  if (mode === 'system') return system === 'dark' ? 'dark' : 'light';
  return mode;
}

/** Cores do tema ativo. Re-renderiza quando o modo ou o tema do sistema muda. */
export function useTheme(): ThemeColors {
  const name = useThemeName();
  return PALETTES[name];
}
