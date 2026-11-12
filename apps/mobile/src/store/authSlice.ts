import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SessionUser } from '../auth/authClient';

/**
 * Estado de la sesión (decisiones 0002 y 0003).
 *
 * Aquí vive el access_token, solo en memoria: nunca se persiste. El
 * refresh_token no entra a Redux; está únicamente en expo-secure-store.
 *
 * - restoring: la app acaba de abrir y está intentando renovar la sesión.
 * - signedIn: hay un access_token vigente o renovable.
 * - signedOut: no hay sesión; signedOutReason explica por qué, para mostrar
 *   un mensaje accesible en la bienvenida.
 */
export type AuthStatus = 'restoring' | 'signedIn' | 'signedOut';

/**
 * - expired: Supabase rechazó la renovación; hay que volver a entrar.
 * - unavailable: no se pudo contactar a Supabase; se puede reintentar.
 * - signedOut: la persona cerró sesión.
 * - deleted: la persona eliminó su cuenta y sus datos.
 */
export type SignedOutReason = 'expired' | 'unavailable' | 'signedOut' | 'deleted';

export interface AuthState {
  status: AuthStatus;
  accessToken: string | null;
  expiresAt: number | null;
  user: SessionUser | null;
  signedOutReason: SignedOutReason | null;
}

const initialState: AuthState = {
  status: 'restoring',
  accessToken: null,
  expiresAt: null,
  user: null,
  signedOutReason: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionStarted(
      state,
      action: PayloadAction<{
        accessToken: string;
        expiresAt: number;
        user: SessionUser;
      }>,
    ) {
      state.status = 'signedIn';
      state.accessToken = action.payload.accessToken;
      state.expiresAt = action.payload.expiresAt;
      state.user = action.payload.user;
      state.signedOutReason = null;
    },
    sessionEnded(_state, action: PayloadAction<SignedOutReason | null>) {
      return {
        ...initialState,
        status: 'signedOut',
        signedOutReason: action.payload,
      };
    },
  },
  selectors: {
    selectAuthStatus: (state) => state.status,
    selectAccessToken: (state) => state.accessToken,
    selectSessionUser: (state) => state.user,
    selectSignedOutReason: (state) => state.signedOutReason,
  },
});

export const { sessionStarted, sessionEnded } = authSlice.actions;
export const {
  selectAuthStatus,
  selectAccessToken,
  selectSessionUser,
  selectSignedOutReason,
} = authSlice.selectors;
