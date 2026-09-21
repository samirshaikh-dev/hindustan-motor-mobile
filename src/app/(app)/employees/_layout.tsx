import { Stack } from 'expo-router';

export default function EmployeesLayout() {
  return (
    <Stack screenOptions={{ headerTintColor: '#0284c7' }}>
      <Stack.Screen name="index" options={{ title: 'Team' }} />
      <Stack.Screen name="create" options={{ title: 'Add employee' }} />
      <Stack.Screen name="[id]" options={{ title: 'Employee' }} />
    </Stack>
  );
}
