import { Stack } from 'expo-router';

export default function JobsLayout() {
  return (
    <Stack screenOptions={{ headerTintColor: '#0284c7' }}>
      <Stack.Screen name="index" options={{ title: 'Jobs' }} />
      <Stack.Screen name="create" options={{ title: 'New Job' }} />
      <Stack.Screen name="[id]/index" options={{ title: 'Job detail' }} />
      <Stack.Screen name="[id]/add-task" options={{ title: 'Add task' }} />
      <Stack.Screen name="[id]/history" options={{ title: 'Job history' }} />
    </Stack>
  );
}
