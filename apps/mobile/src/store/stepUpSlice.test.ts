import { sessionEnded } from './authSlice';
import {
  elevationGranted,
  stepUpSlice,
  validElevatedToken,
} from './stepUpSlice';

const reducer = stepUpSlice.reducer;
const GRANTED = elevationGranted({
  elevatedToken: 'elevado',
  expiresAt: '2026-11-11T12:10:00.000Z',
});
const EXPIRES = Date.parse('2026-11-11T12:10:00.000Z');

describe('stepUpSlice', () => {
  it('guarda el token elevado con su vencimiento', () => {
    expect(reducer(undefined, GRANTED)).toEqual({
      elevatedToken: 'elevado',
      expiresAt: EXPIRES,
    });
  });

  it('el token solo se usa mientras está vigente, con margen', () => {
    const state = reducer(undefined, GRANTED);

    expect(validElevatedToken(state, EXPIRES - 60_000)).toBe('elevado');
    expect(validElevatedToken(state, EXPIRES - 5_000)).toBeNull();
    expect(validElevatedToken(state, EXPIRES + 1)).toBeNull();
  });

  it('al cerrar la sesión se borra', () => {
    const state = reducer(reducer(undefined, GRANTED), sessionEnded('signedOut'));

    expect(state.elevatedToken).toBeNull();
    expect(validElevatedToken(state, 0)).toBeNull();
  });
});
