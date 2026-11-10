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
import { minTouchTarget, spacing, typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

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

  const handleContinue = () => {
    if (!consented) return;
    router.push('/profile');
  };

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

        {/* Botón de acción principal */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continuar a configurar el perfil"
          accessibilityHint="Abre la pantalla de captura del perfil"
          accessibilityState={{ disabled: !consented }}
          disabled={!consented}
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.continueButton,
            {
              backgroundColor: colors.primary,
              opacity: !consented ? 0.5 : pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={[typography.body, styles.continueText, { color: colors.onPrimary }]}>
            Continuar al perfil →
          </Text>
        </Pressable>
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
});
