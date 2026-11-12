import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/nunito';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { restoreSessionOnLaunch } from '../src/auth/actions';
import { forgetLegacySavedList } from '../src/saved/legacyCleanup';
import { loadSettings, persistSettings } from '../src/settings/persistence';
import { store, useAppDispatch, useAppSelector } from '../src/store';
import { selectSettings } from '../src/store/settingsSlice';
import { applyTextScale } from '../src/theme/tokens';
import { setHapticsEnabled } from '../src/ui/feedback';
import { useTheme } from '../src/theme/useTheme';

/** Layout raíz: store de Redux, área segura y tipografía Nunito. */
export default function RootLayout() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <ThemedStack />
      </SafeAreaProvider>
    </Provider>
  );
}

function ThemedStack() {
  const { colors, scheme } = useTheme();
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectSettings);

  // Ajustes de accesibilidad: se aplican antes de dibujar las pantallas, para
  // que todas usen el tamaño de texto y la vibración elegidos.
  applyTextScale(settings.textScale);
  setHapticsEnabled(settings.haptics);
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    // Recupera la sesión con el refresh_token guardado (decisión 0002) y los
    // ajustes de accesibilidad del teléfono.
    void dispatch(restoreSessionOnLaunch());
    void loadSettings(dispatch);
    void forgetLegacySavedList();
    const stopSettings = persistSettings(store);
    return stopSettings;
  }, [dispatch]);

  if (!fontsLoaded || !settings.hydrated) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}
