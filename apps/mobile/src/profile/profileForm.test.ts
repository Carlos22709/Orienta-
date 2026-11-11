import {
  describeFields,
  EMPTY_FORM,
  formFromProfile,
  isValidBirthDate,
  readSaveProfileError,
  toggleInterest,
  toProfileUpdate,
  validateProfileForm,
  type StoredProfile,
} from './profileForm';

const STORED: StoredProfile = {
  birthDate: '2004-05-15',
  municipalityCode: '25175',
  educationLevel: 'secondary',
  experienceLevel: 'none',
  currentSituation: 'neither',
  interests: ['training'],
  availability: null,
  consentVersion: '2026-11-09',
  consentedAt: '2026-11-10T15:00:00.000Z',
};

describe('isValidBirthDate', () => {
  it('acepta una fecha AAAA-MM-DD que existe', () => {
    expect(isValidBirthDate('2004-05-15')).toBe(true);
    expect(isValidBirthDate('2004-02-29')).toBe(true); // año bisiesto
  });

  it('rechaza formatos distintos y fechas inexistentes', () => {
    expect(isValidBirthDate('15/05/2004')).toBe(false);
    expect(isValidBirthDate('2004-5-15')).toBe(false);
    expect(isValidBirthDate('2005-02-29')).toBe(false);
    expect(isValidBirthDate('2004-13-01')).toBe(false);
    expect(isValidBirthDate('')).toBe(false);
  });
});

describe('validateProfileForm', () => {
  it('no marca error en campos vacíos: el perfil se guarda por pasos', () => {
    expect(validateProfileForm(EMPTY_FORM)).toEqual({});
  });

  it('marca la fecha de nacimiento con formato inválido', () => {
    const errors = validateProfileForm({ ...EMPTY_FORM, birthDate: '2004-02-30' });
    expect(errors.birthDate).toContain('AAAA-MM-DD');
  });
});

describe('toProfileUpdate', () => {
  it('envía solo los campos respondidos', () => {
    const update = toProfileUpdate(
      { ...EMPTY_FORM, birthDate: ' 2004-05-15 ', municipalityCode: '11001' },
      null,
    );
    expect(update).toEqual({ birthDate: '2004-05-15', municipalityCode: '11001' });
  });

  it('incluye el consentimiento con la versión del catálogo si fue aceptado', () => {
    const update = toProfileUpdate(EMPTY_FORM, '2026-11-09');
    expect(update.consent).toEqual({ version: '2026-11-09', accepted: true });
  });

  it('no envía intereses vacíos (el servidor exige al menos uno)', () => {
    expect(toProfileUpdate(EMPTY_FORM, null).interests).toBeUndefined();
  });
});

describe('formFromProfile', () => {
  it('retoma el perfil guardado, incluidos los campos que faltan', () => {
    const form = formFromProfile(STORED);
    expect(form.birthDate).toBe('2004-05-15');
    expect(form.interests).toEqual(['training']);
    expect(form.availability).toBeNull();
  });

  it('devuelve el formulario vacío si no hay perfil', () => {
    expect(formFromProfile(null)).toEqual(EMPTY_FORM);
  });
});

describe('toggleInterest', () => {
  it('agrega y quita un interés sin modificar el arreglo original', () => {
    const original = ['employment'];
    expect(toggleInterest(original, 'training')).toEqual(['employment', 'training']);
    expect(toggleInterest(original, 'employment')).toEqual([]);
    expect(original).toEqual(['employment']);
  });
});

describe('describeFields', () => {
  it('nombra los campos en lenguaje claro', () => {
    expect(describeFields(['birthDate', 'interests'])).toBe(
      'Fecha de nacimiento, Intereses',
    );
  });
});

describe('readSaveProfileError', () => {
  it('lee los errores por campo de un 422', () => {
    const result = readSaveProfileError({
      status: 422,
      data: {
        error: 'validation_error',
        message: 'Revisa los datos marcados.',
        fields: { birthDate: 'Orienta+ está dirigida a personas de 18 a 29 años.' },
      },
    });
    expect(result).toEqual({
      kind: 'validation',
      message: 'Revisa los datos marcados.',
      fields: { birthDate: 'Orienta+ está dirigida a personas de 18 a 29 años.' },
    });
  });

  it('reconoce que falta el consentimiento (409)', () => {
    const result = readSaveProfileError({
      status: 409,
      data: { error: 'consent_required', message: 'Acepta el tratamiento de datos.' },
    });
    expect(result.kind).toBe('consent_required');
  });

  it('reconoce la sesión inválida (401)', () => {
    expect(readSaveProfileError({ status: 401, data: null }).kind).toBe('unauthorized');
  });

  it('trata la falta de respuesta como error de red', () => {
    const result = readSaveProfileError({ status: 'FETCH_ERROR', error: 'Network request failed' });
    expect(result.kind).toBe('network');
    expect(result.message).toContain('Revisa tu conexión');
  });
});
