import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';

export default function MotorsLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: Colors.light.primary,
        headerBackTitle: 'Back',
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: Colors.light.background,
        },
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}>
      <Stack.Screen name="index" options={{ title: 'Motors' }} />
      <Stack.Screen name="register" options={{ title: 'Register Motor' }} />
      <Stack.Screen name="[id]/index" options={{ title: 'Motor Detail' }} />
      <Stack.Screen name="[id]/edit" options={{ title: 'Edit Motor' }} />
      <Stack.Screen name="[id]/upload" options={{ title: 'Upload Photo' }} />
      <Stack.Screen name="[id]/history" options={{ title: 'Motor History' }} />
    </Stack>
  );
}
