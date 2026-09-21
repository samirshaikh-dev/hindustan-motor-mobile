import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';

export default function TasksLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Tasks' }} />
      <Stack.Screen name="[id]" options={{ title: 'Task Detail' }} />
    </Stack>
  );
}
