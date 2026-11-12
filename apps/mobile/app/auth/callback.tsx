import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { LoadingState } from '../../src/components/states/LoadingState';

/**
 * Destino de la redirección de Supabase después de Google
 * (.../--/auth/callback?state=...&code=...).
 *
 * El canje del código lo hace signInWithGoogle con la respuesta de
 * openAuthSessionAsync, no esta pantalla. Existe porque en Android el enlace
 * también puede llegar al router; aquí solo se vuelve a la pantalla anterior
 * para que no aparezca "ruta no encontrada".
 */
export default function AuthCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/welcome');
    }
  }, [router]);

  return (
    <LoadingState
      message="Completando el inicio de sesión…"
      accessibilityLabel="Completando el inicio de sesión, por favor espera"
    />
  );
}
