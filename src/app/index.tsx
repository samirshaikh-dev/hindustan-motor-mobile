import { Redirect } from 'expo-router';

import { useAuthStore } from '@/store/useAuthStore';

export default function RootIndex() {
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

  return <Redirect href="/(auth)/select-actor" />;
}
