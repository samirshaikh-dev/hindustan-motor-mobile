import { Redirect, Stack } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';

const sharedHeader = {
  headerShown: true,
  headerTintColor: Colors.light.primary,
  headerBackTitle: 'Back',
  headerShadowVisible: false,
  headerStyle: {
    backgroundColor: Colors.light.backgroundSubtle,
  },
  headerTitleStyle: {
    fontWeight: '600' as const,
  },
};

export default function AppLayout() {
  const activeActorId = useAuthStore((s) => s.activeActorId);

  if (!activeActorId) {
    return <Redirect href="/(auth)/select-actor" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="owner" />
      <Stack.Screen name="employee" />

      <Stack.Screen
        name="shared/motor/[id]/index"
        options={{ title: 'Motor Detail', ...sharedHeader }}
      />
      <Stack.Screen
        name="shared/motor/[id]/edit"
        options={{ title: 'Edit Motor', ...sharedHeader }}
      />
      <Stack.Screen
        name="shared/motor/[id]/upload"
        options={{ title: 'Upload Photo', ...sharedHeader }}
      />
      <Stack.Screen
        name="shared/motor/[id]/history"
        options={{ title: 'Motor History', ...sharedHeader }}
      />
      <Stack.Screen
        name="shared/motors/register"
        options={{ title: 'Register Motor', ...sharedHeader }}
      />
      <Stack.Screen
        name="shared/jobs/create"
        options={{ title: 'Create Job', ...sharedHeader }}
      />
      <Stack.Screen
        name="shared/job/[id]/index"
        options={{ title: 'Job Detail', ...sharedHeader }}
      />
      <Stack.Screen
        name="shared/job/[id]/add-task"
        options={{ title: 'Add Task', ...sharedHeader }}
      />
      <Stack.Screen
        name="shared/job/[id]/history"
        options={{ title: 'Job History', ...sharedHeader }}
      />
      <Stack.Screen
        name="shared/task/[id]"
        options={{ title: 'Task Detail', ...sharedHeader }}
      />
    </Stack>
  );
}