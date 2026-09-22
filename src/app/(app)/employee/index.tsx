import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { parseApiError } from '@/api/errors';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorBanner } from '@/components/feedback/ErrorBanner';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useEmployeeTasks } from '@/hooks/useEmployees';
import { useAuthStore } from '@/store/useAuthStore';
import type { Task } from '@/types/domain';

export default function TodayScreen() {
  const actorName = useAuthStore((s) => s.activeActorName);
  const actorId = useAuthStore((s) => s.activeActorId);

  const { data, isLoading, error, refetch, isRefetching } = useEmployeeTasks(actorId || '', {
    limit: 100,
  });

  const tasks = data?.tasks ?? [];

  const activeTasks = useMemo(
    () => tasks.filter((t) => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS'),
    [tasks],
  );
  const pendingTasks = useMemo(() => tasks.filter((t) => t.status === 'PENDING'), [tasks]);
  const completedCount = useMemo(
    () => tasks.filter((t) => t.status === 'COMPLETED').length,
    [tasks],
  );

  const firstName = actorName?.trim().split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const todayLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <ScreenWrapper refreshing={isRefetching} onRefresh={() => refetch()}>
      <View style={styles.contentWrapper}>
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {greeting}, {firstName}
          </Text>
          <Text style={styles.date}>{todayLabel}</Text>
        </View>

        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={Colors.light.textSecondary} size="small" />
          </View>
        ) : error ? (
          <ErrorBanner message={parseApiError(error).message} onRetry={() => refetch()} />
        ) : (
          <>
            <View style={styles.statRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{activeTasks.length}</Text>
                <Text style={styles.statLabel}>In work</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{pendingTasks.length}</Text>
                <Text style={styles.statLabel}>Queued</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{completedCount}</Text>
                <Text style={styles.statLabel}>Done</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>CURRENT WORK</Text>
            {activeTasks.length === 0 ? (
              <EmptyState
                icon="checkbox-outline"
                title="No active jobs right now"
                description="Tasks assigned to you will appear here. Open My Work to see your full list."
                actionTitle="View My Work"
                onAction={() => router.push('/(app)/employee/tasks')}
              />
            ) : (
              <View style={styles.cardGroup}>
                {activeTasks.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </View>
            )}

            {pendingTasks.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>UP NEXT</Text>
                <View style={styles.cardGroup}>
                  {pendingTasks.map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))}
                </View>
              </>
            ) : null}

            <Button
              title="View All My Work"
              variant="secondary"
              onPress={() => router.push('/(app)/employee/tasks')}
            />
          </>
        )}
      </View>
    </ScreenWrapper>
  );
}

function TaskRow({ task }: { task: Task }) {
  const jobLabel = task.job?.jobNumber ? `Job ${task.job.jobNumber}` : 'Job order';
  const motorLabel = task.job?.motor
    ? `${task.job.motor.customerName} · ${task.job.motor.motorNumber}`
    : null;

  return (
    <Pressable
      style={({ pressed }) => [styles.taskRow, pressed && styles.rowPressed]}
      onPress={() => router.push(`/(app)/shared/task/${task.id}`)}>
      <View style={styles.taskInfo}>
        <Text style={styles.taskTitle} numberOfLines={1}>
          {task.title}
        </Text>
        <Text style={styles.taskMeta} numberOfLines={1}>
          {jobLabel}
          {motorLabel ? ` · ${motorLabel}` : ''}
        </Text>
      </View>
      <StatusBadge status={task.status} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  contentWrapper: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    gap: Spacing.sm,
  },
  header: {
    marginBottom: Spacing.sm,
    gap: 2,
  },
  greeting: {
    ...Typography.title,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
  },
  date: {
    ...Typography.subhead,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  centerBox: {
    paddingVertical: Spacing.xxxl * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    ...Typography.title,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
  },
  statLabel: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sectionTitle: {
    ...Typography.headline,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  cardGroup: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  rowPressed: {
    backgroundColor: Colors.light.secondary,
  },
  taskInfo: {
    flex: 1,
    marginRight: Spacing.md,
    gap: 2,
  },
  taskTitle: {
    ...Typography.headline,
    fontSize: 15,
    color: Colors.light.text,
  },
  taskMeta: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
});