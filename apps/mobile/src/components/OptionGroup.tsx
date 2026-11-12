import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { minTouchTarget, radius, spacing, typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

export interface OptionGroupProps {
  /** Pregunta del grupo; el lector la anuncia como encabezado. */
  title: string;
  /** Oculta el título visible cuando la pantalla ya muestra la pregunta. */
  hideTitle?: boolean;
  options: ReadonlyArray<{ value: string; label: string }>;
  /** single = una sola respuesta (radio); multiple = varias (checkbox). */
  mode: 'single' | 'multiple';
  selected: readonly string[];
  onToggle: (value: string) => void;
  /** Mensaje de error del campo, o null si no hay error. */
  error?: string | null;
}

/**
 * Grupo de opciones accesible (creado por Laura para el formulario de perfil;
 * rediseño Amanecer en filas de ancho completo).
 *
 * - Cada opción es un Pressable con rol radio o checkbox y su estado checked,
 *   para que VoiceOver y TalkBack anuncien "marcado" o "no marcado".
 * - La opción elegida se distingue con ícono y borde grueso, además del color
 *   (WCAG 1.4.1, compromiso V2).
 * - Cada opción mide al menos 48 de alto (compromiso M1).
 * - El error se muestra junto a la pregunta, con ícono y texto, y se anuncia
 *   cuando aparece (accessibilityLiveRegion en Android).
 */
export function OptionGroup({
  title,
  hideTitle = false,
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
      {!hideTitle && (
        <Text accessibilityRole="header" style={[typography.cardTitle, { color: colors.text }]}>
          {title}
        </Text>
      )}
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
          const icon = mode === 'single'
            ? checked ? 'radio-button-on' : 'radio-button-off'
            : checked ? 'checkbox' : 'square-outline';
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
                  backgroundColor: checked ? colors.chip : colors.surface,
                  borderColor: checked ? colors.primary : colors.divider,
                  borderWidth: checked ? 2 : 1,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Ionicons
                name={icon}
                size={22}
                color={checked ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  checked ? typography.bodyStrong : typography.body,
                  styles.optionLabel,
                  { color: colors.text },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error && (
        <Text
          accessibilityLiveRegion="polite"
          style={[typography.label, { color: colors.danger }]}
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
  },
  options: {
    gap: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    minHeight: minTouchTarget + 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  optionLabel: {
    flex: 1,
  },
});
