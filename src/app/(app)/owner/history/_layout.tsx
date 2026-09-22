import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';

export default function HistoryLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: Colors.light.primary,
        headerBackTitle: 'Back',
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: Colors.light.backgroundSubtle,
        },
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}>
      <Stack.Screen name="index" options={{ title: 'Audit Log' }} />
    </Stack>
  );
}
