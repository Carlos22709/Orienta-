import { setAudioModeAsync } from 'expo-audio';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { pickSpanishVoice } from '../a11y/speechText';
import { Button } from '../ui/Button';
import { Notice } from '../ui/layout';
import { notifyError } from '../ui/feedback';

const SPEECH_FAILED =
  'No pudimos leer en voz alta en este teléfono. Revisa el volumen o usa VoiceOver o TalkBack.';

/**
 * Lee en voz alta un texto con una voz en español del teléfono (expo-speech).
 * Pensado para personas con baja visión o con dificultad para leer textos
 * largos. Complementa, no reemplaza, a VoiceOver y TalkBack.
 *
 * - iOS calla la voz sintetizada con el interruptor de silencio; por eso se
 *   pide reproducir aunque el teléfono esté en silencio (expo-audio), como
 *   hacen las apps de lectura.
 * - Se usa una voz en español que el teléfono sí tenga instalada.
 */
export function ListenButton({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);
  const [failed, setFailed] = useState(false);

  // Al salir de la pantalla se detiene la lectura.
  useEffect(() => () => void Speech.stop(), []);

  const fail = () => {
    setSpeaking(false);
    setFailed(true);
    notifyError(SPEECH_FAILED);
  };

  const start = async () => {
    setSpeaking(true);
    setFailed(false);
    try {
      await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers' });
    } catch {
      // Si no se puede cambiar el modo de audio, se intenta leer igual.
    }
    let voice: Speech.Voice | null = null;
    try {
      voice = pickSpanishVoice(await Speech.getAvailableVoicesAsync());
    } catch {
      // Sin lista de voces, el sistema elige una para el idioma.
    }
    Speech.speak(text, {
      language: voice?.language ?? 'es-MX',
      voice: voice?.identifier,
      rate: 0.95,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: fail,
    });
  };

  const toggle = () => {
    if (speaking) {
      void Speech.stop();
      setSpeaking(false);
      return;
    }
    start().catch(fail);
  };

  return (
    <>
      <Button
        label={speaking ? 'Detener lectura' : 'Escuchar'}
        icon={speaking ? 'stop-circle-outline' : 'volume-high-outline'}
        variant="secondary"
        hint={speaking ? 'Detiene la lectura en voz alta' : 'Lee en voz alta esta oportunidad'}
        onPress={toggle}
      />
      {failed ? <Notice text={SPEECH_FAILED} tone="error" /> : null}
    </>
  );
}
