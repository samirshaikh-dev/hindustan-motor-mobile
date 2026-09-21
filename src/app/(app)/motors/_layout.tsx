import { Stack } from 'expo-router';

export default function MotorsLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: '#0284c7',
        headerBackTitle: 'Back',
      }}>
      <Stack.Screen name="index" options={{ title: 'Motors' }} />
      <Stack.Screen name="register" options={{ title: 'Register motor' }} />
      <Stack.Screen name="[id]/index" options={{ title: 'Motor detail' }} />
      <Stack.Screen name="[id]/edit" options={{ title: 'Edit motor' }} />
      <Stack.Screen name="[id]/upload" options={{ title: 'Upload photo' }} />
      <Stack.Screen name="[id]/history" options={{ title: 'Motor history' }} />
    </Stack>
  );
}
