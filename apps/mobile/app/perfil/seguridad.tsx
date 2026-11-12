import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  AccessibilityInfo,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CodeInput } from '../../src/components/CodeInput';
import { LoadingState } from '../../src/components/states/LoadingState';
import { readApiError } from '../../src/security/apiError';
import { formatSecretForReading } from '../../src/security/criticalAction';
import { useAppSelector } from '../../src/store';
import {
  type MfaEnrollment,
  useConfirmMfaEnrollmentMutation,
  useGetMfaStatusQuery,
  useStartMfaEnrollmentMutation,
} from '../../src/store/api';
import { selectAuthStatus } from '../../src/store/authSlice';
import { fonts, minTouchTarget, scaled, spacing, typography } from '../../src/theme/tokens';
import { BackButton } from '../../src/ui/layout';
import { notifyError, notifySuccess } from '../../src/ui/feedback';
import { useTheme } from '../../src/theme/useTheme';

/**
 * Activación de la verificación en dos pasos (decisión 0002, sección 4).
 *
 * 1. POST /mfa/enroll entrega la clave una sola vez. Se guarda solo en el
 *    estado de esta pantalla: al salir, desaparece de la app.
 * 2. La persona la agrega a su app autenticadora: abriéndola directamente
 *    (mismo teléfono), escaneando el QR (otro dispositivo) o copiando la
 *    clave (alternativa textual al QR).
 * 3. POST /mfa/enroll/confirm activa el 2FA con un primer código válido.
 */
