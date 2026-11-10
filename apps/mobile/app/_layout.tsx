import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { restoreSessionOnLaunch } from '../src/auth/actions';
import { store, useAppDispatch } from '../src/store';
import { useTheme } from '../src/theme/useTheme';

/** Layout raíz: provee el store de Redux y el área segura a todas las pantallas. */
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
  const { colors } = useTheme();
  const dispatch = useAppDispatch();

  // Al abrir la app se intenta recuperar la sesión con el refresh_token
  // guardado en el almacenamiento seguro (decisión 0002).
  useEffect(() => {
    void dispatch(restoreSessionOnLaunch());
  }, [dispatch]);

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}
