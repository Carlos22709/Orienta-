import { EMPTY_FORM } from './profileForm';
import {
  ageOn,
  birthDateBounds,
  firstIncompleteStep,
  formatBirthDate,
  isStepComplete,
  STEPS,
  toIsoDate,
} from './questionnaire';

const TODAY = new Date(2026, 10, 12, 10); // 12 de noviembre de 2026

describe('cuestionario', () => {
  it('la rueda de fecha solo permite edades de 18 a 29 años', () => {
    const { minimum, maximum } = birthDateBounds(TODAY);

    expect(toIsoDate(maximum)).toBe('2008-11-12');
    expect(ageOn(toIsoDate(maximum), TODAY)).toBe(18);
    expect(toIsoDate(minimum)).toBe('1996-11-13');
    expect(ageOn(toIsoDate(minimum), TODAY)).toBe(29);
  });

  it('calcula la edad según si ya pasó el cumpleaños', () => {
    expect(ageOn('2007-03-14', TODAY)).toBe(19);
    expect(ageOn('2007-12-01', TODAY)).toBe(18);
  });

  it('muestra la fecha en español', () => {
    expect(formatBirthDate('2007-03-14')).toBe('14 de marzo de 2007');
  });

  it('retoma en el primer paso sin responder', () => {
    expect(firstIncompleteStep(EMPTY_FORM, false)).toBe(0);
    const partial = { ...EMPTY_FORM, birthDate: '2007-03-14', municipalityCode: '25175' };
    expect(STEPS[firstIncompleteStep(partial, false)]).toBe('educationLevel');
  });

  it('intereses exige al menos uno y el consentimiento exige aceptarlo', () => {
    expect(isStepComplete('interests', EMPTY_FORM, false)).toBe(false);
    expect(isStepComplete('interests', { ...EMPTY_FORM, interests: ['training'] }, false)).toBe(true);
    expect(isStepComplete('consent', EMPTY_FORM, false)).toBe(false);
    expect(isStepComplete('consent', EMPTY_FORM, true)).toBe(true);
  });
});
