import { Stack } from 'expo-router';

export default function HistoryLayout() {
  return (
    <Stack screenOptions={{ headerTintColor: '#0284c7' }}>
      <Stack.Screen name="index" options={{ title: 'Activity Audit Log' }} />
    </Stack>
  );
}
