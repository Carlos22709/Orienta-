import { palettes } from './tokens';

/**
 * Convierte un color hex de 6 caracteres ('#RRGGBB') a luminancia relativa
 * según la especificación WCAG 2.1.
 */
function hexToRelativeLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const rLin = toLinear(r);
  const gLin = toLinear(g);
  const bLin = toLinear(b);

  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

/**
 * Calcula la relación de contraste (CR) entre dos colores hex.
 * CR = (L1 + 0.05) / (L2 + 0.05) donde L1 es la luminancia mayor.
 */
function contrastRatio(hex1: string, hex2: string): number {
  const lum1 = hexToRelativeLuminance(hex1);
  const lum2 = hexToRelativeLuminance(hex2);
  const brighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (brighter + 0.05) / (darker + 0.05);
}

describe('Tokens de color y accesibilidad (WCAG 2.1 AA - compromiso V1)', () => {
  it('Tema claro: texto cumple contraste WCAG AA (>= 4.5:1)', () => {
    const { background, surface, text, textMuted, primary, success, warning, danger } =
      palettes.light;

    const textColors = [
      { name: 'text', hex: text },
      { name: 'textMuted', hex: textMuted },
      { name: 'primary', hex: primary },
      { name: 'success', hex: success },
      { name: 'warning', hex: warning },
      { name: 'danger', hex: danger },
    ];

    for (const { hex } of textColors) {
      expect(contrastRatio(hex, background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(hex, surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('Tema oscuro: texto cumple contraste WCAG AA (>= 4.5:1)', () => {
    const { background, surface, text, textMuted, primary, success, warning, danger } =
      palettes.dark;

    const textColors = [
      { name: 'text', hex: text },
      { name: 'textMuted', hex: textMuted },
      { name: 'primary', hex: primary },
      { name: 'success', hex: success },
      { name: 'warning', hex: warning },
      { name: 'danger', hex: danger },
    ];

    for (const { hex } of textColors) {
      expect(contrastRatio(hex, background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(hex, surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('Texto onPrimary cumple contraste WCAG AA sobre primary (>= 4.5:1)', () => {
    const lightRatio = contrastRatio(palettes.light.onPrimary, palettes.light.primary);
    expect(lightRatio).toBeGreaterThanOrEqual(4.5);

    const darkRatio = contrastRatio(palettes.dark.onPrimary, palettes.dark.primary);
    expect(darkRatio).toBeGreaterThanOrEqual(4.5);
  });

  it('Bordes y componentes gráficos cumplen contraste mínimo (>= 3.0:1)', () => {
    const lightBorderBg = contrastRatio(palettes.light.border, palettes.light.background);
    const darkBorderBg = contrastRatio(palettes.dark.border, palettes.dark.background);

    expect(lightBorderBg).toBeGreaterThanOrEqual(3.0);
    expect(darkBorderBg).toBeGreaterThanOrEqual(3.0);
  });
});