export default function TwoFactorScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const isSignedIn = useAppSelector(selectAuthStatus) === 'signedIn';

  const status = useGetMfaStatusQuery(undefined, { skip: !isSignedIn });
  const [startEnrollment, start] = useStartMfaEnrollmentMutation();
  const [confirmEnrollment, confirm] = useConfirmMfaEnrollmentMutation();

  const [enrollment, setEnrollment] = useState<MfaEnrollment | null>(null);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [activated, setActivated] = useState(false);

  const announce = (text: string, tone: 'error' | 'success' = 'error') => {
    setNotice(text);
    if (tone === 'success') notifySuccess(text);
    else notifyError(text);
  };

  const handleStart = async () => {
    setNotice(null);
    try {
      setEnrollment(await startEnrollment().unwrap());
      AccessibilityInfo.announceForAccessibility(
        'Clave lista. Agrégala a tu app autenticadora.',
      );
    } catch (error) {
      announce(readApiError(error).message);
    }
  };

  const handleOpenAuthenticator = async () => {
    if (!enrollment) return;
    try {
      await Linking.openURL(enrollment.otpauthUri);
    } catch {
      announce(
        'No encontramos una app autenticadora en este teléfono. Instala una (por ejemplo, Google Authenticator) o copia la clave.',
      );
    }
  };

  const handleCopy = async () => {
    if (!enrollment) return;
    await Clipboard.setStringAsync(enrollment.secret);
    announce('Clave copiada. Pégala en tu app autenticadora.', 'success');
  };

  const handleConfirm = async () => {
    if (!code.trim() || confirm.isLoading) return;
    setCodeError(null);
    try {
      await confirmEnrollment({ code }).unwrap();
      setEnrollment(null);
      setActivated(true);
      notifySuccess('Verificación en dos pasos activada');
    } catch (error) {
      const apiError = readApiError(error);
      if (apiError.code === 'invalid_code' || apiError.code === 'validation_error') {
        setCodeError(apiError.message);
      } else {
        announce(apiError.message);
      }
    }
  };

  if (!isSignedIn || status.isLoading) {
    return (
      <LoadingState
        message="Consultando la verificación en dos pasos…"
        accessibilityLabel="Consultando la verificación en dos pasos, por favor espera"
      />
    );
  }

  const alreadyActive = activated || status.data?.enrolled === true;

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <BackButton />
        <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.text }]}>
          Verificación en dos pasos
        </Text>

        {notice ? (
          <View
            accessibilityLiveRegion="polite"
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[typography.body, { color: colors.text }]}>{notice}</Text>
          </View>
        ) : null}

        {alreadyActive ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.success }]}>
            <Text style={[typography.cardTitle, { color: colors.text }]}>Está activa</Text>
            <Text style={[typography.body, { color: colors.text }]}>
              Antes de descargar o eliminar tus datos te pediremos el código de tu app
              autenticadora.
            </Text>
            <Button label="Volver" onPress={() => router.back()} />
          </View>
        ) : !enrollment ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[typography.body, { color: colors.text }]}>
              Protege tus datos con un código que cambia cada 30 segundos. Necesitas una app
              autenticadora gratuita, como Google Authenticator o Microsoft Authenticator.
            </Text>
            <Button
              label={start.isLoading ? 'Preparando…' : 'Empezar'}
              busy={start.isLoading}
              onPress={() => void handleStart()}
            />
          </View>
        ) : (
          <>
            {/* Paso 1: agregar Orienta+ a la app autenticadora. */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text accessibilityRole="header" style={[typography.cardTitle, { color: colors.text }]}>
                Paso 1. Agrega Orienta+ a tu app autenticadora
              </Text>
              <Button
                label="Abrir en mi app autenticadora"
                hint="Abre tu app autenticadora con la clave de Orienta+ ya escrita"
                onPress={() => void handleOpenAuthenticator()}
              />

              <Text style={[typography.body, { color: colors.text }]}>
                Si tu app autenticadora está en otro dispositivo, escanea este código:
              </Text>
              <View
                accessible
                accessibilityRole="image"
                accessibilityLabel="Código QR con la clave de Orienta+. Si no puedes escanearlo, usa la clave escrita debajo."
                style={styles.qr}
              >
                {/* Fondo blanco y margen: los lectores de QR lo necesitan en ambos temas. */}
                <QRCode value={enrollment.otpauthUri} size={200} quietZone={12} />
              </View>

              <Text style={[typography.body, { color: colors.text }]}>
                O escribe esta clave en tu app autenticadora:
              </Text>
              <Text
                selectable
                accessibilityLabel={`Clave: ${enrollment.secret.split('').join(' ')}`}
                style={[styles.secret, { color: colors.text, borderColor: colors.border, fontSize: scaled(20), lineHeight: scaled(30) }]}
              >
                {formatSecretForReading(enrollment.secret)}
              </Text>
              <Button label="Copiar clave" outlined onPress={() => void handleCopy()} />
            </View>

            {/* Paso 2: confirmar con el primer código. */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text accessibilityRole="header" style={[typography.cardTitle, { color: colors.text }]}>
                Paso 2. Escribe el código que aparece
              </Text>
              <CodeInput
                value={code}
                onChangeText={setCode}
                onSubmit={() => void handleConfirm()}
                error={codeError}
              />
              <Button
                label={confirm.isLoading ? 'Activando…' : 'Activar'}
                busy={confirm.isLoading}
                onPress={() => void handleConfirm()}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface ButtonProps {
  label: string;
  hint?: string;
  busy?: boolean;
  outlined?: boolean;
  onPress: () => void;
}

function Button({ label, hint, busy = false, outlined = false, onPress }: ButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={hint}
      accessibilityState={{ disabled: busy, busy }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        outlined
          ? { borderWidth: 1, borderColor: colors.border }
          : { backgroundColor: colors.primary },
        { opacity: busy ? 0.7 : pressed ? 0.85 : 1 },
      ]}
    >
      <Text
        style={[
          typography.body,
          styles.strong,
          { color: outlined ? colors.primary : colors.onPrimary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  card: {
    borderWidth: 1,
    borderRadius: 22,
    padding: spacing.lg,
    gap: spacing.md,
  },
  qr: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    padding: spacing.sm,
    borderRadius: 16,
  },
  secret: {
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
    fontSize: 20,
    lineHeight: 30,
    letterSpacing: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    textAlign: 'center',
  },
  button: {
    minHeight: minTouchTarget,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  strong: {
    fontFamily: fonts.bold,
  },
});
