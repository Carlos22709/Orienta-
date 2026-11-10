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

const MUNICIPALITIES = [
  { code: '11001', name: 'Bogotá, D.C.' },
  { code: '25175', name: 'Chía' },
  { code: '25899', name: 'Zipaquirá' },
  { code: '25126', name: 'Cajicá' },
  { code: '25214', name: 'Cota' },
  { code: '25817', name: 'Tocancipá' },
];

const EDUCATION_OPTIONS = [
  { value: 'secondary', label: 'Bachiller' },
  { value: 'technical', label: 'Técnico' },
  { value: 'technologist', label: 'Tecnólogo' },
  { value: 'university', label: 'Universitario' },
];

const EXPERIENCE_OPTIONS = [
  { value: 'none', label: 'Sin experiencia previa' },
  { value: 'lt_1y', label: 'Menos de 1 año' },
  { value: '1_3y', label: 'Entre 1 y 3 años' },
  { value: 'gt_3y', label: 'Más de 3 años' },
];

const SITUATION_OPTIONS = [
  { value: 'neither', label: 'No estudio ni trabajo actualmente' },
  { value: 'studying', label: 'Solo estudio' },
  { value: 'working', label: 'Solo trabajo' },
  { value: 'both', label: 'Estudio y trabajo' },
];

const INTEREST_OPTIONS = [
  { value: 'employment', label: 'Empleo' },
  { value: 'training', label: 'Formación' },
  { value: 'scholarship', label: 'Becas' },
  { value: 'subsidy', label: 'Subsidios' },
  { value: 'entrepreneurship', label: 'Emprendimiento' },
];

const AVAILABILITY_OPTIONS = [
  { value: 'full_time', label: 'Tiempo completo' },
  { value: 'part_time', label: 'Medio tiempo' },
  { value: 'weekends', label: 'Fines de semana' },
  { value: 'flexible', label: 'Flexible' },
];

/**
 * Pantalla de captura y edición de perfil.
 *
 * Conecta el flujo de bienvenida de Laura con la experiencia de recomendaciones de Juan.
 * Formulario accesible paso a paso con controles táctiles amplios (>= 48 dp).
 */
