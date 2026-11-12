import { buildSpeechText, pickSpanishVoice } from './speechText';

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

describe('elección de la voz en español', () => {
  const voice = (identifier: string, language: string) => ({ identifier, language });

  it('prefiere la voz de Colombia y luego otras variantes de español', () => {
    expect(pickSpanishVoice([voice('en', 'en-US'), voice('mx', 'es-MX'), voice('co', 'es-CO')])?.identifier).toBe('co');
    expect(pickSpanishVoice([voice('en', 'en-US'), voice('es', 'es-ES'), voice('mx', 'es_MX')])?.identifier).toBe('mx');
  });

  it('usa cualquier voz en español si no hay una preferida y null si no hay ninguna', () => {
    expect(pickSpanishVoice([voice('ar', 'es-AR')])?.identifier).toBe('ar');
    expect(pickSpanishVoice([voice('en', 'en-US')])).toBeNull();
  });
});
