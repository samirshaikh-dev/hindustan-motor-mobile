import { Redirect, Stack } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';

export default function AuthLayout() {
  const activeActorId = useAuthStore((s) => s.activeActorId);
  const activeActorRole = useAuthStore((s) => s.activeActorRole);

  if (activeActorId) {
    return (
      <Redirect
        href={
          activeActorRole === 'OWNER'
            ? '/(app)/owner'
            : '/(app)/employee'
        }
      />
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        title: 'Workshop Sign In',
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
      <Stack.Screen name="select-actor" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen
        name="staff-select"
        options={{
          title: 'Select Staff Profile',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
