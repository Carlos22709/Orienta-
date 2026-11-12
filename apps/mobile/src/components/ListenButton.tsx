import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { Button } from '../ui/Button';

/**
 * Lee en voz alta un texto con la voz en español del teléfono (expo-speech).
 * Pensado para personas con baja visión o con dificultad para leer textos
 * largos. Si VoiceOver o TalkBack están activos, la persona puede preferir su
 * lector; este botón no lo reemplaza, lo complementa.
 */
export function ListenButton({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);

  // Al salir de la pantalla se detiene la lectura.
  useEffect(() => () => void Speech.stop(), []);

  const toggle = () => {
    if (speaking) {
      void Speech.stop();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    Speech.speak(text, {
      language: 'es-CO',
      rate: 0.95,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  return (
    <Button
      label={speaking ? 'Detener lectura' : 'Escuchar'}
      icon={speaking ? 'stop-circle-outline' : 'volume-high-outline'}
      variant="secondary"
      hint={speaking ? 'Detiene la lectura en voz alta' : 'Lee en voz alta esta oportunidad'}
      onPress={toggle}
    />
  );
}
