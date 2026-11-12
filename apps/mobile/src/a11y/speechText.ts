/**
 * Texto que lee en voz alta el botón "Escuchar" del detalle de una
 * oportunidad (apoyo para baja visión o dificultad de lectura). Se arma en
 * frases cortas y en el mismo orden que la pantalla.
 */
export interface SpeakableOpportunity {
  title: string;
  entityName: string;
  summaryPlain: string;
  requirements: string[];
  deadline: string | null;
  modalityLabel: string;
  validityText: string;
}

/** "15 de diciembre de 2026", leído con el idioma del teléfono en español. */
function spokenDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function buildSpeechText(o: SpeakableOpportunity): string {
  const parts = [
    `${o.title}.`,
    `Ofrecida por ${o.entityName}.`,
    `Modalidad ${o.modalityLabel.toLowerCase()}. ${o.validityText}.`,
    o.deadline ? `Cierra el ${spokenDate(o.deadline)}.` : 'Está abierta todo el año.',
    `De qué se trata: ${o.summaryPlain}`,
  ];
  if (o.requirements.length > 0) {
    parts.push(
      `Requisitos: ${o.requirements.map((req, i) => `${i + 1}. ${req.replace(/\.$/, '')}.`).join(' ')}`,
    );
  }
  parts.push('Para postularte, usa el botón Postularme en el sitio oficial.');
  return parts.join(' ');
}

/** Variantes de español en orden de preferencia (Colombia primero). */
const SPANISH_PREFERENCE = ['es-co', 'es-mx', 'es-us', 'es-419', 'es-es'];

/**
 * Elige la voz en español que el teléfono sí tiene instalada. Si ninguna
 * coincide exacto, toma cualquier voz "es". null si no hay voces en español.
 */
export function pickSpanishVoice<V extends { identifier: string; language: string }>(
  voices: readonly V[],
): V | null {
  const normalized = voices.map((voice) => ({
    voice,
    lang: voice.language.replace('_', '-').toLowerCase(),
  }));
  for (const preferred of SPANISH_PREFERENCE) {
    const match = normalized.find((v) => v.lang === preferred);
    if (match) return match.voice;
  }
  return normalized.find((v) => v.lang.startsWith('es'))?.voice ?? null;
}
