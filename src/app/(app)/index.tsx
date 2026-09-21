import { useQuery } from '@tanstack/react-query';
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
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorBanner } from '@/components/feedback/ErrorBanner';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { queryKeys } from '@/config/queryKeys';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useEmployeeStatusDashboard } from '@/hooks/useEmployees';
import { useAuthStore } from '@/store/useAuthStore';

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
  const totalActiveTasks = team.reduce(
    (acc, curr) => acc + (curr.activeTaskCount || 0),
    0,
  );

  return (
    <ScreenWrapper
      refreshing={statusQuery.isRefetching}
      onRefresh={() => {
        statusQuery.refetch();
        healthQuery.refetch();
      }}>
      <View style={styles.contentWrapper}>
        <View style={styles.topHeader}>
          <View style={styles.greetingCol}>
            <View style={styles.brandRow}>
              <Text style={styles.brandGlyph}>⚡</Text>
              <Text style={styles.brandName}>Hindustan Electricals</Text>
            </View>
            <Text style={styles.greeting}>{name ?? 'Technician'}</Text>
            <Text style={styles.sub}>Shop-Floor Overview</Text>
          </View>
          <StatusBadge status={role} />
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Colors.light.textSecondary} size="small" />
          </View>
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
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Active Tasks</Text>
                <Text style={styles.statVal}>{totalActiveTasks}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Floor Staff</Text>
                <Text style={styles.statVal}>{activeStaffCount}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>System</Text>
                <Text style={[styles.statVal, styles.onlineText]}>
                  {healthQuery.data?.status === 'healthy' ? 'Online' : 'Connected'}
                </Text>
              </View>
            </View>

            <View style={styles.primaryAction}>
              <Button
                title="Register Incoming Motor"
                onPress={() => router.push('/(app)/motors/register')}
              />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Team Workload</Text>
              <Text style={styles.sectionCount}>{team.length} members</Text>
            </View>

            {team.length === 0 ? (
              <EmptyState
                icon="👷"
                title="No staff members active"
                description="Staff workload and active assignments will appear here."
              />
            ) : (
              <View style={styles.group}>
                {team.map((row, index) => (
                  <Pressable
                    key={row.id}
                    style={({ pressed }) => [
                      styles.teamRow,
                      index > 0 && styles.rowBorder,
                      pressed && styles.rowPressed,
                    ]}
                    onPress={() => router.push(`/(app)/employees/${row.id}`)}>
                    <View style={styles.rowInfo}>
                      <Text style={styles.name}>{row.name}</Text>
                      <Text style={styles.taskMeta}>
                        {row.activeTaskCount ?? 0} active task
                        {row.activeTaskCount === 1 ? '' : 's'}
                      </Text>
                    </View>
                    <StatusBadge status={row.role} />
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  contentWrapper: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  greetingCol: {
    gap: 3,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  brandGlyph: {
    fontSize: 12,
  },
  brandName: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  greeting: {
    ...Typography.largeTitle,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
  },
  sub: {
    ...Typography.subhead,
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  loadingBox: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.light.borderSubtle,
  },
  statLabel: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statVal: {
    ...Typography.headline,
    ...Typography.tabular,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 3,
  },
  onlineText: {
    color: Colors.light.success,
  },
  primaryAction: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.headline,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sectionCount: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  group: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  rowPressed: {
    backgroundColor: Colors.light.secondary,
  },
  rowInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  name: {
    ...Typography.headline,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  taskMeta: {
    ...Typography.subhead,
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
});
