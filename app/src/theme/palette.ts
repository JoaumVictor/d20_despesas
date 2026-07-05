/**
 * Paleta "Verde Bandeira" — ancorada no verde real dos ícones de categoria
 * (#01763B, amostrado dos PNGs) para o app inteiro conversar com eles.
 * O tema escuro usa um verde mais vivo (#2FBF71) para manter contraste sobre
 * superfícies quase-pretas esverdeadas.
 */
export interface ThemeColors {
  primary: string;
  primaryPressed: string;
  primaryContrast: string;
  primarySoft: string; // fundo suave da cor primária (chips, badges)
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  border: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  warningSoft: string;
  success: string;
  successSoft: string;
  tabInactive: string;
  /** backdrop de modais/bottom sheets */
  overlay: string;
}

export const lightColors: ThemeColors = {
  primary: '#01763B',
  primaryPressed: '#015B2E',
  primaryContrast: '#FFFFFF',
  primarySoft: '#E3F2E9',
  bg: '#F6F8F7',
  surface: '#FFFFFF',
  surfaceAlt: '#EFF3F0',
  text: '#111B14',
  textMuted: '#5C6B61',
  border: '#E2E8E4',
  danger: '#DC2626',
  dangerSoft: '#FDECEC',
  warning: '#B45309',
  warningSoft: '#FEF3C7',
  success: '#01763B',
  successSoft: '#E3F2E9',
  tabInactive: '#8FA096',
  overlay: 'rgba(4, 18, 10, 0.55)',
};

export const darkColors: ThemeColors = {
  primary: '#2FBF71',
  primaryPressed: '#27A160',
  primaryContrast: '#04130A',
  primarySoft: '#123524',
  bg: '#0A0F0C',
  surface: '#121A15',
  surfaceAlt: '#1A241E',
  text: '#ECF2EE',
  textMuted: '#93A39A',
  border: '#233029',
  danger: '#F87171',
  dangerSoft: '#2C1517',
  warning: '#FBBF24',
  warningSoft: '#2E2508',
  success: '#3ACD7E',
  successSoft: '#0F2A1C',
  tabInactive: '#5E6E64',
  overlay: 'rgba(0, 0, 0, 0.65)',
};

export type ThemeName = 'light' | 'dark';

export const PALETTES: Record<ThemeName, ThemeColors> = {
  light: lightColors,
  dark: darkColors,
};
