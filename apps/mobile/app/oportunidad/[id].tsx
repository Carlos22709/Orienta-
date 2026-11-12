import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CATEGORY_LABELS, MODALITY_LABELS } from '../../src/components/OpportunityCard';
import { SaveButton } from '../../src/components/SaveButton';
import { ListenButton } from '../../src/components/ListenButton';
import { getStatusBadgeVisual, StatusBadge } from '../../src/components/StatusBadge';
import { buildSpeechText } from '../../src/a11y/speechText';
import { ErrorState } from '../../src/components/states/ErrorState';
import { LoadingState } from '../../src/components/states/LoadingState';
import { useGetOpportunityByIdQuery } from '../../src/store/api';
import { radius, spacing, typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';
import { Button } from '../../src/ui/Button';
import { BackButton, Card, Notice, Screen } from '../../src/ui/layout';
import { categoryMeta, isCategoryKey } from '../../src/ui/categories';
import { openOfficialUrl } from '../../src/utils/url';

/** "15 de diciembre de 2026". */
function longDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Detalle de una oportunidad (basado en la pantalla de Juan): resumen en
 * lenguaje claro, requisitos, procedencia verificada y apertura segura del
 * sitio oficial en el navegador del sistema (sin WebView).
 */
export default function OpportunityDetailScreen() {
  const { colors, categories } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: opportunity, isLoading, isError, isFetching, refetch } =
    useGetOpportunityByIdQuery(id ?? '', { skip: !id });
  const [opening, setOpening] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const openOfficial = async () => {
    if (!opportunity) return;
    setOpening(true);
    setLinkError(null);
    const result = await openOfficialUrl(opportunity.officialUrl);
    setOpening(false);
    if (!result.success) {
      setLinkError('No pudimos abrir el sitio oficial. Revisa tu conexión e intenta de nuevo.');
    }
  };

  if (isLoading) {
    return (
      <Screen scroll={false}>
        <LoadingState message="Cargando la oportunidad…" accessibilityLabel="Cargando la oportunidad, por favor espera" />
      </Screen>
    );
  }
  if (isError || !opportunity) {
    return (
      <Screen>
        <BackButton />
        <ErrorState
          title="No encontramos esta oportunidad"
          message="Puede que el enlace no sea válido o que no haya conexión."
          onRetry={refetch}
          isRetrying={isFetching}
        />
      </Screen>
    );
  }

  const meta = categoryMeta(opportunity.category);
  const tone = isCategoryKey(opportunity.category) ? categories[opportunity.category] : colors.chip;
  const closed = opportunity.validity.kind === 'closed';

  return (
    <Screen>
      <View style={styles.topBar}>
        <BackButton />
        <SaveButton
          opportunity={{
            id: opportunity.id,
            title: opportunity.title,
            category: opportunity.category,
            entityName: opportunity.entityName,
            deadline: opportunity.deadline,
          }}
        />
      </View>

      <View style={[styles.hero, { backgroundColor: tone }]}>
        <View style={styles.heroRow}>
          <View style={[styles.heroIcon, { backgroundColor: colors.surface }]}>
            <Ionicons name={meta.icon} size={26} color={colors.primary} />
          </View>
          <StatusBadge validity={opportunity.validity} />
        </View>
        <Text style={[typography.label, { color: colors.text }]}>
          {CATEGORY_LABELS[opportunity.category] ?? opportunity.category} ·{' '}
          {MODALITY_LABELS[opportunity.modality] ?? opportunity.modality}
        </Text>
        <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.text }]}>
          {opportunity.title}
        </Text>
        <Text style={[typography.body, { color: colors.text }]}>{opportunity.entityName}</Text>
      </View>

      <View style={styles.facts}>
        <Fact icon="calendar-outline" label="Cierre" value={opportunity.deadline ? longDate(opportunity.deadline) : 'Abierta todo el año'} />
        <Fact icon="location-outline" label="Modalidad" value={MODALITY_LABELS[opportunity.modality] ?? opportunity.modality} />
      </View>

      <ListenButton
        text={buildSpeechText({
          title: opportunity.title,
          entityName: opportunity.entityName,
          summaryPlain: opportunity.summaryPlain,
          requirements: opportunity.requirements,
          deadline: opportunity.deadline,
          modalityLabel: MODALITY_LABELS[opportunity.modality] ?? opportunity.modality,
          validityText: getStatusBadgeVisual(opportunity.validity, colors).text,
        })}
      />

      <Card>
        <Text accessibilityRole="header" style={[typography.cardTitle, { color: colors.text }]}>
          ¿De qué se trata?
        </Text>
        <Text style={[typography.body, { color: colors.text }]}>{opportunity.summaryPlain}</Text>
      </Card>

      {opportunity.requirements.length > 0 && (
        <Card>
          <Text accessibilityRole="header" style={[typography.cardTitle, { color: colors.text }]}>
            Requisitos
          </Text>
          {opportunity.requirements.map((req, index) => (
            <View key={index} style={styles.req}>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
              <Text style={[typography.body, styles.flex, { color: colors.text }]}>{req}</Text>
            </View>
          ))}
        </Card>
      )}

      <Card tone={colors.surfaceAlt}>
        <View style={styles.req}>
          <Ionicons name="shield-checkmark" size={22} color={colors.success} />
          <Text style={[typography.bodyStrong, styles.flex, { color: colors.text }]}>
            Verificada por Orienta+
          </Text>
        </View>
        <Text style={[typography.secondary, { color: colors.textMuted }]}>
          Revisada por {opportunity.verifiedBy} el {longDate(opportunity.verifiedAt)} en la fuente
          oficial de la entidad.
        </Text>
      </Card>

      {linkError ? <Notice text={linkError} tone="error" /> : null}
      <Button
        label={opening ? 'Abriendo sitio oficial…' : closed ? 'Ver sitio oficial' : 'Postularme en el sitio oficial'}
        icon="open-outline"
        busy={opening}
        hint="Abre el sitio oficial de la entidad en el navegador del sistema, fuera de Orienta+"
        onPress={() => void openOfficial()}
      />
      <Text style={[typography.secondary, styles.center, { color: colors.textMuted }]}>
        Orienta+ te orienta, pero la inscripción se hace directamente con la entidad.
      </Text>
    </Screen>
  );
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={[styles.fact, { backgroundColor: colors.surface, borderColor: colors.divider }]}
    >
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={[typography.label, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[typography.bodyStrong, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hero: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroIcon: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  facts: { flexDirection: 'row', gap: spacing.md },
  fact: { flex: 1, borderRadius: radius.md, borderWidth: 1, padding: spacing.md, gap: 2 },
  req: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
});
