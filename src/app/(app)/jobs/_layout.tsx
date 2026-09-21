import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';

export default function JobsLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Jobs' }} />
      <Stack.Screen name="create" options={{ title: 'New Job' }} />
      <Stack.Screen name="[id]/index" options={{ title: 'Job Detail' }} />
      <Stack.Screen name="[id]/add-task" options={{ title: 'Add Task' }} />
      <Stack.Screen name="[id]/history" options={{ title: 'Job History' }} />
    </Stack>
  );
}
