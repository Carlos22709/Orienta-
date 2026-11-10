import assert from 'node:assert/strict';
import test from 'node:test';
import { palettes } from '../theme/tokens';
import { getStatusBadgeVisual } from './statusBadgeHelper';

test('StatusBadge: oportunidad vigente muestra icono ✓ y texto Vigente con color success', () => {
  const visual = getStatusBadgeVisual({ kind: 'open' }, palettes.light);
  assert.equal(visual.icon, '✓');
  assert.equal(visual.text, 'Vigente');
  assert.equal(visual.textColor, palettes.light.success);
  assert.equal(visual.label, 'Convocatoria vigente');
});

test('StatusBadge: por cerrar hoy muestra ⚠ Cierra hoy con color warning', () => {
  const visual = getStatusBadgeVisual({ kind: 'closing_soon', daysLeft: 0 }, palettes.light);
  assert.equal(visual.icon, '⚠');
  assert.equal(visual.text, 'Cierra hoy');
  assert.equal(visual.textColor, palettes.light.warning);
  assert.equal(visual.label, 'Atención: Cierra hoy');
});

test('StatusBadge: por cerrar en 1 día maneja singular correctamente', () => {
  const visual = getStatusBadgeVisual({ kind: 'closing_soon', daysLeft: 1 }, palettes.light);
  assert.equal(visual.icon, '⚠');
  assert.equal(visual.text, 'Cierra en 1 día');
  assert.equal(visual.textColor, palettes.light.warning);
  assert.equal(visual.label, 'Atención: Cierra en 1 día');
});

test('StatusBadge: por cerrar en 5 días maneja plural', () => {
  const visual = getStatusBadgeVisual({ kind: 'closing_soon', daysLeft: 5 }, palettes.light);
  assert.equal(visual.icon, '⚠');
  assert.equal(visual.text, 'Cierra en 5 días');
  assert.equal(visual.textColor, palettes.light.warning);
});

test('StatusBadge: cerrada muestra ✕ Convocatoria cerrada con color danger', () => {
  const visual = getStatusBadgeVisual({ kind: 'closed' }, palettes.light);
  assert.equal(visual.icon, '✕');
  assert.equal(visual.text, 'Convocatoria cerrada');
  assert.equal(visual.textColor, palettes.light.danger);
  assert.equal(visual.label, 'Convocatoria cerrada');
});
