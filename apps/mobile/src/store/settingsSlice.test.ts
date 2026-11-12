import { sessionEnded } from './authSlice';
import {
  DEFAULT_SETTINGS,
  settingsHydrated,
  settingsReset,
  settingsSlice,
  textScaleChanged,
  themeChanged,
} from './settingsSlice';

const reducer = settingsSlice.reducer;

describe('settingsSlice', () => {
  it('al leer lo guardado completa lo que falte con los valores por defecto', () => {
    expect(reducer(undefined, settingsHydrated({ theme: 'dark' }))).toEqual({
      ...DEFAULT_SETTINGS,
      theme: 'dark',
      hydrated: true,
    });
  });

  it('el tamaño de texto nunca sale del rango permitido', () => {
    expect(reducer(undefined, textScaleChanged(9)).textScale).toBe(1.6);
    expect(reducer(undefined, settingsHydrated({ textScale: 0.1 })).textScale).toBe(0.85);
  });

  it('restablecer vuelve a los valores por defecto sin perder la hidratación', () => {
    let state = reducer(undefined, settingsHydrated({}));
    state = reducer(state, themeChanged('dark'));
    state = reducer(state, textScaleChanged(1.4));
    state = reducer(state, settingsReset());
    expect(state).toEqual({ ...DEFAULT_SETTINGS, hydrated: true });
  });

  it('cerrar sesión no borra las preferencias del dispositivo', () => {
    const state = reducer(reducer(undefined, themeChanged('light')), sessionEnded('signedOut'));
    expect(state.theme).toBe('light');
  });
});
