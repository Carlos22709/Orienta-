import {
  buildOpportunityLabel,
  CATEGORY_LABELS,
  MODALITY_LABELS,
  type OpportunityItem,
} from './OpportunityCard';

describe('OpportunityCard (WCAG F2, M1 - compromisos de tarjeta)', () => {
  const sampleOpportunity: OpportunityItem = {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    title: 'Talento Tech MinTIC - Bootcamps en Programación',
    summaryPlain: 'Formación intensiva y gratuita en desarrollo de software e inteligencia artificial.',
    category: 'training',
    entityName: 'Ministerio de Tecnologías de la Información y las Comunicaciones (MinTIC)',
    modality: 'virtual',
    deadline: '2026-12-15',
    validity: { kind: 'open' },
    reasons: ['Te interesa la formación', 'Es una ruta prioritaria para tu situación'],
  };

  it('mapea correctamente las etiquetas en español para categorías y modalidades', () => {
    expect(CATEGORY_LABELS.employment).toBe('Empleo');
    expect(CATEGORY_LABELS.training).toBe('Formación');
    expect(CATEGORY_LABELS.scholarship).toBe('Beca');
    expect(CATEGORY_LABELS.subsidy).toBe('Subsidio');
    expect(CATEGORY_LABELS.entrepreneurship).toBe('Emprendimiento');

    expect(MODALITY_LABELS.in_person).toBe('Presencial');
    expect(MODALITY_LABELS.virtual).toBe('Virtual');
    expect(MODALITY_LABELS.hybrid).toBe('Híbrida');
  });

  it('genera una etiqueta de accesibilidad agrupada sin fragmentar el foco (WCAG 1.3.1, 2.4.3)', () => {
    const label = buildOpportunityLabel(sampleOpportunity);

    expect(label).toContain('Talento Tech MinTIC');
    expect(label).toContain('Convocatoria de Formación');
    expect(label).toContain('modalidad Virtual');
    expect(label).toContain('Te interesa la formación');
  });

  // Hallazgo H2: la tarjeta agrupa a sus hijos, así que el lector no lee el
  // StatusBadge; la vigencia debe estar en la etiqueta (WCAG 1.4.1, V2).
  it('anuncia la vigencia justo después del título', () => {
    const closing = buildOpportunityLabel({
      ...sampleOpportunity,
      validity: { kind: 'closing_soon', daysLeft: 2 },
    });
    expect(closing.startsWith('Talento Tech MinTIC - Bootcamps en Programación. Atención: Cierra en 2 días.')).toBe(true);

    expect(buildOpportunityLabel(sampleOpportunity)).toContain('Convocatoria vigente');
    expect(
      buildOpportunityLabel({ ...sampleOpportunity, validity: { kind: 'closed' } }),
    ).toContain('Convocatoria cerrada');
  });

  it('omite las razones cuando no hay (listado de Explorar) sin dejar espacios sobrantes', () => {
    const label = buildOpportunityLabel({ ...sampleOpportunity, reasons: [] });
    expect(label).not.toContain('Por qué te la recomendamos');
    expect(label.endsWith('(MinTIC).')).toBe(true);
  });

  it('respeta la estructura de datos obligatoria para la tarjeta', () => {
    expect(sampleOpportunity.id).toBeDefined();
    expect(sampleOpportunity.summaryPlain.length).toBeGreaterThan(10);
    expect(sampleOpportunity.reasons.length).toBeGreaterThan(0);
    expect(sampleOpportunity.validity.kind).toBe('open');
  });
});
