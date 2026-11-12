import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, Text, TextInput, View } from 'react-native';
import { minTouchTarget, spacing, typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

export interface CodeInputProps {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit?: () => void;
  error?: string | null;
  autoFocus?: boolean;
}

/**
 * Campo del código de 6 dígitos de la app autenticadora.
 *
 * Accesibilidad (decisión 0002, sección 6; WCAG 2.2, criterio 3.3.8):
 * - acepta pegar el código, también con espacios ("123 456"); el servidor
 *   los ignora, por eso no se limita la longitud;
 * - teclado numérico y autocompletado de códigos de un solo uso en iOS
 *   (oneTimeCode) y Android (one-time-code);
 * - etiqueta visible y para el lector de pantalla; el error se muestra con
 *   ícono, no solo con color, y se anuncia.
 */
export function CodeInput({
  value,
  onChangeText,
  onSubmit,
  error,
  autoFocus = false,
}: CodeInputProps) {
  const { colors } = useTheme();

  useEffect(() => {
    if (error) {
      AccessibilityInfo.announceForAccessibility(error);
    }
  }, [error]);

  return (
    <View style={styles.container}>
      <Text style={[typography.body, styles.label, { color: colors.text }]}>
        Código de 6 dígitos
      </Text>
      <TextInput
        accessibilityLabel="Código de 6 dígitos"
        accessibilityHint="Escríbelo o pégalo desde tu app autenticadora"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        autoFocus={autoFocus}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        autoCorrect={false}
        returnKeyType="done"
        placeholder="123 456"
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.background,
            borderColor: error ? colors.danger : colors.border,
          },
        ]}
      />
      {error ? (
        <View style={styles.error}>
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <Text style={[typography.secondary, styles.errorText, { color: colors.danger }]}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  error: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  errorText: { flex: 1 },
  label: {
    fontWeight: '600',
  },
  input: {
    minHeight: minTouchTarget,
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    fontSize: 24,
    letterSpacing: 4,
  },
});
