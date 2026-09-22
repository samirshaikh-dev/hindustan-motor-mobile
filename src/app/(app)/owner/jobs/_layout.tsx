import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { Pressable } from 'react-native';

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
      <Stack.Screen
        name="index"
        options={{
          title: 'Jobs',
          headerRight: () => (
            <Pressable
              hitSlop={12}
              onPress={() => router.push('/(app)/shared/jobs/create')}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 4 }]}
              accessibilityLabel="Create New Job">
              <Ionicons name="add" size={26} color={Colors.light.primary} />
            </Pressable>
          ),
        }}
      />
    </Stack>
  );
}
