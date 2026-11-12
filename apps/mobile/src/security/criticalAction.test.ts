import { NETWORK_MESSAGE, readApiError } from './apiError';
import {
  formatSecretForReading,
  STEP_UP_RESTARTED_MESSAGE,
  stepAfterActionError,
  stepAfterVerifyError,
} from './criticalAction';

/** Error con la forma que entrega RTK Query (FetchBaseQueryError). */
const apiError = (status: number, data: unknown) => readApiError({ status, data });

describe('readApiError', () => {
  it('lee el código, el mensaje y el stepUpToken de la API', () => {
    expect(
      apiError(403, {
        error: 'mfa_required',
        message: 'Confirma que eres tú.',
        stepUpToken: 'reto',
        expiresAt: '2026-11-11T00:05:00.000Z',
      }),
    ).toEqual({
      status: 403,
      code: 'mfa_required',
      message: 'Confirma que eres tú.',
      stepUpToken: 'reto',
    });
  });

  it('sin respuesta legible devuelve un error de red en lenguaje claro', () => {
    expect(readApiError({ status: 'FETCH_ERROR', error: 'TypeError' })).toEqual({
      status: null,
      code: 'network',
      message: NETWORK_MESSAGE,
    });
    expect(apiError(502, '<html>')).toMatchObject({ status: 502, code: 'network' });
  });
});

describe('stepAfterActionError', () => {
  it('403 mfa_required pide el código con el stepUpToken', () => {
    expect(
      stepAfterActionError(
        apiError(403, { error: 'mfa_required', message: 'm', stepUpToken: 'reto' }),
      ),
    ).toEqual({ kind: 'ask_code', stepUpToken: 'reto' });
  });

  it('403 mfa_enrollment_required lleva a activar el 2FA', () => {
    expect(
      stepAfterActionError(
        apiError(403, { error: 'mfa_enrollment_required', message: 'Actívala primero.' }),
      ),
    ).toEqual({ kind: 'needs_enrollment', message: 'Actívala primero.' });
  });

  it('cualquier otro error se muestra tal cual', () => {
    expect(stepAfterActionError(readApiError({ status: 'FETCH_ERROR' }))).toEqual({
      kind: 'failed',
      message: NETWORK_MESSAGE,
    });
  });
});

describe('stepAfterVerifyError', () => {
  it.each(['invalid_code', 'replay_detected', 'validation_error'])(
    '%s permite corregir el código sin perder el reto',
    (code) => {
      expect(stepAfterVerifyError(apiError(422, { error: code, message: 'm' }))).toEqual({
        kind: 'retry_code',
        message: 'm',
      });
    },
  );

  it('step_up_expired repite la acción para pedir un reto nuevo', () => {
    expect(
      stepAfterVerifyError(apiError(410, { error: 'step_up_expired', message: 'm' })),
    ).toEqual({ kind: 'restart_action', message: STEP_UP_RESTARTED_MESSAGE });
  });
});

describe('formatSecretForReading', () => {
  it('agrupa la clave de 4 en 4 sin espacio al final', () => {
    expect(formatSecretForReading('ABCDEFGHIJKLMNOPQRSTUVWXYZ234567')).toBe(
      'ABCD EFGH IJKL MNOP QRST UVWX YZ23 4567',
    );
    expect(formatSecretForReading('ABCDEF')).toBe('ABCD EF');
  });
});
