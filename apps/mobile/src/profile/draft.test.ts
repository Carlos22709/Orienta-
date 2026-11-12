import { hasAnswers, parseDraft } from './draft';
import { EMPTY_FORM } from './profileForm';

describe('borrador del cuestionario', () => {
  const draft = {
    form: { ...EMPTY_FORM, birthDate: '2007-03-14', municipalityCode: '25175' },
    stepIndex: 2,
    consentAccepted: false,
  };

  it('recupera un borrador guardado tal como estaba', () => {
    expect(parseDraft(JSON.stringify(draft))).toEqual(draft);
  });

  it('descarta lo que no tiene el formato esperado en lugar de fallar', () => {
    expect(parseDraft(null)).toBeNull();
    expect(parseDraft('no es json')).toBeNull();
    expect(parseDraft(JSON.stringify({ form: {}, stepIndex: -1 }))).toBeNull();
  });

  it('solo vale la pena retomar si hay alguna respuesta', () => {
    expect(hasAnswers(EMPTY_FORM)).toBe(false);
    expect(hasAnswers(draft.form)).toBe(true);
  });
});
