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
import { Button } from '@/components/common/Button';
import { SearchInput } from '@/components/common/SearchInput';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorBanner } from '@/components/feedback/ErrorBanner';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useEmployeeStatusDashboard } from '@/hooks/useEmployees';
import { useJobs } from '@/hooks/useJobs';
import type { Job, JobStatus, Task } from '@/types/domain';
import { formatRelativeTime } from '@/utils/formatters';

type StatusFilterKey = 'ALL' | JobStatus;

interface StatusFilterOption {
  key: StatusFilterKey;
  label: string;
}

const STATUS_FILTERS: StatusFilterOption[] = [
  { key: 'ALL', label: 'All' },
  { key: 'RECEIVED', label: 'Received' },
  { key: 'IN_PROGRESS', label: 'Active' },
  { key: 'TESTING', label: 'Testing' },
  { key: 'READY_FOR_DELIVERY', label: 'Ready' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

type SortOption = 'newest' | 'oldest' | 'customer' | 'job_number';

export default function JobsScreen() {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilterKey>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('ALL');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  // Queries
  const jobsQuery = useJobs({ limit: 100 });
  const employeesQuery = useEmployeeStatusDashboard();

  const isLoading = jobsQuery.isLoading || employeesQuery.isLoading;
  const isRefetching = jobsQuery.isRefetching || employeesQuery.isRefetching;
  const error = jobsQuery.error || employeesQuery.error;

  const handleRefresh = () => {
    jobsQuery.refetch();
    employeesQuery.refetch();
  };

  const allJobs: Job[] = jobsQuery.data?.items ?? [];
  const team = employeesQuery.data ?? [];

  // Flatten active tasks from employees to map by jobId
  const teamTasksByJobId = useMemo(() => {
    const map = new Map<string, Task & { assigneeName?: string }>();
    team.forEach((emp) => {
      (emp.activeTasks ?? []).forEach((t) => {
        if (t.jobId && !map.has(t.jobId)) {
          map.set(t.jobId, { ...t, assigneeName: emp.name });
        }
      });
    });
    return map;
  }, [team]);

  // Status counts calculated from complete backend dataset
  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilterKey, number> = {
      ALL: allJobs.length,
      RECEIVED: 0,
      IN_PROGRESS: 0,
      TESTING: 0,
      READY_FOR_DELIVERY: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    allJobs.forEach((j) => {
      if (counts[j.status] !== undefined) {
        counts[j.status] += 1;
      }
    });
    return counts;
  }, [allJobs]);

  // Filter & sort logic
  const filteredAndSortedJobs = useMemo(() => {
    return allJobs
      .filter((job) => {
        // Status filter
        if (selectedStatus !== 'ALL' && job.status !== selectedStatus) {
          return false;
        }

        // Assigned Employee filter
        if (selectedEmployeeId !== 'ALL') {
          const assignedInJobTasks = job.tasks?.some(
            (t) => t.assignedEmployeeId === selectedEmployeeId,
          );
          const assignedInTeam = teamTasksByJobId.get(job.id)?.assignedEmployeeId === selectedEmployeeId;
          if (!assignedInJobTasks && !assignedInTeam) {
            return false;
          }
        }

        // Search query
        if (search.trim()) {
          const q = search.toLowerCase();
          const jobNum = job.jobNumber.toLowerCase();
          const cust = job.motor?.customerName?.toLowerCase() || '';
          const mtr = job.motor?.motorNumber?.toLowerCase() || '';
          const brand = job.motor?.brand?.toLowerCase() || '';
          const notes = job.notes?.toLowerCase() || '';
          const currentTask = (job.tasks?.[0]?.title || teamTasksByJobId.get(job.id)?.title || '').toLowerCase();
          const matches =
            jobNum.includes(q) ||
            cust.includes(q) ||
            mtr.includes(q) ||
            brand.includes(q) ||
            notes.includes(q) ||
            currentTask.includes(q);

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
        if (sortBy === 'customer') {
          const nameA = a.motor?.customerName || '';
          const nameB = b.motor?.customerName || '';
          return nameA.localeCompare(nameB);
        }
        if (sortBy === 'job_number') {
          return a.jobNumber.localeCompare(b.jobNumber);
        }
        return 0;
      });
  }, [allJobs, selectedStatus, selectedEmployeeId, search, sortBy, teamTasksByJobId]);

  const isCustomFilterActive = sortBy !== 'newest' || selectedEmployeeId !== 'ALL';

  const resetFilters = () => {
    setSearch('');
    setSelectedStatus('ALL');
    setSortBy('newest');
    setSelectedEmployeeId('ALL');
  };

  return (
    <ScreenWrapper refreshing={isRefetching} onRefresh={handleRefresh}>
      <View style={styles.contentWrapper}>
        {/* 1. SEARCH BAR & FILTER/SORT BUTTON */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <SearchInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search jobs, customer, motor..."
            />
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.filterBtn,
              isCustomFilterActive && styles.filterBtnActive,
              pressed && styles.filterBtnPressed,
            ]}
            onPress={() => setIsFilterModalVisible(true)}
            accessibilityLabel="Filter and sort jobs">
            <Ionicons
              name={isCustomFilterActive ? 'options' : 'options-outline'}
              size={20}
              color={isCustomFilterActive ? Colors.light.primaryForeground : Colors.light.textSecondary}
            />
            {isCustomFilterActive ? <View style={styles.filterDot} /> : null}
          </Pressable>
        </View>

        {/* 2. COMPACT HORIZONTALLY SCROLLABLE STATUS FILTERS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusChipsContainer}
          style={styles.statusChipsScroll}>
          {STATUS_FILTERS.map((filter) => {
            const isActive = selectedStatus === filter.key;
            const count = statusCounts[filter.key] ?? 0;
            return (
              <Pressable
                key={filter.key}
                style={({ pressed }) => [
                  styles.statusChip,
                  isActive && styles.statusChipActive,
                  pressed && styles.statusChipPressed,
                ]}
                onPress={() => setSelectedStatus(filter.key)}>
                <Text style={[styles.statusChipLabel, isActive && styles.statusChipLabelActive]}>
                  {filter.label}
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

        {/* 3. SECTION HEADER */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>
              {selectedStatus === 'ALL'
                ? 'ALL JOBS'
                : `${STATUS_FILTERS.find((f) => f.key === selectedStatus)?.label.toUpperCase()} JOBS`}
            </Text>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{filteredAndSortedJobs.length}</Text>
            </View>
          </View>
          {isCustomFilterActive ? (
            <Pressable hitSlop={8} onPress={resetFilters}>
              <Text style={styles.resetFilterText}>Reset filters</Text>
            </Pressable>
          ) : null}
        </View>

        {/* 4. JOBS LIST / STATES */}
        {isLoading ? (
          <View style={styles.skeletonList}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.skeletonCard}>
                <View style={styles.skeletonTopLine}>
                  <View style={styles.skeletonJobNum} />
                  <View style={styles.skeletonBadge} />
                </View>
                <View style={styles.skeletonCustomer} />
                <View style={styles.skeletonMotor} />
                <View style={styles.skeletonTaskBox} />
              </View>
            ))}
          </View>
        ) : error ? (
          <ErrorBanner
            message={parseApiError(error).message}
            onRetry={handleRefresh}
          />
        ) : allJobs.length === 0 ? (
          <EmptyState
            title="No jobs registered"
            description="Register incoming motor repairs to begin tracking jobs."
            actionTitle="Register Incoming Motor"
            onAction={() => router.push('/(app)/motors/register')}
          />
        ) : filteredAndSortedJobs.length === 0 ? (
          <EmptyState
            title="No jobs found"
            description="There are no jobs matching this filter or search query."
            actionTitle="Clear Filters"
            onAction={resetFilters}
          />
        ) : (
          <View style={styles.jobsList}>
            {filteredAndSortedJobs.map((job) => {
              // 1. Which job & status
              const jobNumber = job.jobNumber;

              // 2. Whose motor
              const customerName = job.motor?.customerName || 'Customer Not Specified';

              // 3. Which motor
              const motorIdentifier = job.motor?.motorNumber
                ? `Motor: ${job.motor.motorNumber}${job.motor.brand ? ` • ${job.motor.brand}` : ''}`
                : 'Motor not assigned';

              // 4. What's happening now (Task)
              const teamActiveTask = teamTasksByJobId.get(job.id);
              const activeJobTask = job.tasks?.find(
                (t) => t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED' || t.status === 'PENDING',
              ) || job.tasks?.[0];
              const currentTaskTitle =
                teamActiveTask?.title ||
                activeJobTask?.title ||
                job.notes ||
                'Inspection & Overhaul';

              const taskCount = job.tasks?.length ?? job._count?.tasks ?? (teamActiveTask ? 1 : 0);

              // 5. Who is responsible (Assignee)
              const assignedEmployeeId =
                teamActiveTask?.assignedEmployeeId || activeJobTask?.assignedEmployeeId;
              const assignedEmployee = assignedEmployeeId
                ? team.find((e) => e.id === assignedEmployeeId)
                : activeJobTask?.assignedEmployee || null;
              const assignedEmployeeName = assignedEmployee?.name || (assignedEmployeeId ? 'Assigned' : 'Staff not assigned');
              const isAssigned = Boolean(assignedEmployeeId);

              // Relative timestamp
              const ageText = formatRelativeTime(job.updatedAt || job.createdAt);

              return (
                <Pressable
                  key={job.id}
                  style={({ pressed }) => [
                    styles.jobCard,
                    pressed && styles.jobCardPressed,
                  ]}
                  onPress={() => router.push(`/(app)/jobs/${job.id}`)}>
                  {/* Card Top: Job # & Status Badge */}
                  <View style={styles.cardHeader}>
                    <Text style={styles.jobNumber}>{jobNumber}</Text>
                    <StatusBadge status={job.status} />
                  </View>

                  {/* Customer & Motor Information */}
                  <View style={styles.cardCustomerSection}>
                    <Text style={styles.customerName} numberOfLines={1}>
                      {customerName}
                    </Text>
                    <Text style={styles.motorText} numberOfLines={1}>
                      {motorIdentifier}
                    </Text>
                  </View>

                  {/* Operational Detail Box: Task & Assignee */}
                  <View style={styles.operationalBox}>
                    <View style={styles.taskRow}>
                      <View style={styles.taskInfoCol}>
                        <Text style={styles.fieldLabel}>CURRENT TASK</Text>
                        <Text style={styles.taskTitle} numberOfLines={1}>
                          {currentTaskTitle}
                        </Text>
                      </View>
                      {taskCount > 1 ? (
                        <View style={styles.taskCountBadge}>
                          <Text style={styles.taskCountText}>{taskCount} tasks</Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.assigneeRow}>
                      <Text style={styles.fieldLabel}>ASSIGNED TO</Text>
                      <View style={styles.assigneeValueRow}>
                        <Ionicons
                          name={isAssigned ? 'person-circle-outline' : 'person-outline'}
                          size={15}
                          color={isAssigned ? Colors.light.text : Colors.light.textMuted}
                        />
                        <Text
                          style={[
                            styles.assigneeName,
                            !isAssigned && styles.assigneeUnassigned,
                          ]}
                          numberOfLines={1}>
                          {assignedEmployeeName}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Card Footer: Timestamp & Chevron */}
                  <View style={styles.cardFooter}>
                    <Text style={styles.timestampText}>Updated {ageText}</Text>
                    <View style={styles.chevronWrap}>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={Colors.light.textMuted}
                      />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* 5. FILTER & SORT BOTTOM SHEET MODAL */}
        <Modal
          visible={isFilterModalVisible}
          animationType="fade"
          transparent
          onRequestClose={() => setIsFilterModalVisible(false)}>
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setIsFilterModalVisible(false)}>
            <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filter & Sort Jobs</Text>
                <Pressable
                  hitSlop={8}
                  onPress={() => setIsFilterModalVisible(false)}
                  style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={22} color={Colors.light.text} />
                </Pressable>
              </View>

              <ScrollView style={styles.modalBody}>
                {/* Sort Order */}
                <Text style={styles.filterSectionTitle}>SORT BY</Text>
                <View style={styles.filterOptionsGroup}>
                  {[
                    { id: 'newest', label: 'Newest first (Date received)' },
                    { id: 'oldest', label: 'Oldest first' },
                    { id: 'customer', label: 'Customer Name (A-Z)' },
                    { id: 'job_number', label: 'Job Number (A-Z)' },
                  ].map((opt) => (
                    <Pressable
                      key={opt.id}
                      style={styles.filterOptionRow}
                      onPress={() => setSortBy(opt.id as SortOption)}>
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

                {/* Assigned Employee Filter */}
                <Text style={[styles.filterSectionTitle, { marginTop: Spacing.lg }]}>
                  ASSIGNED TECHNICIAN
                </Text>
                <View style={styles.filterOptionsGroup}>
                  <Pressable
                    style={styles.filterOptionRow}
                    onPress={() => setSelectedEmployeeId('ALL')}>
                    <Text
                      style={[
                        styles.filterOptionLabel,
                        selectedEmployeeId === 'ALL' && styles.filterOptionLabelActive,
                      ]}>
                      All Technicians
                    </Text>
                    <Ionicons
                      name={selectedEmployeeId === 'ALL' ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={selectedEmployeeId === 'ALL' ? Colors.light.primary : Colors.light.textMuted}
                    />
                  </Pressable>

                  {team.map((emp) => (
                    <Pressable
                      key={emp.id}
                      style={styles.filterOptionRow}
                      onPress={() => setSelectedEmployeeId(emp.id)}>
                      <Text
                        style={[
                          styles.filterOptionLabel,
                          selectedEmployeeId === emp.id && styles.filterOptionLabelActive,
                        ]}>
                        {emp.name} ({emp.activeTaskCount ?? 0} active tasks)
                      </Text>
                      <Ionicons
                        name={selectedEmployeeId === emp.id ? 'radio-button-on' : 'radio-button-off'}
                        size={18}
                        color={selectedEmployeeId === emp.id ? Colors.light.primary : Colors.light.textMuted}
                      />
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <Button
                  title="Reset"
                  variant="secondary"
                  style={styles.modalResetBtn}
                  onPress={() => {
                    setSortBy('newest');
                    setSelectedEmployeeId('ALL');
                  }}
                />
                <Button
                  title="Apply"
                  variant="primary"
                  style={styles.modalApplyBtn}
                  onPress={() => setIsFilterModalVisible(false)}
                />
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
  jobsList: {
    gap: Spacing.sm,
  },
  jobCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  jobCardPressed: {
    backgroundColor: Colors.light.surfaceSubtle,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobNumber: {
    ...Typography.headline,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
  },
  cardCustomerSection: {
    gap: 2,
  },
  customerName: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  motorText: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  operationalBox: {
    backgroundColor: Colors.light.backgroundSubtle,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.light.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskInfoCol: {
    flex: 1,
    gap: 1,
  },
  taskTitle: {
    ...Typography.subhead,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  taskCountBadge: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  taskCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.borderSubtle,
  },
  assigneeRow: {
    gap: 2,
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
  chevronWrap: {
    paddingLeft: Spacing.xs,
  },
  // Skeleton loading styles
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
  skeletonJobNum: {
    width: 140,
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
  skeletonCustomer: {
    width: 180,
    height: 14,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.surfaceSubtle,
  },
  skeletonMotor: {
    width: 120,
    height: 12,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.surfaceSubtle,
  },
  skeletonTaskBox: {
    height: 60,
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
    maxHeight: '75%',
    paddingBottom: Spacing.xl,
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
    paddingVertical: 10,
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
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  modalResetBtn: {
    flex: 1,
  },
  modalApplyBtn: {
    flex: 2,
  },
});
