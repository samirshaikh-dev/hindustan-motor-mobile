import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { systemClient } from '@/api/client';
import { Button } from '@/components/common/Button';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { ENV } from '@/config/env';
import { queryKeys } from '@/config/queryKeys';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';

export default function SettingsScreen() {
  const { activeActorName, activeActorRole, accessToken, logout, clearActiveActor } = useAuthStore();

  const healthQuery = useQuery({
    queryKey: queryKeys.system.health,
    queryFn: async () => {
      const res = await systemClient.get('/health');
      return res.data.data;
    },
  });

  const signOut = async () => {
    if (accessToken) {
      await authService.logout();
    }
    await logout();
    router.replace('/(auth)/select-actor');
  };

  return (
    <ScreenWrapper showContactCta>
      <View style={styles.card}>
        <Text style={styles.label}>Active Profile</Text>
        <Text style={styles.value}>{activeActorName ?? 'Technician'}</Text>
        <Text style={styles.meta}>Role: {activeActorRole}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>API Server Endpoint</Text>
        <Text style={styles.meta}>{ENV.API_BASE_URL}</Text>
        <Text style={styles.meta}>
          Status: {healthQuery.data?.status === 'healthy' ? 'Online / Connected' : 'Unavailable'}
        </Text>
      </View>

      <View style={styles.btnGroup}>
        <Button
          title="View Activity Audit Log"
          variant="secondary"
          onPress={() => router.push('/(app)/history')}
        />

        <Button
          title="Switch Shop-Floor Profile"
          variant="secondary"
          onPress={async () => {
            await clearActiveActor();
            router.replace('/(auth)/select-actor');
          }}
        />

        {!accessToken ? (
          <Button
            title="Sign in as Workshop Owner"
            variant="secondary"
            onPress={() => router.push('/(auth)/login')}
          />
        ) : null}

        <Button title="Sign out" variant="danger" onPress={signOut} />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  label: { color: '#64748b', fontSize: 12, textTransform: 'uppercase', fontWeight: '700' },
  value: { fontSize: 18, fontWeight: '700', marginTop: 4, color: '#0f172a' },
  meta: { color: '#64748b', marginTop: 4, fontSize: 13 },
  btnGroup: { gap: 10, marginTop: 10 },
});
