import { router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { systemClient } from '@/api/client';
import { parseApiError } from '@/api/errors';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ErrorBanner } from '@/components/feedback/ErrorBanner';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { useEmployeeStatusDashboard } from '@/hooks/useEmployees';
import { useAuthStore } from '@/store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/config/queryKeys';

export default function DashboardScreen() {
  const name = useAuthStore((s) => s.activeActorName);
  const role = useAuthStore((s) => s.activeActorRole);

  const statusQuery = useEmployeeStatusDashboard();

  const healthQuery = useQuery({
    queryKey: queryKeys.system.health,
    queryFn: async () => {
      const res = await systemClient.get('/health');
      return res.data.data;
    },
  });

  const loading = statusQuery.isLoading || healthQuery.isLoading;
  const error = statusQuery.error || healthQuery.error;

  const team = statusQuery.data ?? [];
  const activeStaffCount = team.filter((e) => e.isActive).length;
  const totalActiveTasks = team.reduce((acc, curr) => acc + (curr.activeTaskCount || 0), 0);

  return (
    <ScreenWrapper
      showContactCta
      refreshing={statusQuery.isRefetching}
      onRefresh={() => {
        statusQuery.refetch();
        healthQuery.refetch();
      }}>
      <View style={styles.topHeader}>
        <Text style={styles.greeting}>Welcome, {name ?? 'Technician'}</Text>
        <StatusBadge status={role} />
      </View>
      <Text style={styles.sub}>Hindustan Electricals Winding Works — Floor Overview</Text>

      {loading ? (
        <ActivityIndicator color="#0284c7" style={{ marginTop: 24 }} />
      ) : error ? (
        <ErrorBanner
          message={parseApiError(error).message}
          onRetry={() => {
            statusQuery.refetch();
            healthQuery.refetch();
          }}
        />
      ) : (
        <>
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Active Tasks</Text>
              <Text style={styles.kpiValue}>{totalActiveTasks}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Floor Staff</Text>
              <Text style={styles.kpiValue}>{activeStaffCount}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Server</Text>
              <Text style={[styles.kpiValue, styles.kpiOnline]}>
                {healthQuery.data?.status === 'healthy' ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>

          <View style={styles.quickActions}>
            <Button
              title="Register Incoming Motor"
              onPress={() => router.push('/(app)/motors/register')}
            />
            <View style={styles.actionRow}>
              <View style={styles.half}>
                <Button
                  title="Jobs Board"
                  variant="secondary"
                  onPress={() => router.push('/(app)/jobs')}
                />
              </View>
              <View style={styles.half}>
                <Button
                  title="Audit Log"
                  variant="secondary"
                  onPress={() => router.push('/(app)/history')}
                />
              </View>
            </View>
          </View>

          <Text style={styles.section}>Team Workload</Text>
          {team.map((row) => (
            <Pressable
              key={row.id}
              style={styles.row}
              onPress={() => router.push(`/(app)/employees/${row.id}`)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{row.name}</Text>
                <Text style={styles.meta}>{row.activeTaskCount ?? 0} active task(s)</Text>
              </View>
              <StatusBadge status={row.role} />
            </Pressable>
          ))}
        </>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  sub: { color: '#64748b', fontSize: 13, marginTop: 4, marginBottom: 16 },
  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  kpiCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  kpiLabel: { fontSize: 11, color: '#64748b', fontWeight: '700', textTransform: 'uppercase' },
  kpiValue: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginTop: 4 },
  kpiOnline: { color: '#16a34a' },
  quickActions: { gap: 8, marginBottom: 20 },
  actionRow: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  section: { fontWeight: '700', fontSize: 17, marginBottom: 10, color: '#0f172a' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  name: { fontWeight: '700', fontSize: 15, color: '#0f172a' },
  meta: { color: '#64748b', fontSize: 13, marginTop: 2 },
});
