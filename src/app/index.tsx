import { Redirect } from 'expo-router';

import { useAuthStore } from '@/store/useAuthStore';

export default function RootIndex() {
  const activeActorId = useAuthStore((s) => s.activeActorId);

  if (activeActorId) {
    return <Redirect href="/(app)" />;
  }

  return <Redirect href="/(auth)/select-actor" />;
}
