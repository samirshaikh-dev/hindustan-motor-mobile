import { Stack } from 'expo-router';

export default function TasksLayout() {
  return (
    <Stack screenOptions={{ headerTintColor: '#0284c7' }}>
      <Stack.Screen name="index" options={{ title: 'My tasks' }} />
      <Stack.Screen name="[id]" options={{ title: 'Task detail' }} />
    </Stack>
  );
}
