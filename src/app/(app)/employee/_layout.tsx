import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';

export default function EmployeeLayout() {
  const activeActorRole = useAuthStore((s) => s.activeActorRole);

  if (activeActorRole !== 'EMPLOYEE') {
    return <Redirect href="/(app)/owner" />;
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
          title: 'Today',
          tabBarLabel: 'Today',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'today' : 'today-outline'}
              size={size ?? 20}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'My Work',
          tabBarLabel: 'My Work',
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
        name="team"
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
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'person-circle' : 'person-circle-outline'}
              size={size ?? 20}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}