export default function ProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  // Estado del perfil
  const [municipality, setMunicipality] = useState('11001');
  const [education, setEducation] = useState('secondary');
  const [experience, setExperience] = useState('none');
  const [situation, setSituation] = useState('neither');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'employment',
    'training',
  ]);
  const [availability, setAvailability] = useState('flexible');

  const toggleInterest = (value: string, label: string) => {
    setSelectedInterests((prev) => {
      const exists = prev.includes(value);
      const next = exists ? prev.filter((i) => i !== value) : [...prev, value];
      AccessibilityInfo.announceForAccessibility(
        `${label} ${exists ? 'deseleccionado' : 'seleccionado'}`,
      );
      return next;
    });
  };

  const handleSaveAndRecommend = () => {
    router.push('/recommendations');
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Encabezado */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver a la bienvenida"
          onPress={() => router.back()}
          style={[styles.backButton, { borderColor: colors.border }]}
        >
          <Text style={[styles.backButtonText, { color: colors.primary }]}>
            ← Volver
          </Text>
        </Pressable>

        <Text
          accessibilityRole="header"
          style={[typography.screenTitle, { color: colors.text }]}
        >
          Tu perfil de orientación
        </Text>
        <Text style={[typography.body, styles.subtitle, { color: colors.textMuted }]}>
          Los datos que ingreses se usan exclusivamente para recomendarte las opciones más pertinentes.
        </Text>

        {/* 1. Municipio */}
        <View style={styles.section}>
          <Text style={[typography.cardTitle, styles.sectionTitle, { color: colors.text }]}>
            1. ¿Dónde vives actualmente?
          </Text>
          <View style={styles.optionsWrap}>
            {MUNICIPALITIES.map((item) => {
              const selected = municipality === item.code;
              return (
                <Pressable
                  key={item.code}
                  accessible={true}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Municipio: ${item.name}`}
                  onPress={() => {
                    setMunicipality(item.code);
                    AccessibilityInfo.announceForAccessibility(`Seleccionado ${item.name}`);
                  }}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: selected ? colors.primary : colors.surface,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: selected ? colors.onPrimary : colors.text },
                    ]}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 2. Nivel educativo */}
        <View style={styles.section}>
          <Text style={[typography.cardTitle, styles.sectionTitle, { color: colors.text }]}>
            2. ¿Cuál es tu máximo nivel educativo?
          </Text>
          <View style={styles.optionsWrap}>
            {EDUCATION_OPTIONS.map((item) => {
              const selected = education === item.value;
              return (
                <Pressable
                  key={item.value}
                  accessible={true}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Nivel educativo: ${item.label}`}
                  onPress={() => {
                    setEducation(item.value);
                    AccessibilityInfo.announceForAccessibility(`Seleccionado ${item.label}`);
                  }}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: selected ? colors.primary : colors.surface,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: selected ? colors.onPrimary : colors.text },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 3. Experiencia */}
        <View style={styles.section}>
          <Text style={[typography.cardTitle, styles.sectionTitle, { color: colors.text }]}>
            3. Experiencia laboral previa
          </Text>
          <View style={styles.optionsWrap}>
            {EXPERIENCE_OPTIONS.map((item) => {
              const selected = experience === item.value;
              return (
                <Pressable
                  key={item.value}
                  accessible={true}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Experiencia: ${item.label}`}
                  onPress={() => {
                    setExperience(item.value);
                    AccessibilityInfo.announceForAccessibility(`Seleccionado ${item.label}`);
                  }}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: selected ? colors.primary : colors.surface,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: selected ? colors.onPrimary : colors.text },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 4. Situación actual */}
        <View style={styles.section}>
          <Text style={[typography.cardTitle, styles.sectionTitle, { color: colors.text }]}>
            4. Situación ocupacional actual
          </Text>
          <View style={styles.optionsWrap}>
            {SITUATION_OPTIONS.map((item) => {
              const selected = situation === item.value;
              return (
                <Pressable
                  key={item.value}
                  accessible={true}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Situación: ${item.label}`}
                  onPress={() => {
                    setSituation(item.value);
                    AccessibilityInfo.announceForAccessibility(`Seleccionado ${item.label}`);
                  }}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: selected ? colors.primary : colors.surface,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: selected ? colors.onPrimary : colors.text },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 5. Intereses */}
        <View style={styles.section}>
          <Text style={[typography.cardTitle, styles.sectionTitle, { color: colors.text }]}>
            5. ¿Qué categorías te interesan?
          </Text>
          <View style={styles.optionsWrap}>
            {INTEREST_OPTIONS.map((item) => {
              const selected = selectedInterests.includes(item.value);
              return (
                <Pressable
                  key={item.value}
                  accessible={true}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`Interés en ${item.label}`}
                  onPress={() => toggleInterest(item.value, item.label)}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: selected ? colors.primary : colors.surface,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: selected ? colors.onPrimary : colors.text },
                    ]}
                  >
                    {selected ? '✓ ' : ''}{item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 6. Disponibilidad */}
        <View style={styles.section}>
          <Text style={[typography.cardTitle, styles.sectionTitle, { color: colors.text }]}>
            6. Disponibilidad de tiempo
          </Text>
          <View style={styles.optionsWrap}>
            {AVAILABILITY_OPTIONS.map((item) => {
              const selected = availability === item.value;
              return (
                <Pressable
                  key={item.value}
                  accessible={true}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Disponibilidad: ${item.label}`}
                  onPress={() => {
                    setAvailability(item.value);
                    AccessibilityInfo.announceForAccessibility(`Seleccionado ${item.label}`);
                  }}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: selected ? colors.primary : colors.surface,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: selected ? colors.onPrimary : colors.text },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Botón Guardar y Ver Recomendaciones */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ver recomendaciones de oportunidades personalizadas"
          accessibilityHint="Guarda los datos del perfil y muestra las recomendaciones"
          onPress={handleSaveAndRecommend}
          style={({ pressed }) => [
            styles.submitButton,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={[typography.body, styles.submitButtonText, { color: colors.onPrimary }]}>
            Ver mis recomendaciones (4-5 opciones) →
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
  backButton: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: spacing.md,
    minHeight: minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  backButtonText: {
    ...typography.secondary,
    fontWeight: '600',
  },
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionButton: {
    borderRadius: 8,
    borderWidth: 1.5,
    minHeight: minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionText: {
    ...typography.secondary,
    fontWeight: '600',
  },
  submitButton: {
    alignItems: 'center',
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xxl,
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  submitButtonText: {
    fontWeight: '700',
  },
});
