/**
 * Tokens visuales de Orienta+: estilo "Amanecer" (rediseño del 2026-11-12,
 * actualiza la decisión 0006).
 *
 * Contrastes calculados con la fórmula de WCAG 2.1 y verificados en
 * tokens.test.ts:
 * - texto (text, textMuted, primary, success, warning, danger) ≥ 4.5:1 sobre
 *   background, surface y surfaceAlt;
 * - onPrimary sobre primary ≥ 4.5:1;
 * - border y componentes gráficos ≥ 3:1;
 * - chipText sobre chip y text sobre cada tono de categoría ≥ 4.5:1.
 * Ningún componente debe escribir colores directamente: todo sale de aquí.
 */
export const palettes = {
  light: {
    background: '#FFF8F2',
    surface: '#FFFFFF',
    surfaceAlt: '#FFEFE3',
    text: '#3A1F14',
    textMuted: '#6E4E40',
    primary: '#C2410C',
    onPrimary: '#FFFFFF',
    /** Coral de marca: logo e ilustraciones (gráfico, no texto). */
    accent: '#E8542F',
    accentSoft: '#FFC9A8',
    chip: '#FFE7D6',
    chipText: '#9A3412',
    success: '#1E7A3C',
    warning: '#8A5300',
    danger: '#B3261E',
    border: '#9C7663',
    divider: '#F1D9C9',
    focus: '#C2410C',
    shadow: '#C2410C',
    gradientStart: '#FFF4E6',
    gradientEnd: '#FFC9A8',
  },
  dark: {
    background: '#1C1210',
    surface: '#2A1D18',
    surfaceAlt: '#36261F',
    text: '#FFF1E8',
    textMuted: '#D9BBAA',
    primary: '#FF9A6B',
    onPrimary: '#3A1F14',
    accent: '#FF9A6B',
    accentSoft: '#7A3B22',
    chip: '#4A2A1D',
    chipText: '#FFC4A6',
    success: '#6CD196',
    warning: '#F0BE55',
    danger: '#FF8F86',
    border: '#8E6E60',
    divider: '#3F2C24',
    focus: '#FF9A6B',
    shadow: '#000000',
    gradientStart: '#2A1712',
    gradientEnd: '#4A2418',
  },
} as const;

export type Palette = { [K in keyof (typeof palettes)['light']]: string };

/**
 * Tono de fondo por categoría (decorativo). El texto encima siempre es
 * `text`, con contraste ≥ 10:1 en ambos temas.
 */
export const categoryTones = {
  light: {
    employment: '#FFE0CC',
    training: '#FFF1C2',
    scholarship: '#E3F4E8',
    subsidy: '#E7E9FF',
    entrepreneurship: '#FFE3EC',
  },
  dark: {
    employment: '#4A2A1D',
    training: '#45391A',
    scholarship: '#1F3A2A',
    subsidy: '#2A2D4F',
    entrepreneurship: '#4A2033',
  },
} as const;

export type CategoryKey = keyof (typeof categoryTones)['light'];

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999,
} as const;

/** Área táctil mínima en ambas plataformas: cumple 44 pt (iOS) y 48 dp (Android). */
export const minTouchTarget = 48;

/** Familias de Nunito cargadas en app/_layout.tsx. */
export const fonts = {
  regular: 'Nunito_400Regular',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
} as const;

type TextStyleToken = { fontSize: number; lineHeight: number; fontFamily: string };

/** Tamaños base; lineHeight ≈ 1.5× en cuerpo y 1.25× en títulos para evitar recortes. */
export const BASE_TYPOGRAPHY = {
  display: { fontSize: 30, lineHeight: 38, fontFamily: fonts.extrabold },
  screenTitle: { fontSize: 26, lineHeight: 33, fontFamily: fonts.extrabold },
  cardTitle: { fontSize: 18, lineHeight: 24, fontFamily: fonts.bold },
  body: { fontSize: 16, lineHeight: 24, fontFamily: fonts.regular },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontFamily: fonts.bold },
  secondary: { fontSize: 14, lineHeight: 21, fontFamily: fonts.regular },
  label: { fontSize: 13, lineHeight: 18, fontFamily: fonts.bold },
} as const;

type TypographyKey = keyof typeof BASE_TYPOGRAPHY;

/** Límites del tamaño de texto que la persona puede elegir en Accesibilidad. */
export const TEXT_SCALE = { min: 0.85, max: 1.6, step: 0.05, default: 1 } as const;

/** Ajusta un valor al rango permitido y a pasos de 5 %. */
export function clampTextScale(value: number): number {
  const stepped = Math.round(value / TEXT_SCALE.step) * TEXT_SCALE.step;
  return Math.min(TEXT_SCALE.max, Math.max(TEXT_SCALE.min, Number(stepped.toFixed(2))));
}

/** Tipografía con tamaño y lineHeight multiplicados (redondeados a enteros). */
export function scaleTypography(scale: number): Record<TypographyKey, TextStyleToken> {
  const result = {} as Record<TypographyKey, TextStyleToken>;
  for (const key of Object.keys(BASE_TYPOGRAPHY) as TypographyKey[]) {
    const base = BASE_TYPOGRAPHY[key];
    result[key] = {
      fontFamily: base.fontFamily,
      fontSize: Math.round(base.fontSize * scale),
      lineHeight: Math.round(base.lineHeight * scale),
    };
  }
  return result;
}

/**
 * Tipografía vigente. Se recalcula cuando la persona cambia el tamaño en
 * Accesibilidad (applyTextScale); las pantallas se vuelven a dibujar porque
 * useTheme() depende de ese ajuste. Se suma al tamaño de letra del sistema,
 * que React Native sigue aplicando.
 */
export const typography: Record<TypographyKey, TextStyleToken> = scaleTypography(TEXT_SCALE.default);
let currentScale: number = TEXT_SCALE.default;

export function applyTextScale(scale: number): void {
  const next = clampTextScale(scale);
  if (next === currentScale) return;
  currentScale = next;
  Object.assign(typography, scaleTypography(next));
}

/** Escala vigente, para los pocos tamaños que no salen de typography. */
export function scaled(size: number): number {
  return Math.round(size * currentScale);
}

/** Sombra suave para tarjetas (iOS) y elevación equivalente (Android). */
export function cardShadow(color: string) {
  return {
    shadowColor: color,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  } as const;
}
