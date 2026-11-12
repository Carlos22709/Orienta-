import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { useAppSelector } from '../../src/store';
import { selectAuthStatus } from '../../src/store/authSlice';
import { fonts } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: ReadonlyArray<{ name: string; title: string; icon: IconName; active: IconName }> = [
  { name: 'para-ti', title: 'Para ti', icon: 'star-outline', active: 'star' },
  { name: 'explorar', title: 'Explorar', icon: 'search-outline', active: 'search' },
  { name: 'guardadas', title: 'Guardadas', icon: 'heart-outline', active: 'heart' },
  { name: 'perfil', title: 'Perfil', icon: 'person-circle-outline', active: 'person-circle' },
];

/** Pestañas principales. Sin sesión, vuelve a la bienvenida. */
export default function TabsLayout() {
  const { colors } = useTheme();
  const status = useAppSelector(selectAuthStatus);

  if (status === 'signedOut') {
    return <Redirect href="/bienvenida" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.divider,
          minHeight: 60,
        },
        tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 12 },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarAccessibilityLabel: tab.title,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? tab.active : tab.icon} size={24} color={String(color)} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
