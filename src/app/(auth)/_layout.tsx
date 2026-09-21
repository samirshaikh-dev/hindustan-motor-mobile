import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/store/useAuthStore';

export default function AuthLayout() {
  const activeActorId = useAuthStore((s) => s.activeActorId);

  if (activeActorId) {
    return <Redirect href="/(app)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: true, title: 'Workshop Sign In' }}>
      <Stack.Screen name="select-actor" options={{ title: 'Select Profile' }} />
      <Stack.Screen name="login" options={{ title: 'Owner Login' }} />
    </Stack>
  );
}
