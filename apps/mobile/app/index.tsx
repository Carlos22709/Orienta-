import { Redirect } from 'expo-router';
import React from 'react';
import { useAppSelector } from '../src/store';
import { useGetProfileQuery } from '../src/store/api';
import { selectAuthStatus } from '../src/store/authSlice';
import { Splash } from '../src/ui/Splash';

/**
 * Entrada de la app: decide a dónde ir.
 * - Sin sesión → bienvenida.
 * - Con sesión y perfil incompleto → cuestionario.
 * - Con sesión y perfil completo → "Para ti".
 */
export default function Entry() {
  const status = useAppSelector(selectAuthStatus);
  const profile = useGetProfileQuery(undefined, { skip: status !== 'signedIn' });

  if (status === 'signedOut') {
    return <Redirect href="/bienvenida" />;
  }
  if (status === 'signedIn' && profile.data) {
    const complete = profile.data.profile !== null && profile.data.missingFields.length === 0;
    return <Redirect href={complete ? '/para-ti' : '/cuestionario'} />;
  }
  if (status === 'signedIn' && profile.isError) {
    // Si no se pudo leer el perfil, se intenta mostrar las oportunidades; esa
    // pantalla ya explica el error y permite reintentar.
    return <Redirect href="/para-ti" />;
  }
  return <Splash />;
}
