import { combineSlices, configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { api } from './api';
import { authSlice } from './authSlice';

/**
 * Store global de Orienta+ (decisión 0003).
 *
 * - auth: sesión en memoria (access_token, persona, estado).
 * - api: caché de RTK Query.
 *
 * El stepUpSlice se agrega con las pantallas de verificación en dos pasos.
 */
const rootReducer = combineSlices(authSlice, api);

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
