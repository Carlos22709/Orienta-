import { palettes } from '../theme/tokens';
import { getStatusBadgeVisual } from './statusBadgeHelper';

describe('StatusBadge (WCAG 1.4.1 - compromiso V2)', () => {
  it('oportunidad vigente muestra icono ✓ y texto Vigente con color success', () => {
    const visual = getStatusBadgeVisual({ kind: 'open' }, palettes.light);
    expect(visual.icon).toBe('✓');
    expect(visual.text).toBe('Vigente');
    expect(visual.textColor).toBe(palettes.light.success);
    expect(visual.label).toBe('Convocatoria vigente');
  });

  it('por cerrar hoy muestra ⚠ Cierra hoy con color warning', () => {
    const visual = getStatusBadgeVisual(
      { kind: 'closing_soon', daysLeft: 0 },
      palettes.light,
    );
    expect(visual.icon).toBe('⚠');
    expect(visual.text).toBe('Cierra hoy');
    expect(visual.textColor).toBe(palettes.light.warning);
    expect(visual.label).toBe('Atención: Cierra hoy');
  });

  it('por cerrar en 1 día maneja singular correctamente', () => {
    const visual = getStatusBadgeVisual(
      { kind: 'closing_soon', daysLeft: 1 },
      palettes.light,
    );
    expect(visual.icon).toBe('⚠');
    expect(visual.text).toBe('Cierra en 1 día');
    expect(visual.textColor).toBe(palettes.light.warning);
    expect(visual.label).toBe('Atención: Cierra en 1 día');
  });

  it('por cerrar en 5 días maneja plural', () => {
    const visual = getStatusBadgeVisual(
      { kind: 'closing_soon', daysLeft: 5 },
      palettes.light,
    );
    expect(visual.icon).toBe('⚠');
    expect(visual.text).toBe('Cierra en 5 días');
    expect(visual.textColor).toBe(palettes.light.warning);
  });

  it('cerrada muestra ✕ Convocatoria cerrada con color danger', () => {
    const visual = getStatusBadgeVisual({ kind: 'closed' }, palettes.light);
    expect(visual.icon).toBe('✕');
    expect(visual.text).toBe('Convocatoria cerrada');
    expect(visual.textColor).toBe(palettes.light.danger);
    expect(visual.label).toBe('Convocatoria cerrada');
  });
});
