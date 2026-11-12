import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { finishAccountDeletion } from '../../src/auth/actions';
import { StepUpModal } from '../../src/components/StepUpModal';
import { useCriticalAction } from '../../src/security/useCriticalAction';
import { useAppDispatch, useAppSelector } from '../../src/store';
import {
  useDeleteAccountMutation,
  useExportMyDataMutation,
  useGetMfaStatusQuery,
} from '../../src/store/api';
import { selectAuthStatus } from '../../src/store/authSlice';
import { fonts, minTouchTarget, spacing, typography } from '../../src/theme/tokens';
import { BackButton } from '../../src/ui/layout';
import { notifyError, notifySuccess, notifyWarning } from '../../src/ui/feedback';
import { useTheme } from '../../src/theme/useTheme';

/**
 * Mis datos y seguridad: verificación en dos pasos y los derechos de la Ley
 * 1581 de 2012 sobre los propios datos (exportar y eliminar). Exportar y
 * eliminar piden el código de la app autenticadora (step-up, decisión 0002).
 */
export default function AccountScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isSignedIn = useAppSelector(selectAuthStatus) === 'signedIn';

  const mfaStatus = useGetMfaStatusQuery(undefined, { skip: !isSignedIn });
  const [exportMyData] = useExportMyDataMutation();
  const [deleteAccount] = useDeleteAccountMutation();

  const exportAction = useCriticalAction(
    useCallback(() => exportMyData().unwrap(), [exportMyData]),
  );
  const deleteAction = useCriticalAction(
    useCallback(() => deleteAccount().unwrap(), [deleteAccount]),
  );
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Exportación lista: se abre el menú del sistema para guardar o compartir.
  useEffect(() => {
    if (exportAction.phase !== 'done' || !exportAction.result) return;
    notifySuccess('Tus datos están listos');
    void Share.share({
      title: 'Mis datos de Orienta+',
      message: JSON.stringify(exportAction.result, null, 2),
    });
  }, [exportAction.phase, exportAction.result]);

  // Cuenta eliminada: se limpia el dispositivo y se vuelve a la bienvenida.
  useEffect(() => {
    if (deleteAction.phase !== 'done') return;
    void dispatch(finishAccountDeletion()).then(() => router.replace('/bienvenida'));
  }, [deleteAction.phase, dispatch, router]);

  // Mensajes de resultado para el lector de pantalla.
  const notice = exportAction.isAskingCode || deleteAction.isAskingCode
    ? null
    : (deleteAction.message ?? exportAction.message);
  useEffect(() => {
    if (notice) notifyError(notice);
  }, [notice]);

  const needsEnrollment =
    exportAction.phase === 'needs_enrollment' || deleteAction.phase === 'needs_enrollment';

  if (!isSignedIn) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.text }]}>
            Mis datos y seguridad
          </Text>
          <Text style={[typography.body, { color: colors.text }]}>
            Inicia sesión para ver y administrar tus datos.
          </Text>
          <PrimaryButton label="Ir a la bienvenida" onPress={() => router.replace('/bienvenida')} />
        </View>
      </SafeAreaView>
    );
  }

  const enrolled = mfaStatus.data?.enrolled === true;
  const activeAction = deleteAction.isAskingCode ? deleteAction : exportAction;
  const busyExport = exportAction.phase === 'running' && !exportAction.isAskingCode;
  const busyDelete = deleteAction.phase === 'running' && !deleteAction.isAskingCode;

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <BackButton />
        <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.text }]}>
          Mis datos y seguridad
        </Text>

        {notice ? (
          <View
            accessibilityLiveRegion="polite"
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[typography.body, { color: colors.text }]}>{notice}</Text>
            {needsEnrollment && (
              <PrimaryButton
                label="Activar verificación en dos pasos"
                onPress={() => router.push('/perfil/seguridad')}
              />
            )}
          </View>
        ) : null}

        {/* Verificación en dos pasos */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text accessibilityRole="header" style={[typography.cardTitle, { color: colors.text }]}>
            Verificación en dos pasos
          </Text>
          <Text style={[typography.body, { color: colors.text }]}>
            {mfaStatus.isLoading
              ? 'Consultando…'
              : mfaStatus.isError
                ? 'No pudimos consultar el estado. Revisa tu conexión.'
                : enrolled
                  ? 'Activa. Te pediremos un código antes de descargar o eliminar tus datos.'
                  : 'Inactiva. Actívala para poder descargar o eliminar tus datos de forma segura.'}
          </Text>
          {!enrolled && !mfaStatus.isLoading && (
            <PrimaryButton
              label={mfaStatus.isError ? 'Reintentar' : 'Activar'}
              hint="Abre los pasos para conectar tu app autenticadora"
              onPress={() =>
                mfaStatus.isError ? mfaStatus.refetch() : router.push('/perfil/seguridad')
              }
            />
          )}
        </View>

        {/* Descargar mis datos */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text accessibilityRole="header" style={[typography.cardTitle, { color: colors.text }]}>
            Descargar mis datos
          </Text>
          <Text style={[typography.body, { color: colors.text }]}>
            Recibe una copia de todo lo que Orienta+ guarda sobre ti: tu cuenta, tu perfil y las
            oportunidades que abriste.
          </Text>
          <PrimaryButton
            label={busyExport ? 'Preparando…' : 'Descargar mis datos'}
            hint="Te pedirá el código de tu app autenticadora y luego abrirá el menú para guardar o compartir"
            busy={busyExport}
            onPress={() => void exportAction.run()}
          />
        </View>

        {/* Eliminar mi cuenta */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.danger }]}>
          <Text accessibilityRole="header" style={[typography.cardTitle, { color: colors.text }]}>
            Eliminar mi cuenta
          </Text>
          <Text style={[typography.body, { color: colors.text }]}>
            Borra tu cuenta, tu perfil y tu historial. No se puede deshacer.
          </Text>
          {confirmingDelete ? (
            <>
              <Text style={[typography.body, styles.strong, { color: colors.danger }]}>
                ¿Seguro que quieres eliminar tu cuenta y todos tus datos?
              </Text>
              <DangerButton
                label={busyDelete ? 'Eliminando…' : 'Sí, eliminar mi cuenta'}
                busy={busyDelete}
                onPress={() => void deleteAction.run()}
              />
              <SecondaryButton label="No, conservar mi cuenta" onPress={() => setConfirmingDelete(false)} />
            </>
          ) : (
            <SecondaryButton
              label="Eliminar mi cuenta"
              hint="Te pedirá confirmar antes de borrar"
              onPress={() => {
                setConfirmingDelete(true);
                notifyWarning('¿Seguro que quieres eliminar tu cuenta y todos tus datos?');
              }}
            />
          )}
        </View>
      </ScrollView>

      <StepUpModal
        visible={activeAction.isAskingCode}
        actionDescription={
          activeAction === deleteAction ? 'eliminar tu cuenta' : 'descargar tus datos'
        }
        isVerifying={activeAction.isBusy}
        codeError={activeAction.codeError}
        notice={activeAction.message}
        onSubmit={(code) => void activeAction.submitCode(code)}
        onCancel={activeAction.cancel}
      />
    </SafeAreaView>
  );
}

interface ButtonProps {
  label: string;
  hint?: string;
  busy?: boolean;
  onPress: () => void;
}

function PrimaryButton({ label, hint, busy = false, onPress }: ButtonProps) {
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
        { backgroundColor: colors.primary, opacity: busy ? 0.7 : pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={[typography.body, styles.strong, { color: colors.onPrimary }]}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, hint, onPress }: ButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles.outlined,
        { borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={[typography.body, styles.strong, { color: colors.primary }]}>{label}</Text>
    </Pressable>
  );
}

function DangerButton({ label, busy = false, onPress }: ButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Te pedirá el código de tu app autenticadora y luego borrará todo"
      accessibilityState={{ disabled: busy, busy }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles.outlined,
        { borderColor: colors.danger, opacity: busy ? 0.7 : pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={[typography.body, styles.strong, { color: colors.danger }]}>{label}</Text>
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
  button: {
    minHeight: minTouchTarget,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  outlined: {
    borderWidth: 1,
  },
  strong: {
    fontFamily: fonts.bold,
  },
});
