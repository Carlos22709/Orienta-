import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cardShadow, radius, spacing, typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { categoryMeta, isCategoryKey } from '../ui/categories';
import { SaveButton } from './SaveButton';
import { StatusBadge, type ValidityKind } from './StatusBadge';
import { validityLabel } from './statusBadgeHelper';

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
  /** Razones de la recomendación; vacío en el listado de Explorar. */
  reasons: string[];
}

/**
 * Etiqueta que anuncia el lector de pantalla para toda la tarjeta.
 *
 * La zona principal agrupa a sus hijos (accessible), así que el lector no lee
 * el StatusBadge por separado: la vigencia tiene que ir aquí. Va justo
 * después del título porque es lo que decide si vale la pena abrirla.
 */
export function buildOpportunityLabel(opportunity: OpportunityItem): string {
  const categoryName = CATEGORY_LABELS[opportunity.category] ?? opportunity.category;
  const modalityName = MODALITY_LABELS[opportunity.modality] ?? opportunity.modality;
  const reasonsText = opportunity.reasons.length > 0
    ? ` Por qué te la recomendamos: ${opportunity.reasons.join('. ')}.`
    : '';
  return `${opportunity.title}. ${validityLabel(opportunity.validity)}. Convocatoria de ${categoryName}, modalidad ${modalityName}, ofrecida por ${opportunity.entityName}.${reasonsText}`;
}

export interface OpportunityCardProps {
  opportunity: OpportunityItem;
  onPress: () => void;
}

/**
 * Tarjeta de oportunidad (compromisos M1, F2, V3; diseño Amanecer).
 *
 * La zona principal es un solo botón accesible, con toda la información
 * agrupada para que VoiceOver y TalkBack no fragmenten el foco. El ♡ es un
 * botón aparte para guardarla.
 */
export function OpportunityCard({ opportunity, onPress }: OpportunityCardProps) {
  const { colors, categories } = useTheme();
  const meta = categoryMeta(opportunity.category);
  const tone = isCategoryKey(opportunity.category)
    ? categories[opportunity.category]
    : colors.chip;

  const categoryName = CATEGORY_LABELS[opportunity.category] ?? opportunity.category;
  const modalityName = MODALITY_LABELS[opportunity.modality] ?? opportunity.modality;
  const reasons = opportunity.reasons;
  const accessibilityLabel = buildOpportunityLabel(opportunity);

  return (
    <View
      style={[
        styles.card,
        cardShadow(colors.shadow),
        { backgroundColor: colors.surface, borderColor: colors.divider },
      ]}
    >
      <Pressable
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Toca dos veces para ver requisitos, entidad y el enlace oficial de postulación"
        onPress={onPress}
        style={({ pressed }) => [styles.main, { opacity: pressed ? 0.85 : 1 }]}
      >
        <View style={styles.topRow}>
          <View style={[styles.category, { backgroundColor: tone }]}>
            <Ionicons name={meta.icon} size={14} color={colors.text} />
            <Text style={[typography.label, { color: colors.text }]}>{categoryName}</Text>
          </View>
          <StatusBadge validity={opportunity.validity} />
        </View>

        <Text style={[typography.cardTitle, { color: colors.text }]}>{opportunity.title}</Text>
        <Text style={[typography.secondary, { color: colors.textMuted }]}>
          {opportunity.entityName} · {modalityName}
        </Text>
        <Text numberOfLines={2} style={[typography.body, { color: colors.text }]}>
          {opportunity.summaryPlain}
        </Text>

        {reasons.length > 0 && (
          <View style={[styles.reasons, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={[typography.label, { color: colors.chipText }]}>Por qué para ti</Text>
            {reasons.map((reason, index) => (
              <View key={index} style={styles.reason}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={[typography.secondary, styles.reasonText, { color: colors.text }]}>
                  {reason}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Pressable>

      <View style={[styles.footer, { borderTopColor: colors.divider }]}>
        <Text style={[typography.label, { color: colors.primary }]}>Ver detalle  ›</Text>
        <SaveButton
          opportunity={{
            id: opportunity.id,
            title: opportunity.title,
            category: opportunity.category,
            entityName: opportunity.entityName,
            deadline: opportunity.deadline,
            validity: opportunity.validity,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'visible',
  },
  main: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  category: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  reasons: {
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 6,
    marginTop: spacing.xs,
  },
  reason: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  reasonText: { flex: 1 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
  },
});
