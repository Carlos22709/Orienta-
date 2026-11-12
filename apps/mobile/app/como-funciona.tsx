import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { radius, spacing, typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';
import { BackButton, Card, Screen, ScreenHeader } from '../src/ui/layout';

const STEPS = [
  {
    icon: 'chatbubbles-outline',
    title: 'Nos cuentas sobre ti',
    text: 'Tu edad, municipio, estudios, experiencia, situación, intereses y disponibilidad. Nada más.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Verificamos cada oportunidad',
    text: 'El equipo revisa que venga de una fuente oficial, que la entidad exista, que esté vigente y que los requisitos estén completos.',
  },
  {
    icon: 'sparkles-outline',
    title: 'Te recomendamos 4 o 5',
    text: 'Solo las que cumples. Primero las de tus intereses y las que cierran pronto, y te decimos por qué.',
  },
  {
    icon: 'open-outline',
    title: 'Te postulas en el sitio oficial',
    text: 'Orienta+ no recibe hojas de vida ni cobra nada: te lleva directo al canal oficial de la entidad.',
  },
] as const;

/** Cómo funciona Orienta+, en lenguaje claro. */
export default function HowItWorksScreen() {
  const { colors } = useTheme();
  return (
    <Screen>
      <BackButton />
      <ScreenHeader
        title="Cómo funciona Orienta+"
        subtitle="Oportunidades reales, claras y seguras para dar el siguiente paso."
      />
      {STEPS.map((step, index) => (
        <Card key={step.title}>
          <View style={styles.row}>
            <View style={[styles.badge, { backgroundColor: colors.chip }]}>
              <Ionicons name={step.icon} size={24} color={colors.chipText} />
            </View>
            <View style={styles.flex}>
              <Text style={[typography.label, { color: colors.textMuted }]}>PASO {index + 1}</Text>
              <Text style={[typography.cardTitle, { color: colors.text }]}>{step.title}</Text>
              <Text style={[typography.body, { color: colors.text }]}>{step.text}</Text>
            </View>
          </View>
        </Card>
      ))}
      <Card tone={colors.surfaceAlt}>
        <Text style={[typography.bodyStrong, { color: colors.text }]}>Tus datos son tuyos</Text>
        <Text style={[typography.body, { color: colors.text }]}>
          Según la Ley 1581 de 2012, puedes descargar o eliminar tus datos cuando quieras desde
          Perfil, en Mis datos y privacidad.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  badge: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
