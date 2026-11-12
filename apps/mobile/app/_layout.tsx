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
import { loadSaved, persistSaved } from '../src/saved/persistence';
import { store, useAppDispatch } from '../src/store';
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
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    // Recupera la sesión con el refresh_token guardado (decisión 0002) y la
    // lista de guardadas del teléfono.
    void dispatch(restoreSessionOnLaunch());
    void loadSaved(dispatch);
    return persistSaved(store);
  }, [dispatch]);

  if (!fontsLoaded) {
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
