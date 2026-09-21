import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';

export default function AppLayout() {
  const activeActorId = useAuthStore((s) => s.activeActorId);

  if (!activeActorId) {
    return <Redirect href="/(auth)/select-actor" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.light.tabActive,
        tabBarInactiveTintColor: Colors.light.tabInactive,
        tabBarStyle: {
          backgroundColor: Colors.light.surface,
          borderTopColor: Colors.light.border,
          borderTopWidth: 1,
          height: 56,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Floor',
          tabBarLabel: 'Floor',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'grid' : 'grid-outline'}
              size={size ?? 20}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="motors"
        options={{
          title: 'Motors',
          tabBarLabel: 'Motors',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'hardware-chip' : 'hardware-chip-outline'}
              size={size ?? 20}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          tabBarLabel: 'Jobs',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'document-text' : 'document-text-outline'}
              size={size ?? 20}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarLabel: 'Tasks',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'checkbox' : 'checkbox-outline'}
              size={size ?? 20}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="employees"
        options={{
          title: 'Team',
          tabBarLabel: 'Team',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'people' : 'people-outline'}
              size={size ?? 20}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'settings' : 'settings-outline'}
              size={size ?? 20}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen name="history" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}
