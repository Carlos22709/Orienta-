import {
  applyTextScale,
  BASE_TYPOGRAPHY,
  clampTextScale,
  scaled,
  scaleTypography,
  TEXT_SCALE,
  typography,
} from './tokens';

describe('tamaño de texto ajustable', () => {
  afterEach(() => applyTextScale(TEXT_SCALE.default));

  it('limita el valor al rango permitido en pasos de 5 %', () => {
    expect(clampTextScale(0.5)).toBe(TEXT_SCALE.min);
    expect(clampTextScale(3)).toBe(TEXT_SCALE.max);
    expect(clampTextScale(1.12)).toBe(1.1);
    expect(clampTextScale(1.13)).toBe(1.15);
  });

  it('escala tamaño y lineHeight juntos para que el texto no se recorte', () => {
    const big = scaleTypography(1.5);
    expect(big.body).toEqual({ ...BASE_TYPOGRAPHY.body, fontSize: 24, lineHeight: 36 });
    expect(big.body.lineHeight / big.body.fontSize).toBeCloseTo(1.5);
  });

  it('applyTextScale actualiza la tipografía que usan las pantallas', () => {
    applyTextScale(1.25);
    expect(typography.body.fontSize).toBe(20);
    expect(scaled(24)).toBe(30);

    applyTextScale(TEXT_SCALE.default);
    expect(typography.body.fontSize).toBe(16);
  });
});
