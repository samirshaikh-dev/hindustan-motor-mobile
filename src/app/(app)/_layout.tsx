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
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Floor', tabBarLabel: 'Floor' }} />
      <Tabs.Screen name="motors" options={{ title: 'Motors', headerShown: false }} />
      <Tabs.Screen name="jobs" options={{ title: 'Jobs', headerShown: false }} />
      <Tabs.Screen name="tasks" options={{ title: 'Tasks', headerShown: false }} />
      <Tabs.Screen name="employees" options={{ title: 'Team', headerShown: false }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', headerShown: false }} />
      <Tabs.Screen name="history" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}
