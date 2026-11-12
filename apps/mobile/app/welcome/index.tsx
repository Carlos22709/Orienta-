import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithGoogleAction, signOut } from '../../src/auth/actions';
import type { SignInOutcome } from '../../src/auth/googleSignIn';
import { useAppDispatch, useAppSelector } from '../../src/store';
import {
  selectAuthStatus,
  selectSessionUser,
  selectSignedOutReason,
  type SignedOutReason,
} from '../../src/store/authSlice';
import { minTouchTarget, spacing, typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

/** Mensajes en lenguaje claro para cada resultado del inicio de sesión. */
const SIGN_IN_MESSAGES: Record<Exclude<SignInOutcome, 'signed_in'>, string> = {
  cancelled: 'Cerraste el inicio de sesión. Puedes intentarlo de nuevo cuando quieras.',
  state_mismatch:
    'No pudimos confirmar que la respuesta era de tu inicio de sesión. Intenta de nuevo.',
  provider_error: 'Google no completó el inicio de sesión. Intenta de nuevo.',
  invalid: 'El inicio de sesión venció antes de terminar. Intenta de nuevo.',
  unavailable: 'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.',
  not_configured:
    'Falta configurar el inicio de sesión en esta copia de la app (variables de Supabase).',
};

/** Por qué no hay sesión al llegar a esta pantalla. */
const SIGNED_OUT_MESSAGES: Record<SignedOutReason, string> = {
  expired: 'Tu sesión terminó. Vuelve a iniciar sesión para continuar.',
  unavailable:
    'No pudimos recuperar tu sesión porque no hubo conexión. Intenta iniciar sesión de nuevo.',
  signedOut: 'Cerraste sesión.',
  deleted: 'Eliminamos tu cuenta y todos tus datos de Orienta+.',
};

/**
 * Pantalla de bienvenida, explicación del alcance y consentimiento.
 *
 * Diseñada para integrarse con los entregables de Laura y el flujo completo de Juan.
 * Explica qué hace Orienta+, qué NO hace y solicita consentimiento informado (Ley 1581 de 2012).
 */
export default function WelcomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [consented, setConsented] = useState(false);

  const toggleConsent = () => {
    const next = !consented;
    setConsented(next);
    AccessibilityInfo.announceForAccessibility(
      next ? 'Consentimiento marcado' : 'Consentimiento desmarcado',
    );
  };

  const dispatch = useAppDispatch();
  const authStatus = useAppSelector(selectAuthStatus);
  const user = useAppSelector(selectSessionUser);
  const signedOutReason = useAppSelector(selectSignedOutReason);
  const isSignedIn = authStatus === 'signedIn';
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInMessage, setSignInMessage] = useState<string | null>(null);

  // Mensaje visible: el del último intento o, si no hay, por qué no hay sesión.
  const notice =
    signInMessage ??
    (!isSignedIn && signedOutReason ? SIGNED_OUT_MESSAGES[signedOutReason] : null);

  const goToProfile = () => {
    // El perfil envía la aceptación al servidor junto con la versión vigente
    // del texto de consentimiento (GET /api/catalog).
    router.push({ pathname: '/profile', params: { consent: 'accepted' } });
  };

  const handleContinue = async () => {
    if (!consented || isSigningIn) return;
    if (isSignedIn) {
      goToProfile();
      return;
    }

    // Sin sesión: primero Google (PKCE), después el perfil.
    setIsSigningIn(true);
    setSignInMessage(null);
    const outcome = await dispatch(signInWithGoogleAction());
    setIsSigningIn(false);

    if (outcome === 'signed_in') {
      AccessibilityInfo.announceForAccessibility('Sesión iniciada');
      goToProfile();
      return;
    }
    setSignInMessage(SIGN_IN_MESSAGES[outcome]);
    AccessibilityInfo.announceForAccessibility(SIGN_IN_MESSAGES[outcome]);
  };

  const handleSignOut = async () => {
    setSignInMessage(null);
    await dispatch(signOut());
    AccessibilityInfo.announceForAccessibility(SIGNED_OUT_MESSAGES.signedOut);
  };

  const continueLabel = isSignedIn
    ? 'Continuar al perfil →'
    : isSigningIn
      ? 'Abriendo Google…'
      : 'Continuar con Google';
  const continueDisabled = !consented || isSigningIn || authStatus === 'restoring';

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Título y lema */}
        <Text
          accessibilityRole="header"
          style={[typography.screenTitle, { color: colors.text }]}
        >
          Bienvenido a Orienta+
        </Text>
        <Text style={[typography.body, styles.tagline, { color: colors.textMuted }]}>
          Oportunidades reales, claras y seguras para dar el siguiente paso.
        </Text>

        {/* Qué hace Orienta+ */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[typography.cardTitle, { color: colors.text }]}>
            ¿Qué hace Orienta+?
          </Text>
          <Text style={[typography.body, styles.cardText, { color: colors.text }]}>
            • Reúne oportunidades verificadas de empleo, formación, becas, subsidios y emprendimiento.{'\n'}
            • Recomienda solo cuatro o cinco opciones que se ajusten a tu perfil.{'\n'}
            • Te dirige al canal oficial de la entidad para realizar la postulación de forma segura.
          </Text>
        </View>

        {/* Qué NO hace Orienta+ */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[typography.cardTitle, { color: colors.text }]}>
            ¿Qué NO hace Orienta+?
          </Text>
          <Text style={[typography.body, styles.cardText, { color: colors.text }]}>
            • No recibe ni almacena hojas de vida.{'\n'}
            • No actúa como agencia de empleo ni gestiona contrataciones.{'\n'}
            • No cobra a jóvenes por servicios básicos ni comparte tus datos con terceros.
          </Text>
        </View>

        {/* Consentimiento informado (Ley 1581 de 2012) */}
        <Pressable
          accessible={true}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: consented }}
          accessibilityLabel="Acepto el uso de mis datos mínimos para generar recomendaciones personalizadas según la Ley 1581 de 2012"
          onPress={toggleConsent}
          style={[
            styles.consentBox,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.checkbox,
              {
                borderColor: consented ? colors.primary : colors.border,
                backgroundColor: consented ? colors.primary : colors.background,
              },
            ]}
          >
            {consented && (
              <Text style={[styles.checkmark, { color: colors.onPrimary }]}>✓</Text>
            )}
          </View>
          <Text style={[typography.body, styles.consentText, { color: colors.text }]}>
            Autorizo el uso de mis datos mínimos (edad, municipio, educación e intereses) con la única finalidad de recibir recomendaciones personalizadas de oportunidades.
          </Text>
        </Pressable>

        {/* Estado de la sesión o resultado del último intento (anunciado). */}
        {notice && (
          <View
            accessibilityLiveRegion="polite"
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[typography.body, { color: colors.text }]}>{notice}</Text>
          </View>
        )}

        {/* Botón de acción principal: Google si no hay sesión, perfil si la hay. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isSignedIn ? 'Continuar a configurar el perfil' : continueLabel
          }
          accessibilityHint={
            isSignedIn
              ? 'Abre la pantalla de captura del perfil'
              : 'Abre el navegador del sistema para iniciar sesión con tu cuenta de Google y luego el perfil'
          }
          accessibilityState={{ disabled: continueDisabled, busy: isSigningIn }}
          disabled={continueDisabled}
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.continueButton,
            {
              backgroundColor: colors.primary,
              opacity: continueDisabled ? 0.5 : pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={[typography.body, styles.continueText, { color: colors.onPrimary }]}>
            {continueLabel}
          </Text>
        </Pressable>

        {!consented && !isSignedIn && (
          <Text style={[typography.secondary, { color: colors.textMuted }]}>
            Marca la autorización para continuar.
          </Text>
        )}

        {isSignedIn && (
          <View style={styles.sessionRow}>
            <Text style={[typography.secondary, { color: colors.textMuted }]}>
              Sesión iniciada{user?.email ? ` como ${user.email}` : ''}.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityHint="Abre la verificación en dos pasos, la descarga de tus datos y la eliminación de tu cuenta"
              onPress={() => router.push('/account')}
              style={({ pressed }) => [
                styles.secondaryButton,
                { borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={[typography.body, styles.continueText, { color: colors.primary }]}>
                Mis datos y seguridad
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityHint="Cierra tu sesión en este dispositivo"
              onPress={handleSignOut}
              style={({ pressed }) => [
                styles.secondaryButton,
                { borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={[typography.body, styles.continueText, { color: colors.primary }]}>
                Cerrar sesión
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  tagline: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardText: {
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  consentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.lg,
    marginVertical: spacing.md,
    minHeight: minTouchTarget,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  consentText: {
    flex: 1,
    lineHeight: 22,
  },
  continueButton: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  continueText: {
    fontWeight: '700',
  },
  sessionRow: {
    gap: spacing.sm,
  },
  secondaryButton: {
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
});
