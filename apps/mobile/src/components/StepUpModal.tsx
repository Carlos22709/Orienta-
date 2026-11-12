import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { minTouchTarget, spacing, typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { CodeInput } from './CodeInput';

export interface StepUpModalProps {
  visible: boolean;
  /** Qué se va a hacer, en lenguaje claro: "descargar tus datos". */
  actionDescription: string;
  isVerifying: boolean;
  codeError: string | null;
  notice: string | null;
  onSubmit: (code: string) => void;
  onCancel: () => void;
}

/**
 * Ventana de verificación del step-up (decisión 0002, sección 5): pide el
 * código de la app autenticadora antes de una acción crítica.
 *
 * No muestra cuenta regresiva ni corta el tiempo: si el reto vence, la app
 * pide uno nuevo y la ventana sigue abierta (compromiso de la Fase 2).
 */
export function StepUpModal({
  visible,
  actionDescription,
  isVerifying,
  codeError,
  notice,
  onSubmit,
  onCancel,
}: StepUpModalProps) {
  const { colors } = useTheme();
  const [code, setCode] = useState('');

  // Cada vez que se abre, empieza vacía.
  useEffect(() => {
    if (visible) setCode('');
  }, [visible]);

  const canSubmit = code.replace(/\s/g, '').length > 0 && !isVerifying;
  const submit = () => {
    if (canSubmit) onSubmit(code);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      {/* accessibilityViewIsModal: VoiceOver no sale de la ventana hasta cerrarla (M2). */}
      <SafeAreaView
        accessibilityViewIsModal
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text
            accessibilityRole="header"
            style={[typography.screenTitle, { color: colors.text }]}
          >
            Confirma que eres tú
          </Text>
          <Text style={[typography.body, { color: colors.text }]}>
            Para {actionDescription}, escribe el código que muestra ahora tu app
            autenticadora para Orienta+.
          </Text>

          {notice ? (
            <View
              accessibilityLiveRegion="polite"
              style={[styles.notice, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[typography.body, { color: colors.text }]}>{notice}</Text>
            </View>
          ) : null}

          <CodeInput
            value={code}
            onChangeText={setCode}
            onSubmit={submit}
            error={codeError}
            autoFocus
          />

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSubmit, busy: isVerifying }}
            disabled={!canSubmit}
            onPress={submit}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: colors.primary,
                opacity: !canSubmit ? 0.5 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[typography.body, styles.buttonText, { color: colors.onPrimary }]}>
              {isVerifying ? 'Verificando…' : 'Confirmar'}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityHint="Cierra esta ventana sin hacer la acción"
            onPress={onCancel}
            style={({ pressed }) => [
              styles.button,
              styles.secondary,
              { borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[typography.body, styles.buttonText, { color: colors.primary }]}>
              Cancelar
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  notice: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.lg,
  },
  button: {
    minHeight: minTouchTarget,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  secondary: {
    borderWidth: 1,
  },
  buttonText: {
    fontWeight: '700',
  },
});
