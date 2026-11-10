import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CATEGORY_LABELS, MODALITY_LABELS } from '../../src/components/OpportunityCard';
import { StatusBadge } from '../../src/components/StatusBadge';
import { EmptyState } from '../../src/components/states/EmptyState';
import { ErrorState } from '../../src/components/states/ErrorState';
import { LoadingState } from '../../src/components/states/LoadingState';
import { useGetOpportunityByIdQuery } from '../../src/store/api';
import { minTouchTarget, spacing, typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';
import { openOfficialUrl } from '../../src/utils/url';

/**
 * Pantalla de detalle de oportunidad (entregable de Juan).
 *
 * Muestra requisitos completos en lenguaje claro, estado de vigencia,
 * procedencia verificada y apertura segura del canal oficial mediante el navegador
 * del sistema (expo-web-browser), sin usar WebViews embebidos.
 */
export default function OpportunityDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: opportunity, isLoading, isError, refetch } =
    useGetOpportunityByIdQuery(id ?? '', { skip: !id });

  const [isOpeningUrl, setIsOpeningUrl] = useState(false);

  const handleOpenOfficialLink = async () => {
    if (!opportunity?.officialUrl) return;

    setIsOpeningUrl(true);
    const result = await openOfficialUrl(opportunity.officialUrl);
    setIsOpeningUrl(false);

    if (!result.success) {
      Alert.alert(
        'Enlace no disponible',
        'No pudimos abrir el enlace oficial. Por favor verifica tu conexión a internet o intenta más tarde.',
      );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <LoadingState message="Cargando detalles de la convocatoria…" />
      </SafeAreaView>
    );
  }

  if (isError || !opportunity) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <View style={styles.container}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver a la lista de recomendaciones"
            onPress={() => router.back()}
            style={[styles.backButton, { borderColor: colors.border }]}
          >
            <Text style={[styles.backButtonText, { color: colors.primary }]}>
              ← Volver
            </Text>
          </Pressable>
          <ErrorState
            title="Convocatoria no encontrada"
            message="No pudimos encontrar la información de esta convocatoria o el enlace no es válido."
            onRetry={refetch}
          />
        </View>
      </SafeAreaView>
    );
  }

  const categoryName = CATEGORY_LABELS[opportunity.category] ?? opportunity.category;
  const modalityName = MODALITY_LABELS[opportunity.modality] ?? opportunity.modality;

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Botón Volver Accesible */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver a las recomendaciones anteriores"
          accessibilityHint="Regresa a la lista de opciones recomendadas"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={[styles.backButtonText, { color: colors.primary }]}>
            ← Volver a recomendaciones
          </Text>
        </Pressable>

        {/* Encabezado de la Oportunidad */}
        <View style={styles.metaRow}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.categoryText, { color: colors.primary }]}>
              {categoryName} • {modalityName}
            </Text>
          </View>
          <StatusBadge validity={opportunity.validity} />
        </View>

        <Text
          accessibilityRole="header"
          style={[typography.screenTitle, { color: colors.text }]}
        >
          {opportunity.title}
        </Text>
        <Text style={[typography.body, styles.entityName, { color: colors.textMuted }]}>
          Ofrecida por: {opportunity.entityName}
        </Text>

        {/* Resumen en Lenguaje Claro */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            ¿En qué consiste esta oportunidad?
          </Text>
          <Text style={[styles.sectionBody, { color: colors.text }]}>
            {opportunity.summaryPlain}
          </Text>
        </View>

        {/* Requisitos */}
        {opportunity.requirements.length > 0 && (
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Requisitos para participar
            </Text>
            {opportunity.requirements.map((req, idx) => (
              <View key={idx} style={styles.requirementRow}>
                <Text style={[styles.bullet, { color: colors.primary }]}>✓</Text>
                <Text style={[styles.requirementText, { color: colors.text }]}>
                  {req}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Trazabilidad y Verificación Humana (Fase 1, III-C) */}
        <View
          style={[
            styles.verificationCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.verificationTitle, { color: colors.text }]}>
            🛡️ Verificación oficial de procedencia
          </Text>
          <Text style={[styles.verificationText, { color: colors.textMuted }]}>
            • Verificado por el equipo de Orienta+: {opportunity.verifiedBy}
          </Text>
          <Text style={[styles.verificationText, { color: colors.textMuted }]}>
            • Fecha de revisión: {new Date(opportunity.verifiedAt).toLocaleDateString('es-CO')}
          </Text>
          <Text style={[styles.verificationText, { color: colors.textMuted }]}>
            • Fuente comprobada: Entidad pública u oficial verificada
          </Text>
        </View>

        {/* Botón de Apertura del Canal Oficial */}
        <View style={styles.actionContainer}>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Ir al portal oficial de inscripción de ${opportunity.entityName}`}
            accessibilityHint="Abre el sitio web oficial en el navegador del sistema fuera de Orienta+"
            accessibilityState={{ busy: isOpeningUrl }}
            disabled={isOpeningUrl}
            onPress={handleOpenOfficialLink}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: colors.primary,
                opacity: pressed || isOpeningUrl ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>
              {isOpeningUrl ? 'Abriendo sitio oficial…' : 'Postularme en el sitio oficial ↗'}
            </Text>
          </Pressable>

          <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
            Orienta+ es un orientador y agregador. La inscripción y postulación se realiza
            directamente en la plataforma oficial de la entidad convocante.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: spacing.md,
    minHeight: minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  backButtonText: {
    ...typography.secondary,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  categoryText: {
    ...typography.secondary,
    fontWeight: '600',
  },
  entityName: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.cardTitle,
    marginBottom: spacing.sm,
  },
  sectionBody: {
    ...typography.body,
    lineHeight: 24,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
    paddingRight: spacing.md,
  },
  bullet: {
    fontWeight: '700',
    marginRight: spacing.sm,
    fontSize: 16,
  },
  requirementText: {
    ...typography.body,
    flex: 1,
    lineHeight: 22,
  },
  verificationCard: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  verificationTitle: {
    ...typography.secondary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  verificationText: {
    ...typography.secondary,
    lineHeight: 20,
    marginTop: 2,
  },
  actionContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  primaryButtonText: {
    ...typography.body,
    fontWeight: '700',
  },
  disclaimerText: {
    ...typography.secondary,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});
