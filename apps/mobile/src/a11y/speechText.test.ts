import { buildSpeechText } from './speechText';

const base = {
  title: 'Talento Tech',
  entityName: 'MinTIC',
  summaryPlain: 'Formación gratuita en programación.',
  requirements: ['Tener entre 18 y 29 años.', 'Ser bachiller'],
  deadline: '2026-12-15',
  modalityLabel: 'Virtual',
  validityText: 'Vigente',
};

describe('texto para escuchar una oportunidad', () => {
  it('lee la información en el orden de la pantalla y numera los requisitos', () => {
    const text = buildSpeechText(base);

    expect(text.indexOf('Talento Tech')).toBeLessThan(text.indexOf('MinTIC'));
    expect(text).toContain('Modalidad virtual. Vigente.');
    expect(text).toContain('Requisitos: 1. Tener entre 18 y 29 años. 2. Ser bachiller.');
    expect(text).toContain('Postularme en el sitio oficial');
  });

  it('dice que está abierta todo el año cuando no tiene fecha de cierre', () => {
    expect(buildSpeechText({ ...base, deadline: null })).toContain('abierta todo el año');
  });

  it('omite los requisitos si no hay', () => {
    expect(buildSpeechText({ ...base, requirements: [] })).not.toContain('Requisitos');
  });
});
