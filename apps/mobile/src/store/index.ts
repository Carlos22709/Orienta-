import { combineSlices, configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { api } from './api';
import { authSlice } from './authSlice';
import { stepUpSlice } from './stepUpSlice';

/**
 * Store global de Orienta+ (decisión 0003).
 *
 * - auth: sesión en memoria (access_token, persona, estado).
 * - stepUp: elevated_token del step-up, solo en memoria.
 * - api: caché de RTK Query.
 */
const rootReducer = combineSlices(authSlice, stepUpSlice, api);

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

// Hooks tipados para usar en los componentes en lugar de useDispatch/useSelector.
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
