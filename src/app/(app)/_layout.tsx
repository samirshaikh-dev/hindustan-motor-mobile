import { Redirect, Tabs } from 'expo-router';

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
        tabBarActiveTintColor: '#0284c7',
        tabBarInactiveTintColor: '#94a3b8',
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarLabel: 'Home' }} />
      <Tabs.Screen name="motors" options={{ title: 'Motors', headerShown: false }} />
      <Tabs.Screen name="jobs" options={{ title: 'Jobs', headerShown: false }} />
      <Tabs.Screen name="tasks" options={{ title: 'Tasks', headerShown: false }} />
      <Tabs.Screen name="employees" options={{ title: 'Team', headerShown: false }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', headerShown: false }} />
      <Tabs.Screen name="history" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}
