import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';
import type { AppDispatch, RootState } from '../store';
import { settingsHydrated } from '../store/settingsSlice';

/** Guarda los ajustes de accesibilidad en el teléfono. */
const KEY = 'orienta.settings.v1';

const storedSchema = z
  .object({
    theme: z.enum(['system', 'light', 'dark']),
    textScale: z.number(),
    haptics: z.boolean(),
  })
  .partial();

export async function loadSettings(dispatch: AppDispatch): Promise<void> {
  let stored = {};
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = storedSchema.safeParse(raw ? JSON.parse(raw) : {});
    if (parsed.success) stored = parsed.data;
  } catch {
    // Sin almacenamiento, se usan los valores por defecto.
  }
  dispatch(settingsHydrated(stored));
}

/** Escribe los ajustes cada vez que cambian. Devuelve la función para dejar de escuchar. */
export function persistSettings(store: {
  getState: () => RootState;
  subscribe: (listener: () => void) => () => void;
}): () => void {
  let last = store.getState().settings;
  return store.subscribe(() => {
    const current = store.getState().settings;
    if (!current.hydrated || current === last) return;
    last = current;
    const { theme, textScale, haptics } = current;
    AsyncStorage.setItem(KEY, JSON.stringify({ theme, textScale, haptics })).catch(() => {});
  });
}
