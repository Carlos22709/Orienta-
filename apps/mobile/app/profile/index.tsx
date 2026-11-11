import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OptionGroup } from '../../src/components/OptionGroup';
import { ErrorState } from '../../src/components/states/ErrorState';
import { LoadingState } from '../../src/components/states/LoadingState';
import {
  describeFields,
  EMPTY_FORM,
  formFromProfile,
  readSaveProfileError,
  toggleInterest,
  toProfileUpdate,
  validateProfileForm,
  type ProfileField,
  type ProfileFormState,
} from '../../src/profile/profileForm';
import { useAppSelector } from '../../src/store';
import {
  useGetCatalogQuery,
  useGetProfileQuery,
  useUpdateProfileMutation,
} from '../../src/store/api';
import { selectAuthStatus } from '../../src/store/authSlice';
import { minTouchTarget, spacing, typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

type FieldErrors = Partial<Record<ProfileField, string>>;

/** Aviso general bajo el formulario (éxito parcial o error). */
type Notice = { tone: 'info' | 'error' | 'consent'; text: string };

/**
 * Captura y edición del perfil (entregable de Laura, PLANS.md).
 *
 * - Las opciones salen de GET /api/catalog: municipios en alcance y
 *   etiquetas en lenguaje claro (Fase 2, C1).
 * - Al abrir, se retoma el perfil guardado con GET /api/me/profile (C3).
 * - Guardar envía PUT /api/me/profile con lo respondido. Si falta algo, el
 *   avance queda guardado y se dice qué falta; si está completo, se pasa a
 *   las recomendaciones.
 * - Los errores del servidor (422) se muestran junto a cada campo y se
 *   anuncian al lector de pantalla.
 */
export default function ProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  // La bienvenida envía consent=accepted cuando la persona marca la casilla.
  const { consent } = useLocalSearchParams<{ consent?: string }>();
  const consentAccepted = consent === 'accepted';

  const authStatus = useAppSelector(selectAuthStatus);
  const isSignedIn = authStatus === 'signedIn';

  const catalog = useGetCatalogQuery();
  const savedProfile = useGetProfileQuery(undefined, { skip: !isSignedIn });
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();

  const [form, setForm] = useState<ProfileFormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<Notice | null>(null);

  // Retoma el perfil guardado una sola vez, para no borrar lo que la
  // persona esté editando si la consulta se repite.
  const hasLoadedProfile = useRef(false);
  useEffect(() => {
    if (!hasLoadedProfile.current && savedProfile.data) {
      hasLoadedProfile.current = true;
      setForm(formFromProfile(savedProfile.data.profile));
    }
  }, [savedProfile.data]);

  /** Cambia un campo y borra su error, porque la persona ya lo corrigió. */
  function setField<K extends ProfileField>(field: K, value: ProfileFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  function announce(next: Notice) {
    setNotice(next);
    AccessibilityInfo.announceForAccessibility(next.text);
  }

  async function handleSave() {
    if (!catalog.data || isSaving) return;

    const localErrors = validateProfileForm(form);
    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      announce({
        tone: 'error',
        text: `Revisa los datos marcados: ${describeFields(Object.keys(localErrors))}.`,
      });
      return;
    }

    // El consentimiento solo se envía si no está registrado con la versión vigente.
    const storedVersion = savedProfile.data?.profile?.consentVersion ?? null;
    const needsConsent =
      consentAccepted && storedVersion !== catalog.data.consentVersion;

    try {
      const result = await updateProfile(
        toProfileUpdate(form, needsConsent ? catalog.data.consentVersion : null),
      ).unwrap();
      setFieldErrors({});

      if (result.missingFields.length === 0) {
        AccessibilityInfo.announceForAccessibility('Perfil guardado.');
        setNotice(null);
        router.push('/recommendations');
      } else {
        announce({
          tone: 'info',
          text: `Guardamos tu avance. Para ver recomendaciones falta: ${describeFields(result.missingFields)}.`,
        });
      }
    } catch (error) {
      const problem = readSaveProfileError(error);
      if (problem.kind === 'validation' && problem.fields.consent) {
        // La versión del consentimiento cambió: hay que aceptarla de nuevo.
        announce({ tone: 'consent', text: problem.fields.consent });
      } else if (problem.kind === 'validation') {
        setFieldErrors(problem.fields as FieldErrors);
        announce({
          tone: 'error',
          text: `${problem.message} ${describeFields(Object.keys(problem.fields))}.`,
        });
      } else if (problem.kind === 'consent_required') {
        announce({ tone: 'consent', text: problem.message });
      } else {
        announce({ tone: 'error', text: problem.message });
      }
    }
  }

  if (catalog.isLoading || authStatus === 'restoring' || savedProfile.isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <LoadingState message="Preparando tu perfil…" />
      </SafeAreaView>
    );
  }

  if (!catalog.data) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <ErrorState
            message="No pudimos cargar las opciones del perfil. Revisa tu conexión e intenta de nuevo."
            onRetry={catalog.refetch}
            isRetrying={catalog.isFetching}
          />
        </View>
      </SafeAreaView>
    );
  }

  const options = catalog.data;
  const birthDateError = fieldErrors.birthDate ?? null;

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={() => router.back()}
          style={[styles.backButton, { borderColor: colors.border }]}
        >
          <Text style={[typography.secondary, styles.bold, { color: colors.primary }]}>
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
          Usamos estos datos solo para recomendarte oportunidades. Puedes guardar
          tu avance y terminar después.
        </Text>

        {!isSignedIn && (
          <View
            accessible
            accessibilityRole="alert"
            style={[styles.banner, { backgroundColor: colors.surface, borderColor: colors.warning }]}
          >
            <Text style={[typography.body, styles.bold, { color: colors.text }]}>
              ⚠ Inicia sesión para guardar tu perfil.
            </Text>
            <Text style={[typography.secondary, { color: colors.textMuted }]}>
              Puedes revisar las preguntas, pero tus respuestas solo se guardan
              cuando hay una sesión activa.
            </Text>
          </View>
        )}

        {/* 1. Fecha de nacimiento: campo de texto con formato explícito (WCAG 3.3.2). */}
        <View style={styles.section}>
          <Text
            accessibilityRole="header"
            style={[typography.cardTitle, { color: colors.text }]}
          >
            1. ¿Cuál es tu fecha de nacimiento?
          </Text>
          <Text style={[typography.secondary, { color: colors.textMuted }]}>
            Formato año-mes-día, por ejemplo 2004-05-15.
          </Text>
          <TextInput
            value={form.birthDate}
            onChangeText={(text) => setField('birthDate', text)}
            placeholder="AAAA-MM-DD"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Fecha de nacimiento"
            accessibilityHint="Escribe año, mes y día separados por guiones"
            autoComplete="birthdate-full"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            style={[
              typography.body,
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.surface,
                borderColor: birthDateError ? colors.danger : colors.border,
                borderWidth: birthDateError ? 2 : 1,
              },
            ]}
          />
          {birthDateError && (
            <Text
              accessibilityLiveRegion="polite"
              style={[typography.secondary, styles.bold, { color: colors.danger }]}
            >
              ⚠ {birthDateError}
            </Text>
          )}
        </View>

        <OptionGroup
          title="2. ¿Dónde vives?"
          mode="single"
          options={options.municipalities.map((m) => ({ value: m.code, label: m.name }))}
          selected={form.municipalityCode ? [form.municipalityCode] : []}
          onToggle={(value) => setField('municipalityCode', value)}
          error={fieldErrors.municipalityCode}
        />
        <OptionGroup
          title="3. ¿Cuál es tu nivel de estudios?"
          mode="single"
          options={options.educationLevels}
          selected={form.educationLevel ? [form.educationLevel] : []}
          onToggle={(value) => setField('educationLevel', value)}
          error={fieldErrors.educationLevel}
        />
        <OptionGroup
          title="4. ¿Cuánta experiencia laboral tienes?"
          mode="single"
          options={options.experienceLevels}
          selected={form.experienceLevel ? [form.experienceLevel] : []}
          onToggle={(value) => setField('experienceLevel', value)}
          error={fieldErrors.experienceLevel}
        />
        <OptionGroup
          title="5. ¿Qué haces actualmente?"
          mode="single"
          options={options.situations}
          selected={form.currentSituation ? [form.currentSituation] : []}
          onToggle={(value) => setField('currentSituation', value)}
          error={fieldErrors.currentSituation}
        />
        <OptionGroup
          title="6. ¿Qué tipo de oportunidades te interesan?"
          mode="multiple"
          options={options.categories}
          selected={form.interests}
          onToggle={(value) => setField('interests', toggleInterest(form.interests, value))}
          error={fieldErrors.interests}
        />
        <OptionGroup
          title="7. ¿Qué disponibilidad de tiempo tienes?"
          mode="single"
          options={options.availabilities}
          selected={form.availability ? [form.availability] : []}
          onToggle={(value) => setField('availability', value)}
          error={fieldErrors.availability}
        />

        {notice && (
          <View
            accessible
            accessibilityRole={notice.tone === 'info' ? 'text' : 'alert'}
            style={[
              styles.banner,
              {
                backgroundColor: colors.surface,
                borderColor: notice.tone === 'info' ? colors.primary : colors.danger,
              },
            ]}
          >
            <Text style={[typography.body, { color: colors.text }]}>
              {notice.tone === 'info' ? 'ℹ ' : '⚠ '}
              {notice.text}
            </Text>
          </View>
        )}

        {notice?.tone === 'consent' && (
          <Pressable
            accessibilityRole="button"
            accessibilityHint="Abre la bienvenida para aceptar el tratamiento de datos"
            onPress={() => router.replace('/welcome')}
            style={[styles.secondaryButton, { borderColor: colors.primary }]}
          >
            <Text style={[typography.body, styles.bold, { color: colors.primary }]}>
              Ir a la bienvenida
            </Text>
          </Pressable>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityHint="Guarda tus respuestas y, si el perfil está completo, muestra tus recomendaciones"
          accessibilityState={{ disabled: !isSignedIn || isSaving, busy: isSaving }}
          disabled={!isSignedIn || isSaving}
          onPress={handleSave}
          style={({ pressed }) => [
            styles.submitButton,
            {
              backgroundColor: colors.primary,
              opacity: !isSignedIn ? 0.5 : pressed || isSaving ? 0.85 : 1,
            },
          ]}
        >
          {isSaving && <ActivityIndicator color={colors.onPrimary} />}
          <Text style={[typography.body, styles.bold, { color: colors.onPrimary }]}>
            {isSaving ? 'Guardando…' : 'Guardar y ver recomendaciones'}
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
    justifyContent: 'center',
    marginBottom: spacing.md,
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.md,
  },
  subtitle: {
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  banner: {
    borderRadius: 8,
    borderWidth: 1.5,
    gap: spacing.xs,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  section: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  input: {
    borderRadius: 8,
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    marginBottom: spacing.md,
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.lg,
  },
  submitButton: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  bold: {
    fontWeight: '700',
  },
});
