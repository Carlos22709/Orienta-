import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { minTouchTarget, spacing, typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { StatusBadge, type ValidityKind } from './StatusBadge';

export const CATEGORY_LABELS: Record<string, string> = {
  employment: 'Empleo',
  training: 'Formación',
  scholarship: 'Beca',
  subsidy: 'Subsidio',
  entrepreneurship: 'Emprendimiento',
};

export const MODALITY_LABELS: Record<string, string> = {
  in_person: 'Presencial',
  virtual: 'Virtual',
  hybrid: 'Híbrida',
};

export interface OpportunityItem {
  id: string;
  title: string;
  summaryPlain: string;
  category: string;
  entityName: string;
  modality: string;
  deadline: string | null;
  validity: ValidityKind;
  reasons: string[];
}

export interface OpportunityCardProps {
  opportunity: OpportunityItem;
  onPress: () => void;
}

/**
 * Tarjeta de oportunidad accesible y agrupada (compromisos M1, F2, V3).
 *
 * VoiceOver y TalkBack la leen como una sola unidad semántica para evitar
 * focos fragmentados, e informan el rol de botón con su pista de acción.
 */
export function OpportunityCard({ opportunity, onPress }: OpportunityCardProps) {
  const { colors } = useTheme();

  const categoryName = CATEGORY_LABELS[opportunity.category] ?? opportunity.category;
  const modalityName = MODALITY_LABELS[opportunity.modality] ?? opportunity.modality;

  const reasonsText = opportunity.reasons.length > 0
    ? `Por qué te la recomendamos: ${opportunity.reasons.join('. ')}.`
    : '';

  const accessibilityLabel = `${opportunity.title}. Convocatoria de ${categoryName}, modalidad ${modalityName}, ofrecida por ${opportunity.entityName}. ${reasonsText}`;

  return (
    <Pressable
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Toca dos veces para ver requisitos, entidad y el enlace oficial de postulación"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      {/* Encabezado: Categoría y Estado de Vigencia */}
      <View style={styles.topRow}>
        <View
          style={[
            styles.categoryTag,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.categoryText, { color: colors.primary }]}>
            {categoryName} • {modalityName}
          </Text>
        </View>
        <StatusBadge validity={opportunity.validity} />
      </View>

      {/* Título y Entidad */}
      <Text style={[styles.title, { color: colors.text }]}>
        {opportunity.title}
      </Text>
      <Text style={[styles.entity, { color: colors.textMuted }]}>
        {opportunity.entityName}
      </Text>

      {/* Resumen en lenguaje claro */}
      <Text
        numberOfLines={3}
        style={[styles.summary, { color: colors.text }]}
      >
        {opportunity.summaryPlain}
      </Text>

      {/* Razones de recomendación */}
      {opportunity.reasons.length > 0 && (
        <View
          style={[
            styles.reasonsContainer,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.reasonsTitle, { color: colors.textMuted }]}>
            Razón de la recomendación:
          </Text>
          {opportunity.reasons.map((reason, index) => (
            <Text
              key={index}
              style={[styles.reasonItem, { color: colors.text }]}
            >
              • {reason}
            </Text>
          ))}
        </View>
      )}

      {/* Indicador de acción */}
      <View style={styles.footerRow}>
        <Text style={[styles.viewDetailsText, { color: colors.primary }]}>
          Ver requisitos y postulación →
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.md, // Separación de al menos 12 (compromiso M1)
    minHeight: minTouchTarget, // Cumple área táctil mínima (compromiso M1)
    padding: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  categoryTag: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  categoryText: {
    ...typography.secondary,
    fontWeight: '600',
  },
  title: {
    ...typography.cardTitle,
    marginBottom: spacing.xs,
  },
  entity: {
    ...typography.secondary,
    marginBottom: spacing.sm,
  },
  summary: {
    ...typography.body,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  reasonsContainer: {
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  reasonsTitle: {
    ...typography.secondary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  reasonItem: {
    ...typography.secondary,
    marginLeft: spacing.xs,
    lineHeight: 20,
  },
  footerRow: {
    alignItems: 'flex-end',
    marginTop: spacing.xs,
  },
  viewDetailsText: {
    ...typography.secondary,
    fontWeight: '600',
  },
});
