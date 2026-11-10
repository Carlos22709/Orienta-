/**
 * Tokens visuales de Orienta+ (decisión 0006).
 *
 * Los contrastes de cada color frente a background y surface están
 * calculados en docs/decisions/0006-identidad-visual-y-tokens.md.
 * Ningún componente debe escribir colores directamente: todo sale de aquí.
 * Cualquier color nuevo debe verificarse antes de usarse (texto ≥ 4.5:1,
 * componentes gráficos ≥ 3:1).
 */
export const palettes = {
  light: {
    background: '#FFFFFF',
    surface: '#F3F5F8',
    text: '#16202B',
    textMuted: '#46525F',
    primary: '#0B5CAD',
    onPrimary: '#FFFFFF',
    success: '#1E7A3C',
    warning: '#8A5300',
    danger: '#B3261E',
    border: '#7A8594',
    focus: '#0B5CAD',
  },
  dark: {
    background: '#10151B',
    surface: '#1A222B',
    text: '#ECF0F4',
    textMuted: '#B3BDC9',
    primary: '#7DB9F5',
    onPrimary: '#0A1B2C',
    success: '#6CD196',
    warning: '#F0BE55',
    danger: '#FF8F86',
    border: '#76828F',
    focus: '#7DB9F5',
  },
} as const;

export type Palette = { [K in keyof (typeof palettes)['light']]: string };

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Área táctil mínima en ambas plataformas: cumple 44 pt (iOS) y 48 dp (Android). */
export const minTouchTarget = 48;

/** Tamaños base; lineHeight ≈ 1.5× en cuerpo y 1.3× en títulos para evitar recortes. */
export const typography = {
  screenTitle: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  cardTitle: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  secondary: { fontSize: 14, lineHeight: 21, fontWeight: '400' },
} as const;
