import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { sessionEnded } from './authSlice';

/**
 * elevated_token del step-up (decisión 0002): solo en memoria, nunca se
 * persiste. Dura 10 minutos y permite repetir una acción crítica sin volver a
 * pedir el código. Se borra al cerrar la sesión.
 */
export interface StepUpState {
  elevatedToken: string | null;
  /** Vencimiento en milisegundos Unix. */
  expiresAt: number | null;
}

const initialState: StepUpState = { elevatedToken: null, expiresAt: null };

/** Margen para no enviar un token que vence mientras viaja la petición. */
const EXPIRY_MARGIN_MS = 15_000;

export const stepUpSlice = createSlice({
  name: 'stepUp',
  initialState,
  reducers: {
    elevationGranted(
      _state,
      action: PayloadAction<{ elevatedToken: string; expiresAt: string }>,
    ) {
      return {
        elevatedToken: action.payload.elevatedToken,
        expiresAt: Date.parse(action.payload.expiresAt),
      };
    },
    elevationCleared() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(sessionEnded, () => initialState);
  },
});

export const { elevationGranted, elevationCleared } = stepUpSlice.actions;

/** Devuelve el elevated_token solo si sigue vigente en el momento `now`. */
export function validElevatedToken(
  state: StepUpState | undefined,
  now: number,
): string | null {
  if (!state?.elevatedToken || state.expiresAt === null) return null;
  return state.expiresAt - EXPIRY_MARGIN_MS > now ? state.elevatedToken : null;
}
