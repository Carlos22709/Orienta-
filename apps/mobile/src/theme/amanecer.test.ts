import { categoryTones, palettes } from './tokens';

/** Contraste WCAG 2.1 entre dos colores #RRGGBB. */
function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

describe.each(['light', 'dark'] as const)('paleta Amanecer (%s)', (scheme) => {
  const p = palettes[scheme];

  it('el texto cumple 4.5:1 también sobre la superficie alterna', () => {
    for (const color of [p.text, p.textMuted, p.primary, p.success, p.warning, p.danger]) {
      expect(contrast(color, p.surfaceAlt)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('el texto de los chips cumple 4.5:1 sobre su fondo', () => {
    expect(contrast(p.chipText, p.chip)).toBeGreaterThanOrEqual(4.5);
  });

  it('el texto sobre cada tono de categoría cumple 4.5:1', () => {
    for (const tone of Object.values(categoryTones[scheme])) {
      expect(contrast(p.text, tone)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('el borde cumple 3:1 sobre la superficie', () => {
    expect(contrast(p.border, p.surface)).toBeGreaterThanOrEqual(3);
  });
});
