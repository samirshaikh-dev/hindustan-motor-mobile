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
import { useEmployeeStatusDashboard, useEmployeeTasks } from '@/hooks/useEmployees';
import { useAuthStore } from '@/store/useAuthStore';
import type { Task, TaskStatus } from '@/types/domain';

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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        {STATUS_TABS.map((s) => (
          <Pressable
            key={s}
            style={[styles.chip, filter === s && styles.chipActive]}
            onPress={() => setFilter(s)}>
            <Text style={[styles.chipText, filter === s && styles.chipTextActive]}>
              {s.replace(/_/g, ' ')}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator color="#0284c7" style={{ marginTop: 24 }} />
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
        <View style={styles.list}>
          {filteredTasks.map((task) => (
            <Pressable
              key={task.id}
              style={styles.card}
              onPress={() => router.push(`/(app)/tasks/${task.id}`)}>
              <View style={styles.cardHeader}>
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
                  <Text style={styles.assignee}>👤 {task.assigneeName}</Text>
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
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    padding: 3,
    height: 40,
    marginBottom: 12,
  },
  segmentBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentBtnActive: { backgroundColor: '#fff' },
  segmentText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  segmentTextActive: { color: '#0f172a' },
  chips: { marginBottom: 14, maxHeight: 40 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  chipText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  chipTextActive: { color: '#fff' },
  list: { gap: 10 },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: { fontWeight: '700', fontSize: 16, color: '#0f172a', flex: 1, marginRight: 8 },
  desc: { color: '#475569', fontSize: 13, lineHeight: 18 },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  meta: { color: '#64748b', fontSize: 12 },
  assignee: { color: '#0284c7', fontSize: 12, fontWeight: '600' },
  emptyBox: { paddingVertical: 40, alignItems: 'center' },
  empty: { textAlign: 'center', color: '#64748b', fontSize: 14 },
});
