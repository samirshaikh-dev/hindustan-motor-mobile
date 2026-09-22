import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { parseApiError } from '@/api/errors';
import { SearchInput } from '@/components/common/SearchInput';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorBanner } from '@/components/feedback/ErrorBanner';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useEmployeeTasks } from '@/hooks/useEmployees';
import { useAuthStore } from '@/store/useAuthStore';
import type { Task, TaskStatus } from '@/types/domain';
import { formatRelativeTime } from '@/utils/formatters';

type FilterType = 'ACTIVE' | 'ASSIGNED' | 'IN_PROGRESS' | 'PENDING' | 'COMPLETED' | 'ALL';

interface FilterOption {
  key: FilterType;
  label: string;
}

const FILTER_TABS: FilterOption[] = [
  { key: 'ACTIVE', label: 'Active' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'ALL', label: 'All' },
];

type SortOption = 'newest' | 'oldest' | 'title' | 'assignee';

export default function MyWorkScreen() {
  const actorId = useAuthStore((s) => s.activeActorId);

  const [filter, setFilter] = useState<FilterType>('ACTIVE');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);

  // Personal tasks
  const myTasksQuery = useEmployeeTasks(actorId || '', { limit: 100 });

  const isLoading = myTasksQuery.isLoading;
  const error = myTasksQuery.error;
  const isRefetching = myTasksQuery.isRefetching;

  const handleRefresh = () => {
    myTasksQuery.refetch();
  };

  // Build unified tasks list
  const allDisplayTasks: (Task & { assigneeName?: string })[] = useMemo(() => {
    return (myTasksQuery.data?.tasks ?? []).map((t) => ({
      ...t,
      assigneeName: 'You',
    }));
  }, [myTasksQuery.data]);

  // Live status counts
  const statusCounts = useMemo(() => {
    const counts: Record<FilterType, number> = {
      ACTIVE: 0,
      IN_PROGRESS: 0,
      ASSIGNED: 0,
      PENDING: 0,
      COMPLETED: 0,
      ALL: allDisplayTasks.length,
    };

    allDisplayTasks.forEach((t) => {
      if (t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS') {
        counts.ACTIVE += 1;
      }
      if (t.status in counts) {
        counts[t.status as FilterType] += 1;
      }
    });

    return counts;
  }, [allDisplayTasks]);

  // Filtered and sorted tasks
  const filteredAndSortedTasks = useMemo(() => {
    return allDisplayTasks
      .filter((t) => {
        // Status filter
        if (filter === 'ACTIVE') {
          if (t.status !== 'ASSIGNED' && t.status !== 'IN_PROGRESS') return false;
        } else if (filter !== 'ALL') {
          if (t.status !== filter) return false;
        }

        // Search query
        if (search.trim()) {
          const q = search.toLowerCase();
          const title = t.title.toLowerCase();
          const desc = t.description?.toLowerCase() || '';
          const jobNum = t.job?.jobNumber.toLowerCase() || '';
          const cust = t.job?.motor?.customerName?.toLowerCase() || '';
          const mtr = t.job?.motor?.motorNumber?.toLowerCase() || '';
          const assignee = t.assigneeName?.toLowerCase() || '';

          const matches =
            title.includes(q) ||
            desc.includes(q) ||
            jobNum.includes(q) ||
            cust.includes(q) ||
            mtr.includes(q) ||
            assignee.includes(q);

          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === 'assignee') {
          return (a.assigneeName || '').localeCompare(b.assigneeName || '');
        }
        return 0;
      });
  }, [allDisplayTasks, filter, search, sortBy]);

  const isCustomSortActive = sortBy !== 'newest';

  const resetFilters = () => {
    setSearch('');
    setFilter('ACTIVE');
    setSortBy('newest');
  };

  return (
    <ScreenWrapper refreshing={isRefetching} onRefresh={handleRefresh}>
      <View style={styles.contentWrapper}>
        {/* 1. SEARCH & SORT BUTTON */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <SearchInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search tasks, job, assignee..."
            />
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.filterBtn,
              isCustomSortActive && styles.filterBtnActive,
              pressed && styles.filterBtnPressed,
            ]}
            onPress={() => setIsSortModalVisible(true)}
            accessibilityLabel="Sort tasks">
            <Ionicons
              name={isCustomSortActive ? 'options' : 'options-outline'}
              size={20}
              color={isCustomSortActive ? Colors.light.primaryForeground : Colors.light.textSecondary}
            />
            {isCustomSortActive ? <View style={styles.filterDot} /> : null}
          </Pressable>
        </View>

        {/* 3. COMPACT HORIZONTALLY SCROLLABLE STATUS FILTERS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusChipsContainer}
          style={styles.statusChipsScroll}>
          {FILTER_TABS.map((tab) => {
            const isActive = filter === tab.key;
            const count = statusCounts[tab.key] ?? 0;
            return (
              <Pressable
                key={tab.key}
                style={({ pressed }) => [
                  styles.statusChip,
                  isActive && styles.statusChipActive,
                  pressed && styles.statusChipPressed,
                ]}
                onPress={() => setFilter(tab.key)}>
                <Text style={[styles.statusChipLabel, isActive && styles.statusChipLabelActive]}>
                  {tab.label}
                </Text>
                <View
                  style={[
                    styles.statusCountBadge,
                    isActive && styles.statusCountBadgeActive,
                  ]}>
                  <Text
                    style={[
                      styles.statusCountText,
                      isActive && styles.statusCountTextActive,
                    ]}>
                    {count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* 4. SECTION HEADER */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>
              {filter === 'ALL'
                ? 'ALL TASKS'
                : `${FILTER_TABS.find((f) => f.key === filter)?.label.toUpperCase()} TASKS`}
            </Text>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{filteredAndSortedTasks.length}</Text>
            </View>
          </View>
          {isCustomSortActive ? (
            <Pressable hitSlop={8} onPress={resetFilters}>
              <Text style={styles.resetFilterText}>Reset sort</Text>
            </Pressable>
          ) : null}
        </View>

        {/* 5. TASKS LIST / STATES */}
        {isLoading ? (
          <View style={styles.skeletonList}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.skeletonCard}>
                <View style={styles.skeletonTopLine}>
                  <View style={styles.skeletonTitle} />
                  <View style={styles.skeletonBadge} />
                </View>
                <View style={styles.skeletonJobLine} />
                <View style={styles.skeletonAssigneeBox} />
              </View>
            ))}
          </View>
        ) : error ? (
          <ErrorBanner
            message={parseApiError(error).message}
            onRetry={handleRefresh}
          />
        ) : allDisplayTasks.length === 0 && !search.trim() ? (
          <EmptyState
            title="No tasks found"
            description="You currently have no tasks assigned to you."
          />
        ) : filteredAndSortedTasks.length === 0 ? (
          <EmptyState
            title="No matching tasks"
            description="No tasks match your search or active filter."
            actionTitle="Clear Filters"
            onAction={resetFilters}
          />
        ) : (
          <View style={styles.tasksList}>
            {filteredAndSortedTasks.map((task) => {
              const ageText = formatRelativeTime(task.startedAt || task.createdAt);
              const jobIdentifier = task.job?.jobNumber ? `#${task.job.jobNumber}` : null;
              const customerInfo = task.job?.motor?.customerName
                ? `${task.job.motor.customerName}${task.job.motor.motorNumber ? ` • ${task.job.motor.motorNumber}` : ''}`
                : null;

              return (
                <Pressable
                  key={task.id}
                  style={({ pressed }) => [
                    styles.taskCard,
                    pressed && styles.taskCardPressed,
                  ]}
                  onPress={() => router.push(`/(app)/shared/task/${task.id}`)}>
                  {/* Top Line: Task Title & Status Badge */}
                  <View style={styles.cardHeader}>
                    <Text style={styles.taskTitle} numberOfLines={1}>
                      {task.title}
                    </Text>
                    <StatusBadge status={task.status} />
                  </View>

                  {/* Related Job & Motor Info */}
                  {jobIdentifier || customerInfo ? (
                    <View style={styles.relationBox}>
                      <Ionicons
                        name="construct-outline"
                        size={14}
                        color={Colors.light.textSecondary}
                      />
                      <View style={styles.relationTextWrap}>
                        {jobIdentifier ? (
                          <Text style={styles.jobNumberText}>{jobIdentifier}</Text>
                        ) : null}
                        {customerInfo ? (
                          <Text style={styles.customerText} numberOfLines={1}>
                            {customerInfo}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ) : null}

                  {/* Task Description (if present) */}
                  {task.description ? (
                    <Text style={styles.descriptionText} numberOfLines={2}>
                      {task.description}
                    </Text>
                  ) : null}

                  {/* Operational Details Box: Assignee */}
                  <View style={styles.assigneeBox}>
                    <Text style={styles.fieldLabel}>ASSIGNED TO</Text>
                    <View style={styles.assigneeValueRow}>
                      <Ionicons
                        name={task.assigneeName ? 'person-circle-outline' : 'person-outline'}
                        size={15}
                        color={task.assigneeName ? Colors.light.text : Colors.light.textMuted}
                      />
                      <Text
                        style={[
                          styles.assigneeName,
                          !task.assigneeName && styles.assigneeUnassigned,
                        ]}
                        numberOfLines={1}>
                        {task.assigneeName || 'Unassigned'}
                      </Text>
                    </View>
                  </View>

                  {/* Card Footer: Timestamp & Chevron */}
                  <View style={styles.cardFooter}>
                    <Text style={styles.timestampText}>
                      {task.startedAt ? 'Started ' : 'Created '}
                      {ageText}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={Colors.light.textMuted}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* 6. SORT MODAL */}
        <Modal
          visible={isSortModalVisible}
          animationType="fade"
          transparent
          onRequestClose={() => setIsSortModalVisible(false)}>
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setIsSortModalVisible(false)}>
            <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Sort Tasks</Text>
                <Pressable
                  hitSlop={8}
                  onPress={() => setIsSortModalVisible(false)}
                  style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={22} color={Colors.light.text} />
                </Pressable>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.filterSectionTitle}>ORDER BY</Text>
                <View style={styles.filterOptionsGroup}>
                  {[
                    { id: 'newest', label: 'Newest first' },
                    { id: 'oldest', label: 'Oldest first' },
                    { id: 'title', label: 'Task Title (A-Z)' },
                    { id: 'assignee', label: 'Assignee Name (A-Z)' },
                  ].map((opt) => (
                    <Pressable
                      key={opt.id}
                      style={styles.filterOptionRow}
                      onPress={() => {
                        setSortBy(opt.id as SortOption);
                        setIsSortModalVisible(false);
                      }}
                      accessibilityLabel={opt.label}>
                      <Text
                        style={[
                          styles.filterOptionLabel,
                          sortBy === opt.id && styles.filterOptionLabelActive,
                        ]}>
                        {opt.label}
                      </Text>
                      <Ionicons
                        name={sortBy === opt.id ? 'radio-button-on' : 'radio-button-off'}
                        size={18}
                        color={sortBy === opt.id ? Colors.light.primary : Colors.light.textMuted}
                      />
                    </Pressable>
                  ))}
                </View>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  contentWrapper: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    paddingBottom: Spacing.xl,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  searchBox: {
    flex: 1,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBtnActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterBtnPressed: {
    opacity: 0.8,
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.warning,
  },
  statusChipsScroll: {
    marginBottom: Spacing.md,
    maxHeight: 40,
  },
  statusChipsContainer: {
    gap: Spacing.xs,
    paddingRight: Spacing.sm,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 6,
  },
  statusChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  statusChipPressed: {
    opacity: 0.8,
  },
  statusChipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  statusChipLabelActive: {
    color: Colors.light.primaryForeground,
  },
  statusCountBadge: {
    backgroundColor: Colors.light.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  statusCountBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },
  statusCountTextActive: {
    color: Colors.light.primaryForeground,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.textMuted,
    letterSpacing: 0.8,
  },
  countPill: {
    backgroundColor: Colors.light.surfaceSubtle,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  countPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  resetFilterText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  tasksList: {
    gap: Spacing.sm,
  },
  taskCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  taskCardPressed: {
    backgroundColor: Colors.light.surfaceSubtle,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTitle: {
    ...Typography.headline,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  relationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.backgroundSubtle,
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  relationTextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    flex: 1,
  },
  jobNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.text,
  },
  customerText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  descriptionText: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  assigneeBox: {
    backgroundColor: Colors.light.backgroundSubtle,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.light.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  assigneeValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  assigneeName: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.text,
  },
  assigneeUnassigned: {
    color: Colors.light.textMuted,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  timestampText: {
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  // Skeleton styles
  skeletonList: {
    gap: Spacing.sm,
  },
  skeletonCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  skeletonTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skeletonTitle: {
    width: 160,
    height: 18,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.surfaceSubtle,
  },
  skeletonBadge: {
    width: 80,
    height: 18,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surfaceSubtle,
  },
  skeletonJobLine: {
    width: 200,
    height: 14,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.surfaceSubtle,
  },
  skeletonAssigneeBox: {
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.backgroundSubtle,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  modalTitle: {
    ...Typography.headline,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  modalCloseBtn: {
    padding: Spacing.xs,
  },
  modalBody: {
    paddingVertical: Spacing.md,
  },
  filterSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.textMuted,
    letterSpacing: 0.6,
    marginBottom: Spacing.xs,
  },
  filterOptionsGroup: {
    gap: 2,
  },
  filterOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.xs,
  },
  filterOptionLabel: {
    fontSize: 14,
    color: Colors.light.text,
  },
  filterOptionLabelActive: {
    fontWeight: '600',
    color: Colors.light.primary,
  },
});
