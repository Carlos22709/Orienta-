import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { minTouchTarget, spacing, typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

export interface OptionGroupProps {
  /** Pregunta del grupo; el lector la anuncia como encabezado. */
  title: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  /** single = una sola respuesta (radio); multiple = varias (checkbox). */
  mode: 'single' | 'multiple';
  selected: readonly string[];
  onToggle: (value: string) => void;
  /** Mensaje de error del campo, o null si no hay error. */
  error?: string | null;
}

/**
 * Grupo de opciones accesible del formulario de perfil.
 *
 * - Cada opción es un Pressable con rol radio o checkbox y su estado checked,
 *   para que VoiceOver y TalkBack anuncien "marcado" o "no marcado".
 * - La opción elegida se distingue con "✓" y borde grueso, además del color
 *   (WCAG 1.4.1, compromiso V2).
 * - Cada opción mide al menos 48 de alto (compromiso M1).
 * - El error se muestra junto a la pregunta, con ícono y texto, y se anuncia
 *   cuando aparece (accessibilityLiveRegion en Android).
 */
export function OptionGroup({
  title,
  options,
  mode,
  selected,
  onToggle,
  error = null,
}: OptionGroupProps) {
  const { colors } = useTheme();
  const role = mode === 'single' ? 'radio' : 'checkbox';

  return (
    <View style={styles.section}>
      <Text
        accessibilityRole="header"
        style={[typography.cardTitle, styles.title, { color: colors.text }]}
      >
        {title}
      </Text>
      {mode === 'multiple' && (
        <Text style={[typography.secondary, { color: colors.textMuted }]}>
          Puedes elegir varias opciones.
        </Text>
      )}

      <View
        accessibilityRole={mode === 'single' ? 'radiogroup' : undefined}
        accessibilityLabel={title}
        style={styles.options}
      >
        {options.map((option) => {
          const checked = selected.includes(option.value);
          return (
            <Pressable
              key={option.value}
              accessibilityRole={role}
              accessibilityState={{ checked }}
              accessibilityLabel={option.label}
              onPress={() => onToggle(option.value)}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: checked ? colors.primary : colors.surface,
                  borderColor: checked ? colors.primary : colors.border,
                  borderWidth: checked ? 2 : 1,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text
                style={[
                  typography.secondary,
                  styles.optionLabel,
                  { color: checked ? colors.onPrimary : colors.text },
                ]}
              >
                {checked ? '✓ ' : ''}
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error && (
        <Text
          accessibilityLiveRegion="polite"
          style={[typography.secondary, styles.error, { color: colors.danger }]}
        >
          ⚠ {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  title: {
    marginBottom: spacing.xs,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionLabel: {
    fontWeight: '600',
  },
  error: {
    fontWeight: '600',
  },
});
