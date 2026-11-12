import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { signInWithGoogleAction } from '../src/auth/actions';
import { SIGN_IN_MESSAGES, SIGNED_OUT_MESSAGES } from '../src/auth/messages';
import { useAppDispatch, useAppSelector } from '../src/store';
import { selectSignedOutReason } from '../src/store/authSlice';
import { spacing, typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';
import { Button } from '../src/ui/Button';
import { Notice } from '../src/ui/layout';
import { LogoMark, Wordmark } from '../src/ui/Logo';

const HIGHLIGHTS = [
  { icon: 'shield-checkmark', text: 'Solo oportunidades reales y verificadas' },
  { icon: 'sparkles', text: '4 o 5 opciones pensadas para ti, no cientos' },
  { icon: 'heart', text: 'Gratis y sin intermediarios' },
] as const;

/**
 * Bienvenida: logo al centro, la propuesta de valor en una frase y un botón
 * para empezar el cuestionario. Quien ya tiene cuenta puede entrar directo.
 */
export default function WelcomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const signedOutReason = useAppSelector(selectSignedOutReason);
  const [signingIn, setSigningIn] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const notice = message ?? (signedOutReason ? SIGNED_OUT_MESSAGES[signedOutReason] : null);

  const handleSignIn = async () => {
    setSigningIn(true);
    setMessage(null);
    const outcome = await dispatch(signInWithGoogleAction());
    setSigningIn(false);
    if (outcome === 'signed_in') {
      AccessibilityInfo.announceForAccessibility('Sesión iniciada');
      router.replace('/');
      return;
    }
    setMessage(SIGN_IN_MESSAGES[outcome]);
    AccessibilityInfo.announceForAccessibility(SIGN_IN_MESSAGES[outcome]);
  };

  return (
    <View style={styles.flex}>
      <Svg style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Defs>
          <LinearGradient id="amanecer" x1="0" y1="0" x2="0.4" y2="1">
            <Stop offset="0" stopColor={colors.gradientStart} />
            <Stop offset="1" stopColor={colors.gradientEnd} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#amanecer)" />
      </Svg>

      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <LogoMark size={112} />
            <Wordmark size={34} />
            <Text style={[typography.display, styles.center, { color: colors.text }]}>
              ¿Buscas tu siguiente paso?
            </Text>
            <Text style={[typography.body, styles.center, { color: colors.textMuted }]}>
              Responde unas preguntas rápidas y te mostramos oportunidades reales de empleo,
              estudio, becas y emprendimiento en Bogotá y la Sabana.
            </Text>

            <View style={styles.highlights}>
              {HIGHLIGHTS.map((item) => (
                <View key={item.text} style={styles.highlight}>
                  <Ionicons name={item.icon} size={20} color={colors.primary} />
                  <Text style={[typography.secondary, styles.highlightText, { color: colors.text }]}>
                    {item.text}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.actions}>
            {notice ? <Notice text={notice} /> : null}
            <Button
              label="Empezar"
              icon="arrow-forward"
              hint="Abre el cuestionario para conocerte"
              onPress={() => router.push('/cuestionario')}
            />
            <Button
              label={signingIn ? 'Abriendo Google…' : 'Ya tengo cuenta'}
              variant="ghost"
              busy={signingIn}
              hint="Inicia sesión con tu cuenta de Google en el navegador del sistema"
              onPress={() => void handleSignIn()}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.xl,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  center: { textAlign: 'center' },
  highlights: { gap: spacing.sm, marginTop: spacing.md, alignSelf: 'stretch' },
  highlight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  highlightText: { flex: 1 },
  actions: { gap: spacing.sm },
});
