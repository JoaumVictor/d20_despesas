import type { TextStyle, ViewStyle } from 'react-native';

/**
 * Tokens de design do app — definidos uma única vez e reusados em todas as
 * telas para manter raios, espaçamentos, tipografia e sombras consistentes.
 */

/** Escala de espaçamento (px). */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/** Raios de borda. */
export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

/** Escala tipográfica. */
export const type = {
  display: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 } satisfies TextStyle,
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 } satisfies TextStyle,
  heading: { fontSize: 17, fontWeight: '700' } satisfies TextStyle,
  body: { fontSize: 15 } satisfies TextStyle,
  bodyBold: { fontSize: 15, fontWeight: '700' } satisfies TextStyle,
  caption: { fontSize: 12.5 } satisfies TextStyle,
  /** rótulo de seção (usar com textTransform uppercase) */
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  } satisfies TextStyle,
} as const;

/** Sombra suave para cards. */
export const shadowCard: ViewStyle = {
  elevation: 2,
  shadowColor: '#02130A',
  shadowOpacity: 0.08,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
};

/** Sombra forte para elementos flutuantes (FAB, modais). */
export const shadowFloating: ViewStyle = {
  elevation: 8,
  shadowColor: '#02130A',
  shadowOpacity: 0.25,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
};
