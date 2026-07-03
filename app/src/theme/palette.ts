/**
 * Paletas do app. Primária = verde forte (#16A34A). O tema escuro usa um verde
 * levemente mais claro para manter contraste sobre fundos escuros.
 */
export interface ThemeColors {
  primary: string;
  primaryContrast: string;
  primarySoft: string; // fundo suave da cor primária (chips, destaques)
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  border: string;
  danger: string;
  dangerSoft: string;
  success: string;
  successSoft: string;
  tabInactive: string;
}

export const lightColors: ThemeColors = {
  primary: '#16A34A',
  primaryContrast: '#ffffff',
  primarySoft: '#dcfce7',
  bg: '#ffffff',
  surface: '#ffffff',
  surfaceAlt: '#f9fafb',
  text: '#111827',
  textMuted: '#6b7280',
  border: '#eceef1',
  danger: '#dc2626',
  dangerSoft: '#fef2f2',
  success: '#16a34a',
  successSoft: '#f0fdf4',
  tabInactive: '#9ca3af',
};

export const darkColors: ThemeColors = {
  primary: '#22C55E',
  primaryContrast: '#052e16',
  primarySoft: '#14321f',
  bg: '#0b0f14',
  surface: '#121820',
  surfaceAlt: '#1a222c',
  text: '#f3f4f6',
  textMuted: '#9aa5b1',
  border: '#26303b',
  danger: '#f87171',
  dangerSoft: '#2a1416',
  success: '#4ade80',
  successSoft: '#0f2417',
  tabInactive: '#6b7280',
};

export type ThemeName = 'light' | 'dark';

export const PALETTES: Record<ThemeName, ThemeColors> = {
  light: lightColors,
  dark: darkColors,
};
