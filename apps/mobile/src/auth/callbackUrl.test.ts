import { parseCallbackUrl } from './callbackUrl';

describe('parseCallbackUrl', () => {
  it('lee el código y el state de la query', () => {
    expect(
      parseCallbackUrl('exp://192.168.0.10:8081/--/auth/callback?state=abc-_1&code=xyz'),
    ).toEqual({ code: 'xyz', state: 'abc-_1', error: null, errorDescription: null });
  });

  it('lee un error en el fragmento y decodifica el texto', () => {
    expect(
      parseCallbackUrl(
        'exp://host/--/auth/callback?state=abc#error=access_denied&error_description=El+usuario%20cancel%C3%B3',
      ),
    ).toEqual({
      code: null,
      state: 'abc',
      error: 'access_denied',
      errorDescription: 'El usuario canceló',
    });
  });

  it('una URL sin parámetros no tiene código ni state', () => {
    expect(parseCallbackUrl('exp://host/--/auth/callback')).toEqual({
      code: null,
      state: null,
      error: null,
      errorDescription: null,
    });
  });

  it('no falla con una codificación inválida', () => {
    expect(parseCallbackUrl('exp://h?code=%E0%A4%A&state=s').code).toBe('%E0%A4%A');
  });
});
