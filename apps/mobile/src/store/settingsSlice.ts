import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { clampTextScale, TEXT_SCALE } from '../theme/tokens';

/**
 * Ajustes de accesibilidad de la persona (pantalla Accesibilidad). Se guardan
 * en este teléfono (src/settings/persistence.ts) y no se borran al cerrar
 * sesión: son preferencias del dispositivo, no datos personales.
 */
export type ThemePreference = 'system' | 'light' | 'dark';

export interface SettingsState {
  theme: ThemePreference;
  /** Multiplicador del texto de la app (se suma al del sistema). */
  textScale: number;
  haptics: boolean;
  hydrated: boolean;
}

export const DEFAULT_SETTINGS: Omit<SettingsState, 'hydrated'> = {
  theme: 'system',
  textScale: TEXT_SCALE.default,
  haptics: true,
};

const initialState: SettingsState = { ...DEFAULT_SETTINGS, hydrated: false };

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    settingsHydrated(_state, action: PayloadAction<Partial<Omit<SettingsState, 'hydrated'>>>) {
      return {
        ...DEFAULT_SETTINGS,
        ...action.payload,
        textScale: clampTextScale(action.payload.textScale ?? DEFAULT_SETTINGS.textScale),
        hydrated: true,
      };
    },
    themeChanged(state, action: PayloadAction<ThemePreference>) {
      state.theme = action.payload;
    },
    textScaleChanged(state, action: PayloadAction<number>) {
      state.textScale = clampTextScale(action.payload);
    },
    hapticsChanged(state, action: PayloadAction<boolean>) {
      state.haptics = action.payload;
    },
    settingsReset(state) {
      Object.assign(state, DEFAULT_SETTINGS);
    },
  },
  selectors: {
    selectSettings: (state) => state,
  },
});

export const {
  settingsHydrated,
  themeChanged,
  textScaleChanged,
  hapticsChanged,
  settingsReset,
} = settingsSlice.actions;
export const { selectSettings } = settingsSlice.selectors;
