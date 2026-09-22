import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { Pressable } from 'react-native';

import { Colors } from '@/constants/theme';

export default function EmployeesLayout() {
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
      <Stack.Screen
        name="index"
        options={{
          title: 'Team Roster',
          headerRight: () => (
            <Pressable
              hitSlop={12}
              onPress={() => router.push('/(app)/owner/employees/create')}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 4 }]}
              accessibilityLabel="Add Staff Member">
              <Ionicons name="add" size={26} color={Colors.light.primary} />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen name="create" options={{ title: 'Add Staff' }} />
      <Stack.Screen name="[id]" options={{ title: 'Staff Profile' }} />
    </Stack>
  );
}
