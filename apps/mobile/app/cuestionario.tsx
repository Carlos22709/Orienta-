import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithGoogleAction } from '../src/auth/actions';
import { SIGN_IN_MESSAGES } from '../src/auth/messages';
import { OptionGroup } from '../src/components/OptionGroup';
import { ErrorState } from '../src/components/states/ErrorState';
import {
  EMPTY_FORM,
  formFromProfile,
  readSaveProfileError,
  toggleInterest,
  toProfileUpdate,
  type ProfileFormState,
} from '../src/profile/profileForm';
import {
  ageOn,
  birthDateBounds,
  firstIncompleteStep,
  formatBirthDate,
  fromIsoDate,
  isStepComplete,
  STEPS,
  toIsoDate,
  type Step,
} from '../src/profile/questionnaire';
import { useAppDispatch, useAppSelector } from '../src/store';
import {
  useGetCatalogQuery,
  useGetProfileQuery,
  useUpdateProfileMutation,
} from '../src/store/api';
import { selectAuthStatus } from '../src/store/authSlice';
import { minTouchTarget, radius, spacing, typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';
import { Button } from '../src/ui/Button';
import { Notice, ProgressBar } from '../src/ui/layout';
import { Splash } from '../src/ui/Splash';

/** Pregunta y ayuda de cada paso, en lenguaje claro. */
const QUESTIONS: Record<Step, { title: string; help: string }> = {
  birthDate: {
    title: '¿Cuándo naciste?',
    help: 'Lo usamos solo para saber qué convocatorias aplican a tu edad.',
  },
  municipalityCode: {
    title: '¿Dónde vives?',
    help: 'Te mostramos oportunidades de tu municipio y las que son virtuales o nacionales.',
  },
  educationLevel: {
    title: '¿Cuál es tu nivel de estudios más alto?',
    help: 'Elige el último que terminaste o el que estás cursando.',
  },
  experienceLevel: {
    title: '¿Cuánta experiencia laboral tienes?',
    help: 'Cuenta trabajos formales, informales y prácticas.',
  },
  currentSituation: {
    title: '¿Qué estás haciendo ahora?',
    help: 'Así priorizamos lo que más te sirve en este momento.',
  },
  interests: {
    title: '¿Qué te interesa encontrar?',
    help: 'Puedes elegir varias opciones.',
  },
  availability: {
    title: '¿Cuánto tiempo tienes disponible?',
    help: 'Para recomendarte opciones que se ajusten a tu horario.',
  },
  consent: {
    title: 'Un último paso',
    help: 'Necesitamos tu autorización para usar estas respuestas.',
  },
};

/**
 * Cuestionario paso a paso (rediseño Amanecer). Una pregunta por pantalla,
 * con barra de progreso y respuestas que se tocan, no se escriben. La fecha
 * se elige con la rueda nativa del teléfono.
 *
 * Primera vez: al final pide iniciar sesión con Google y guarda el perfil.
 * Con ?modo=editar: retoma las respuestas guardadas y vuelve a Perfil.
 */
export default function QuestionnaireScreen() {
  const { colors, scheme } = useTheme();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { modo } = useLocalSearchParams<{ modo?: string }>();
  const editing = modo === 'editar';

  const authStatus = useAppSelector(selectAuthStatus);
  const isSignedIn = authStatus === 'signedIn';
  const catalog = useGetCatalogQuery();
  const saved = useGetProfileQuery(undefined, { skip: !isSignedIn });
  const [updateProfile] = useUpdateProfileMutation();

  const [form, setForm] = useState<ProfileFormState>(EMPTY_FORM);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const consentVersion = catalog.data?.consentVersion ?? null;
  const consentIsCurrent =
    saved.data?.profile?.consentVersion !== undefined &&
    saved.data.profile.consentVersion === consentVersion;

  // Al editar con el consentimiento vigente, no se vuelve a pedir.
  const steps = useMemo<readonly Step[]>(
    () => (editing && consentIsCurrent ? STEPS.filter((s) => s !== 'consent') : STEPS),
    [editing, consentIsCurrent],
  );

  // Retoma las respuestas guardadas una sola vez y solo si la persona ya
  // tenía sesión al abrir el cuestionario (no después de entrar con Google,
  // para no borrar lo que acaba de responder).
  const startedSignedIn = useRef(isSignedIn);
  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current || !startedSignedIn.current || !saved.data) return;
    loaded.current = true;
    const restored = formFromProfile(saved.data.profile);
    setForm(restored);
    const accepted = saved.data.profile?.consentVersion === consentVersion;
    setConsentAccepted(accepted);
    if (!editing) setStepIndex(firstIncompleteStep(restored, accepted));
  }, [saved.data, consentVersion, editing]);

  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const isLast = stepIndex >= steps.length - 1;
  const complete = isStepComplete(step, form, consentAccepted);

  const goTo = (index: number) => {
    setStepIndex(index);
    setFieldError(null);
    setMessage(null);
    const next = steps[index];
    AccessibilityInfo.announceForAccessibility(
      `Paso ${index + 1} de ${steps.length}. ${QUESTIONS[next].title}`,
    );
  };

  const goBack = () => {
    if (stepIndex > 0) goTo(stepIndex - 1);
    else if (router.canGoBack()) router.back();
    else router.replace('/bienvenida');
  };

  const save = async () => {
    if (!catalog.data) return;
    const needsConsent = consentAccepted && !consentIsCurrent;
    try {
      await updateProfile(toProfileUpdate(form, needsConsent ? catalog.data.consentVersion : null)).unwrap();
      AccessibilityInfo.announceForAccessibility('Respuestas guardadas');
      if (editing && router.canGoBack()) router.back();
      else router.replace('/para-ti');
    } catch (error) {
      const result = readSaveProfileError(error);
      if (result.kind === 'validation') {
        const field = Object.keys(result.fields)[0] as Step | undefined;
        const index = field ? steps.indexOf(field) : -1;
        if (index >= 0) {
          setStepIndex(index);
          setFieldError(result.fields[field!]);
          return;
        }
      }
      if (result.kind === 'consent_required') {
        const index = steps.indexOf('consent');
        if (index >= 0) setStepIndex(index);
      }
      setMessage(result.message);
      AccessibilityInfo.announceForAccessibility(result.message);
    }
  };

  const finish = async () => {
    setBusy(true);
    setMessage(null);
    if (!isSignedIn) {
      const outcome = await dispatch(signInWithGoogleAction());
      if (outcome !== 'signed_in') {
        setBusy(false);
        setMessage(SIGN_IN_MESSAGES[outcome]);
        AccessibilityInfo.announceForAccessibility(SIGN_IN_MESSAGES[outcome]);
        return;
      }
    }
    await save();
    setBusy(false);
  };

  if (catalog.isError) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
        <View style={styles.body}>
          <ErrorState
            title="No pudimos cargar las preguntas"
            message="Revisa tu conexión e intenta de nuevo."
            onRetry={catalog.refetch}
            isRetrying={catalog.isFetching}
          />
        </View>
      </SafeAreaView>
    );
  }
  if (!catalog.data || (editing && isSignedIn && saved.isLoading)) {
    return <Splash />;
  }

  const options = catalog.data;
  const question = QUESTIONS[step];
  const finishLabel = editing
    ? 'Guardar cambios'
    : isSignedIn
      ? 'Ver mis oportunidades'
      : 'Continuar con Google';

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={styles.top}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={stepIndex > 0 ? 'Pregunta anterior' : 'Salir del cuestionario'}
          onPress={goBack}
          hitSlop={8}
          style={styles.iconButton}
        >
          <Ionicons name="chevron-back" size={26} color={colors.primary} />
        </Pressable>
        <View style={styles.progress}>
          <ProgressBar step={stepIndex + 1} total={steps.length} />
        </View>
        <Text style={[typography.label, { color: colors.textMuted }]}>
          {stepIndex + 1}/{steps.length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.text }]}>
          {question.title}
        </Text>
        <Text style={[typography.body, { color: colors.textMuted }]}>{question.help}</Text>

        {step === 'birthDate' && (
          <BirthDateStep
            value={form.birthDate}
            scheme={scheme}
            onChange={(value) => setForm({ ...form, birthDate: value })}
          />
        )}

        {step === 'municipalityCode' && (
          <OptionGroup
            title={question.title}
            hideTitle
            mode="single"
            options={options.municipalities.map((m) => ({ value: m.code, label: m.name }))}
            selected={form.municipalityCode ? [form.municipalityCode] : []}
            onToggle={(value) => setForm({ ...form, municipalityCode: value })}
            error={fieldError}
          />
        )}
        {step === 'educationLevel' && (
          <OptionGroup
            title={question.title}
            hideTitle
            mode="single"
            options={options.educationLevels}
            selected={form.educationLevel ? [form.educationLevel] : []}
            onToggle={(value) => setForm({ ...form, educationLevel: value })}
            error={fieldError}
          />
        )}
        {step === 'experienceLevel' && (
          <OptionGroup
            title={question.title}
            hideTitle
            mode="single"
            options={options.experienceLevels}
            selected={form.experienceLevel ? [form.experienceLevel] : []}
            onToggle={(value) => setForm({ ...form, experienceLevel: value })}
            error={fieldError}
          />
        )}
        {step === 'currentSituation' && (
          <OptionGroup
            title={question.title}
            hideTitle
            mode="single"
            options={options.situations}
            selected={form.currentSituation ? [form.currentSituation] : []}
            onToggle={(value) => setForm({ ...form, currentSituation: value })}
            error={fieldError}
          />
        )}
        {step === 'interests' && (
          <OptionGroup
            title={question.title}
            hideTitle
            mode="multiple"
            options={options.categories}
            selected={form.interests}
            onToggle={(value) => setForm({ ...form, interests: toggleInterest(form.interests, value) })}
            error={fieldError}
          />
        )}
        {step === 'availability' && (
          <OptionGroup
            title={question.title}
            hideTitle
            mode="single"
            options={options.availabilities}
            selected={form.availability ? [form.availability] : []}
            onToggle={(value) => setForm({ ...form, availability: value })}
            error={fieldError}
          />
        )}

        {step === 'consent' && (
          <ConsentStep
            accepted={consentAccepted}
            onToggle={() => {
              const next = !consentAccepted;
              setConsentAccepted(next);
              AccessibilityInfo.announceForAccessibility(
                next ? 'Autorización marcada' : 'Autorización desmarcada',
              );
            }}
          />
        )}

        {step === 'birthDate' && fieldError ? <Notice text={fieldError} tone="error" /> : null}
        {message ? <Notice text={message} tone="error" /> : null}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.divider }]}>
        {isLast ? (
          <Button
            label={busy ? 'Un momento…' : finishLabel}
            icon={isSignedIn || editing ? 'checkmark' : 'logo-google'}
            busy={busy}
            disabled={!complete}
            hint={
              isSignedIn
                ? 'Guarda tus respuestas'
                : 'Abre el navegador del sistema para crear tu cuenta con Google y guardar tus respuestas'
            }
            onPress={() => void finish()}
          />
        ) : (
          <Button
            label="Continuar"
            icon="arrow-forward"
            disabled={!complete}
            onPress={() => goTo(stepIndex + 1)}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

/** Fecha de nacimiento con la rueda nativa (iOS) o el selector del sistema (Android). */
function BirthDateStep({
  value,
  scheme,
  onChange,
}: {
  value: string;
  scheme: 'light' | 'dark';
  onChange: (value: string) => void;
}) {
  const { colors } = useTheme();
  const today = new Date();
  const bounds = birthDateBounds(today);
  const current = value ? fromIsoDate(value) : bounds.initial;

  // En iOS la rueda muestra una fecha desde el inicio: se toma como respuesta
  // para que "Continuar" no quede bloqueado si la persona no la mueve.
  useEffect(() => {
    if (Platform.OS === 'ios' && !value) onChange(toIsoDate(bounds.initial));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAndroid = () =>
    DateTimePickerAndroid.open({
      value: current,
      mode: 'date',
      display: 'spinner',
      minimumDate: bounds.minimum,
      maximumDate: bounds.maximum,
      onValueChange: (_event, date) => onChange(toIsoDate(date)),
    });

  return (
    <View style={styles.dateBlock}>
      {value ? (
        <View
          accessible
          accessibilityLabel={`Fecha elegida: ${formatBirthDate(value)}. Tienes ${ageOn(value, today)} años.`}
          style={[styles.dateSummary, { backgroundColor: colors.chip }]}
        >
          <Ionicons name="calendar" size={22} color={colors.chipText} />
          <View>
            <Text style={[typography.bodyStrong, { color: colors.chipText }]}>
              {formatBirthDate(value)}
            </Text>
            <Text style={[typography.secondary, { color: colors.chipText }]}>
              Tienes {ageOn(value, today)} años
            </Text>
          </View>
        </View>
      ) : null}

      {Platform.OS === 'ios' ? (
        <View style={[styles.wheel, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
          <DateTimePicker
            value={current}
            mode="date"
            display="spinner"
            locale="es-CO"
            themeVariant={scheme}
            textColor={colors.text}
            minimumDate={bounds.minimum}
            maximumDate={bounds.maximum}
            onValueChange={(_event, date) => onChange(toIsoDate(date))}
            accessibilityLabel="Fecha de nacimiento"
          />
        </View>
      ) : (
        <Button
          label={value ? 'Cambiar fecha' : 'Elegir fecha'}
          variant="secondary"
          icon="calendar-outline"
          onPress={openAndroid}
        />
      )}
      <Text style={[typography.secondary, { color: colors.textMuted }]}>
        Orienta+ es para jóvenes de 18 a 29 años.
      </Text>
    </View>
  );
}

/** Autorización de tratamiento de datos (Ley 1581 de 2012). */
function ConsentStep({ accepted, onToggle }: { accepted: boolean; onToggle: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.consent}>
      <View style={[styles.consentCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
        <ConsentLine icon="checkmark-circle" color={colors.success} text="Usamos tu edad, municipio, estudios, experiencia, situación, intereses y disponibilidad solo para recomendarte oportunidades." />
        <ConsentLine icon="close-circle" color={colors.danger} text="No pedimos hojas de vida, no somos agencia de empleo y no compartimos tus datos con terceros." />
        <ConsentLine icon="download" color={colors.primary} text="Puedes descargar o eliminar tus datos cuando quieras desde Perfil." />
      </View>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: accepted }}
        accessibilityLabel="Autorizo el uso de mis datos para recibir recomendaciones de oportunidades, según la Ley 1581 de 2012"
        onPress={onToggle}
        style={({ pressed }) => [
          styles.consentToggle,
          {
            backgroundColor: accepted ? colors.chip : colors.surface,
            borderColor: accepted ? colors.primary : colors.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Ionicons
          name={accepted ? 'checkbox' : 'square-outline'}
          size={26}
          color={accepted ? colors.primary : colors.textMuted}
        />
        <Text style={[typography.body, styles.flex, { color: colors.text }]}>
          Autorizo el uso de mis datos para recibir recomendaciones (Ley 1581 de 2012).
        </Text>
      </Pressable>
    </View>
  );
}

function ConsentLine({
  icon,
  color,
  text,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  text: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.consentLine}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[typography.secondary, styles.flex, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  iconButton: {
    width: minTouchTarget,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progress: { flex: 1 },
  body: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  dateBlock: { gap: spacing.md },
  dateSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  wheel: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  consent: { gap: spacing.lg },
  consentCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  consentLine: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  consentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    padding: spacing.lg,
    minHeight: minTouchTarget,
  },
});
