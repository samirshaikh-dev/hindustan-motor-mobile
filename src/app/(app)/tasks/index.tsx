import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { parseApiError } from '@/api/errors';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ErrorBanner } from '@/components/feedback/ErrorBanner';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useEmployeeStatusDashboard, useEmployeeTasks } from '@/hooks/useEmployees';
import { useAuthStore } from '@/store/useAuthStore';
import type { Task } from '@/types/domain';

type FilterType = 'ACTIVE' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ALL';
const STATUS_TABS: FilterType[] = ['ACTIVE', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'ALL'];

export default function TasksWorkbenchScreen() {
  const actorId = useAuthStore((s) => s.activeActorId);
  const isOwner = useAuthStore((s) => s.activeActorRole === 'OWNER');

  const [viewMode, setViewMode] = useState<'my' | 'all'>('my');
  const [filter, setFilter] = useState<FilterType>('ACTIVE');

  // Personal tasks
  const myTasksQuery = useEmployeeTasks(actorId || '', { limit: 100 });

  // Team tasks dashboard (for Owner view)
  const teamDashboardQuery = useEmployeeStatusDashboard();

  const activeQuery = viewMode === 'my' ? myTasksQuery : teamDashboardQuery;
  const isLoading = activeQuery.isLoading;
  const error = activeQuery.error;
  const isRefetching = activeQuery.isRefetching;

  let allDisplayTasks: (Task & { assigneeName?: string })[] = [];

  if (viewMode === 'my') {
    allDisplayTasks = (myTasksQuery.data?.tasks ?? []).map((t) => ({
      ...t,
      assigneeName: 'You',
    }));
  } else {
    // Flatten active tasks from all employees
    const teamEmployees = teamDashboardQuery.data ?? [];
    const flattened: (Task & { assigneeName?: string })[] = [];
    teamEmployees.forEach((emp) => {
      (emp.activeTasks ?? []).forEach((t) => {
        flattened.push({
          ...t,
          assigneeName: emp.name,
        });
      });
    });
    allDisplayTasks = flattened;
  }

  // Filter tasks
  const filteredTasks = allDisplayTasks.filter((t) => {
    if (filter === 'ACTIVE') return t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS';
    if (filter === 'ALL') return true;
    return t.status === filter;
  });

  return (
    <ScreenWrapper refreshing={isRefetching} onRefresh={() => activeQuery.refetch()}>
      {isOwner ? (
        <View style={styles.viewSegment}>
          <Pressable
            style={[styles.segmentBtn, viewMode === 'my' && styles.segmentBtnActive]}
            onPress={() => setViewMode('my')}>
            <Text style={[styles.segmentText, viewMode === 'my' && styles.segmentTextActive]}>
              My Tasks
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segmentBtn, viewMode === 'all' && styles.segmentBtnActive]}
            onPress={() => setViewMode('all')}>
            <Text style={[styles.segmentText, viewMode === 'all' && styles.segmentTextActive]}>
              All Workshop Tasks
            </Text>
          </Pressable>
        </View>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
        style={styles.chips}>
        {STATUS_TABS.map((s) => {
          const active = filter === s;
          return (
            <Pressable
              key={s}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && styles.chipPressed,
              ]}
              onPress={() => setFilter(s)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {s.replace(/_/g, ' ')}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Colors.light.textSecondary} size="small" />
        </View>
      ) : error ? (
        <ErrorBanner message={parseApiError(error).message} onRetry={() => activeQuery.refetch()} />
      ) : filteredTasks.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.empty}>
            {viewMode === 'my'
              ? 'No tasks found in your workbench for this filter.'
              : 'No team tasks found for this filter.'}
          </Text>
        </View>
      ) : (
        <View style={styles.group}>
          {filteredTasks.map((task, index) => (
            <Pressable
              key={task.id}
              style={({ pressed }) => [
                styles.row,
                index > 0 && styles.rowBorder,
                pressed && styles.rowPressed,
              ]}
              onPress={() => router.push(`/(app)/tasks/${task.id}`)}>
              <View style={styles.topLine}>
                <Text style={styles.title}>{task.title}</Text>
                <StatusBadge status={task.status} />
              </View>

              {task.description ? (
                <Text style={styles.desc} numberOfLines={2}>
                  {task.description}
                </Text>
              ) : null}

              <View style={styles.footerRow}>
                {task.job ? (
                  <Text style={styles.meta}>Job {task.job.jobNumber}</Text>
                ) : null}
                {task.assigneeName ? (
                  <Text style={styles.assignee}>Assigned: {task.assigneeName}</Text>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  viewSegment: {
    flexDirection: 'row',
    backgroundColor: Colors.light.secondary,
    borderRadius: Radius.md,
    padding: 2,
    height: 42,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  segmentBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  segmentBtnActive: {
    backgroundColor: Colors.light.surface,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  segmentTextActive: {
    fontWeight: '600',
    color: Colors.light.text,
  },
  chips: {
    marginBottom: Spacing.md,
    maxHeight: 38,
  },
  chipsContainer: {
    gap: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  chipPressed: {
    opacity: 0.8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  chipTextActive: {
    color: Colors.light.primaryForeground,
    fontWeight: '600',
  },
  loadingBox: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
  },
  group: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  row: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: 4,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  rowPressed: {
    backgroundColor: Colors.light.secondary,
  },
  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    ...Typography.headline,
    fontSize: 15,
    color: Colors.light.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  desc: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  meta: {
    ...Typography.caption,
    color: Colors.light.textMuted,
  },
  assignee: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  emptyBox: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
  },
  empty: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});
