import { CATEGORY_LABELS, MODALITY_LABELS, type OpportunityItem } from './OpportunityCard';

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
    const categoryName = CATEGORY_LABELS[sampleOpportunity.category];
    const modalityName = MODALITY_LABELS[sampleOpportunity.modality];
    const reasonsText = `Por qué te la recomendamos: ${sampleOpportunity.reasons.join('. ')}.`;

    const label = `${sampleOpportunity.title}. Convocatoria de ${categoryName}, modalidad ${modalityName}, ofrecida por ${sampleOpportunity.entityName}. ${reasonsText}`;

    expect(label).toContain('Talento Tech MinTIC');
    expect(label).toContain('Convocatoria de Formación');
    expect(label).toContain('modalidad Virtual');
    expect(label).toContain('Te interesa la formación');
  });

  it('respeta la estructura de datos obligatoria para la tarjeta', () => {
    expect(sampleOpportunity.id).toBeDefined();
    expect(sampleOpportunity.summaryPlain.length).toBeGreaterThan(10);
    expect(sampleOpportunity.reasons.length).toBeGreaterThan(0);
    expect(sampleOpportunity.validity.kind).toBe('open');
  });
});
