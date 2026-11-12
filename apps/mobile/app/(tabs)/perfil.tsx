import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import { signOut } from '../../src/auth/actions';
import { ageOn } from '../../src/profile/questionnaire';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { useGetCatalogQuery, useGetMfaStatusQuery, useGetProfileQuery } from '../../src/store/api';
import { selectSessionUser } from '../../src/store/authSlice';
import { spacing, typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';
import { Card, MenuRow, Screen } from '../../src/ui/layout';

/** Iniciales a partir del correo (antes de la @). */
function initials(email: string | null | undefined): string {
  const name = (email ?? '').split('@')[0].replace(/[^a-zA-Z]/g, ' ').trim();
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'O+';
  return (parts[0][0] + (parts[1]?.[0] ?? parts[0][1] ?? '')).toUpperCase();
}

/**
 * Perfil: resumen de la persona, editar sus respuestas, seguridad,
 * privacidad (Ley 1581), ayuda y cerrar sesión.
 */
export default function ProfileTab() {
  const { colors } = useTheme();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectSessionUser);
  const profile = useGetProfileQuery();
  const catalog = useGetCatalogQuery();
  const mfa = useGetMfaStatusQuery();
  const [signingOut, setSigningOut] = useState(false);

  const p = profile.data?.profile;
  const label = (list: ReadonlyArray<{ value: string; label: string }> | undefined, value: string | null | undefined) =>
    list?.find((o) => o.value === value)?.label;
  const municipality = catalog.data?.municipalities.find((m) => m.code === p?.municipalityCode)?.name;
  const age = p?.birthDate ? `${ageOn(p.birthDate, new Date())} años` : null;
  const summary = [age, municipality].filter(Boolean).join(' · ');
  const interests = (p?.interests ?? [])
    .map((value) => label(catalog.data?.categories, value))
    .filter(Boolean)
    .join(', ');

  const handleSignOut = async () => {
    setSigningOut(true);
    await dispatch(signOut());
    AccessibilityInfo.announceForAccessibility('Cerraste sesión');
    router.replace('/bienvenida');
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <View
          style={[styles.avatar, { backgroundColor: colors.accent }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Text style={[typography.screenTitle, { color: '#FFFFFF' }]}>{initials(user?.email)}</Text>
        </View>
        <Text accessibilityRole="header" style={[typography.cardTitle, { color: colors.text }]}>
          {user?.email ?? 'Tu perfil'}
        </Text>
        {summary ? (
          <Text style={[typography.secondary, { color: colors.textMuted }]}>{summary}</Text>
        ) : null}
      </View>

      <Text style={[typography.label, { color: colors.textMuted }]}>TUS RESPUESTAS</Text>
      <Card>
        <Info title="Estudios" value={label(catalog.data?.educationLevels, p?.educationLevel)} />
        <Info title="Situación" value={label(catalog.data?.situations, p?.currentSituation)} />
        <Info title="Te interesa" value={interests || undefined} />
        <Info title="Disponibilidad" value={label(catalog.data?.availabilities, p?.availability)} />
        <MenuRow
          icon="create-outline"
          label="Editar mis respuestas"
          hint="Abre el cuestionario con tus respuestas actuales"
          onPress={() => router.push({ pathname: '/cuestionario', params: { modo: 'editar' } })}
          last
        />
      </Card>

      <Text style={[typography.label, { color: colors.textMuted }]}>CUENTA Y PRIVACIDAD</Text>
      <Card style={styles.menu}>
        <MenuRow
          icon="shield-checkmark-outline"
          label="Verificación en dos pasos"
          value={mfa.data ? (mfa.data.enrolled ? 'Activa' : 'Inactiva') : undefined}
          onPress={() => router.push('/perfil/seguridad')}
        />
        <MenuRow
          icon="document-lock-outline"
          label="Mis datos y privacidad"
          hint="Descargar o eliminar tus datos"
          onPress={() => router.push('/perfil/datos')}
        />
        <MenuRow
          icon="help-circle-outline"
          label="Cómo funciona Orienta+"
          onPress={() => router.push('/como-funciona')}
          last
        />
      </Card>

      <Card style={styles.menu}>
        <MenuRow
          icon="log-out-outline"
          label={signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
          danger
          onPress={() => void handleSignOut()}
          last
        />
      </Card>
    </Screen>
  );
}

function Info({ title, value }: { title: string; value?: string }) {
  const { colors } = useTheme();
  return (
    <View accessible accessibilityLabel={`${title}: ${value ?? 'sin responder'}`} style={styles.info}>
      <Text style={[typography.label, { color: colors.textMuted }]}>{title}</Text>
      <Text style={[typography.body, { color: colors.text }]}>{value ?? 'Sin responder'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  info: { gap: 2, paddingBottom: spacing.sm },
  menu: { paddingVertical: spacing.xs },
});
