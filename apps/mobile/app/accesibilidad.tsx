import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { OptionGroup } from '../src/components/OptionGroup';
import { useAppDispatch, useAppSelector } from '../src/store';
import {
  hapticsChanged,
  selectSettings,
  settingsReset,
  textScaleChanged,
  themeChanged,
  type ThemePreference,
} from '../src/store/settingsSlice';
import { minTouchTarget, radius, spacing, TEXT_SCALE, typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';
import { Button } from '../src/ui/Button';
import { BackButton, Card, Screen, ScreenHeader } from '../src/ui/layout';
import { notifySelection, notifySuccess } from '../src/ui/feedback';

const THEMES: ReadonlyArray<{ value: ThemePreference; label: string }> = [
  { value: 'system', label: 'Según el teléfono' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];

const percent = (scale: number) => `${Math.round(scale * 100)} %`;

/**
 * Accesibilidad: tema, tamaño del texto y vibración. Se guarda en el
 * teléfono y se aplica a toda la app al instante. Se puede abrir desde la
 * bienvenida (antes de iniciar sesión) y desde Perfil.
 */
export default function AccessibilityScreen() {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectSettings);

  const setScale = (next: number) => {
    dispatch(textScaleChanged(next));
    notifySelection();
  };
  const canDecrease = settings.textScale > TEXT_SCALE.min;
  const canIncrease = settings.textScale < TEXT_SCALE.max;

  return (
    <Screen>
      <BackButton />
      <ScreenHeader
        title="Accesibilidad"
        subtitle="Ajusta Orienta+ a tu medida. Los cambios se aplican al instante y se guardan en este teléfono."
      />

      <Card>
        <OptionGroup
          title="Tema"
          mode="single"
          options={THEMES}
          selected={[settings.theme]}
          onToggle={(value) => dispatch(themeChanged(value as ThemePreference))}
        />
      </Card>

      <Card>
        <Text accessibilityRole="header" style={[typography.cardTitle, { color: colors.text }]}>
          Tamaño del texto
        </Text>
        <Text style={[typography.secondary, { color: colors.textMuted }]}>
          Se suma al tamaño de letra que tengas configurado en el teléfono.
        </Text>

        <View style={styles.scaleRow}>
          <StepButton
            icon="remove"
            label="Reducir el texto"
            disabled={!canDecrease}
            onPress={() => setScale(settings.textScale - TEXT_SCALE.step)}
          />
          {/* Control ajustable: con VoiceOver o TalkBack se cambia deslizando hacia arriba o abajo. */}
          <View
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel="Tamaño del texto"
            accessibilityValue={{ text: percent(settings.textScale) }}
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={(event) => {
              if (event.nativeEvent.actionName === 'increment' && canIncrease) {
                setScale(settings.textScale + TEXT_SCALE.step);
              }
              if (event.nativeEvent.actionName === 'decrement' && canDecrease) {
                setScale(settings.textScale - TEXT_SCALE.step);
              }
            }}
            style={[styles.scaleValue, { backgroundColor: colors.chip }]}
          >
            <Text style={[typography.screenTitle, { color: colors.chipText }]}>
              {percent(settings.textScale)}
            </Text>
          </View>
          <StepButton
            icon="add"
            label="Aumentar el texto"
            disabled={!canIncrease}
            onPress={() => setScale(settings.textScale + TEXT_SCALE.step)}
          />
        </View>

        <View
          style={[styles.preview, { backgroundColor: colors.surfaceAlt, borderColor: colors.divider }]}
        >
          <Text style={[typography.label, { color: colors.textMuted }]}>VISTA PREVIA</Text>
          <Text style={[typography.cardTitle, { color: colors.text }]}>Talento Tech: bootcamp gratuito</Text>
          <Text style={[typography.body, { color: colors.text }]}>
            Así se verán los textos de Orienta+ con este tamaño.
          </Text>
        </View>
      </Card>

      <Card>
        <View style={styles.switchRow}>
          <View style={styles.flex}>
            <Text style={[typography.bodyStrong, { color: colors.text }]}>Vibración</Text>
            <Text style={[typography.secondary, { color: colors.textMuted }]}>
              Vibra al confirmar una acción o avisar de un error.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Vibración al confirmar o avisar de errores"
            value={settings.haptics}
            onValueChange={(value) => {
              dispatch(hapticsChanged(value));
              if (value) notifySuccess('Vibración activada');
            }}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
            ios_backgroundColor={colors.border}
          />
        </View>
      </Card>

      <Card tone={colors.surfaceAlt}>
        <Text style={[typography.bodyStrong, { color: colors.text }]}>
          Orienta+ también respeta tu teléfono
        </Text>
        <Text style={[typography.secondary, { color: colors.text }]}>
          Funciona con VoiceOver y TalkBack, con el tamaño de letra del sistema y con su modo
          oscuro. En cada oportunidad puedes tocar "Escuchar" para que te la lea en voz alta.
        </Text>
      </Card>

      <Button
        label="Restablecer valores"
        variant="ghost"
        icon="refresh"
        onPress={() => {
          dispatch(settingsReset());
          notifySuccess('Ajustes restablecidos');
        }}
      />
    </Screen>
  );
}

function StepButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: 'add' | 'remove';
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.step,
        {
          borderColor: colors.border,
          backgroundColor: colors.surface,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={26} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scaleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  scaleValue: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    minHeight: minTouchTarget + 8,
  },
  step: {
    width: minTouchTarget + 8,
    height: minTouchTarget + 8,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: { borderRadius: radius.md, borderWidth: 1, padding: spacing.md, gap: spacing.xs, marginTop: spacing.sm },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: minTouchTarget },
});
