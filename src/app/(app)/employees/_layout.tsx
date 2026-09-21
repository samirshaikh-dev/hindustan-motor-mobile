import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';

export default function EmployeesLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Team Roster' }} />
      <Stack.Screen name="create" options={{ title: 'Add Staff' }} />
      <Stack.Screen name="[id]" options={{ title: 'Staff Profile' }} />
    </Stack>
  );
}
