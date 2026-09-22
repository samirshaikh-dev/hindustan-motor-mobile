import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Linking,
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
import { useEmployeeStatusDashboard } from '@/hooks/useEmployees';
import type { EmployeeStatusRow } from '@/types/domain';

type TeamFilterKey = 'ALL' | 'ACTIVE' | 'BUSY' | 'AVAILABLE' | 'EMPLOYEE' | 'OWNER';

interface FilterOption {
  key: TeamFilterKey;
  label: string;
}

const FILTER_TABS: FilterOption[] = [
  { key: 'ALL', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'BUSY', label: 'On Task' },
  { key: 'AVAILABLE', label: 'Available' },
  { key: 'EMPLOYEE', label: 'Technicians' },
  { key: 'OWNER', label: 'Admins' },
];

type SortOption = 'name' | 'tasks' | 'role';

export default function EmployeesScreen() {
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<TeamFilterKey>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('tasks');
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);

  const { data, isLoading, error, refetch, isRefetching } = useEmployeeStatusDashboard();

  const allEmployees: EmployeeStatusRow[] = data ?? [];

  // Live filter counts
  const filterCounts = useMemo(() => {
    const counts: Record<TeamFilterKey, number> = {
      ALL: allEmployees.length,
      ACTIVE: 0,
      BUSY: 0,
      AVAILABLE: 0,
      EMPLOYEE: 0,
      OWNER: 0,
    };

    allEmployees.forEach((emp) => {
      if (emp.isActive) counts.ACTIVE += 1;
      const tasks = emp.activeTaskCount ?? 0;
      if (tasks > 0) counts.BUSY += 1;
      else counts.AVAILABLE += 1;
      if (emp.role === 'EMPLOYEE') counts.EMPLOYEE += 1;
      if (emp.role === 'OWNER') counts.OWNER += 1;
    });

    return counts;
  }, [allEmployees]);

  // Filter & sort
  const filteredAndSortedEmployees = useMemo(() => {
    return allEmployees
      .filter((emp) => {
        // Status filter
        if (selectedFilter === 'ACTIVE' && !emp.isActive) return false;
        if (selectedFilter === 'BUSY' && (emp.activeTaskCount ?? 0) === 0) return false;
        if (selectedFilter === 'AVAILABLE' && (emp.activeTaskCount ?? 0) > 0) return false;
        if (selectedFilter === 'EMPLOYEE' && emp.role !== 'EMPLOYEE') return false;
        if (selectedFilter === 'OWNER' && emp.role !== 'OWNER') return false;

        // Search
        if (search.trim()) {
          const q = search.toLowerCase();
          const name = emp.name.toLowerCase();
          const phone = emp.phone.toLowerCase();
          const role = emp.role.toLowerCase();
          if (!name.includes(q) && !phone.includes(q) && !role.includes(q)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'tasks') {
          return (b.activeTaskCount ?? 0) - (a.activeTaskCount ?? 0);
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'role') {
          return a.role.localeCompare(b.role);
        }
        return 0;
      });
  }, [allEmployees, selectedFilter, search, sortBy]);

  const isCustomSortActive = sortBy !== 'tasks';

  const resetFilters = () => {
    setSearch('');
    setSelectedFilter('ALL');
    setSortBy('tasks');
  };

  return (
    <ScreenWrapper refreshing={isRefetching} onRefresh={() => refetch()}>
      <View style={styles.contentWrapper}>
        {/* 1. SEARCH & SORT */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <SearchInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search staff by name or phone..."
            />
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.filterBtn,
              isCustomSortActive && styles.filterBtnActive,
              pressed && styles.filterBtnPressed,
            ]}
            onPress={() => setIsSortModalVisible(true)}
            accessibilityLabel="Sort staff">
            <Ionicons
              name={isCustomSortActive ? 'options' : 'options-outline'}
              size={20}
              color={isCustomSortActive ? Colors.light.primaryForeground : Colors.light.textSecondary}
            />
            {isCustomSortActive ? <View style={styles.filterDot} /> : null}
          </Pressable>
        </View>

        {/* 2. COMPACT HORIZONTALLY SCROLLABLE FILTER CHIPS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusChipsContainer}
          style={styles.statusChipsScroll}>
          {FILTER_TABS.map((tab) => {
            const isActive = selectedFilter === tab.key;
            const count = filterCounts[tab.key] ?? 0;
            return (
              <Pressable
                key={tab.key}
                style={({ pressed }) => [
                  styles.statusChip,
                  isActive && styles.statusChipActive,
                  pressed && styles.statusChipPressed,
                ]}
                onPress={() => setSelectedFilter(tab.key)}>
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

        {/* 3. SECTION HEADER */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>
              {selectedFilter === 'ALL'
                ? 'WORKSHOP TEAM ROSTER'
                : `${FILTER_TABS.find((f) => f.key === selectedFilter)?.label.toUpperCase()} STAFF`}
            </Text>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{filteredAndSortedEmployees.length}</Text>
            </View>
          </View>
          {isCustomSortActive ? (
            <Pressable hitSlop={8} onPress={resetFilters}>
              <Text style={styles.resetFilterText}>Reset sort</Text>
            </Pressable>
          ) : null}
        </View>

        {/* 4. EMPLOYEES LIST / STATES */}
        {isLoading ? (
          <View style={styles.skeletonList}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.skeletonCard}>
                <View style={styles.skeletonAvatar} />
                <View style={styles.skeletonInfo}>
                  <View style={styles.skeletonName} />
                  <View style={styles.skeletonPhone} />
                </View>
              </View>
            ))}
          </View>
        ) : error ? (
          <ErrorBanner
            message={parseApiError(error).message}
            onRetry={() => refetch()}
          />
        ) : allEmployees.length === 0 && !search.trim() ? (
          <EmptyState
            title="No staff members registered"
            description="Add floor technicians and workshop staff to assign tasks."
            actionTitle="Add Staff Member"
            onAction={() => router.push('/(app)/owner/employees/create')}
          />
        ) : filteredAndSortedEmployees.length === 0 ? (
          <EmptyState
            title="No team members found"
            description="No staff members match your search or active filter."
            actionTitle="Clear Filters"
            onAction={resetFilters}
          />
        ) : (
          <View style={styles.teamList}>
            {filteredAndSortedEmployees.map((emp) => {
              const initial = emp.name.charAt(0).toUpperCase();
              const taskCount = emp.activeTaskCount ?? 0;

              return (
                <Pressable
                  key={emp.id}
                  style={({ pressed }) => [
                    styles.staffCard,
                    pressed && styles.staffCardPressed,
                  ]}
                  onPress={() => router.push(`/(app)/owner/employees/${emp.id}`)}>
                  {/* Avatar */}
                  <View style={styles.avatarBox}>
                    <Text style={styles.avatarText}>{initial}</Text>
                  </View>

                  {/* Staff Info */}
                  <View style={styles.staffMainInfo}>
                    <View style={styles.nameLine}>
                      <Text style={styles.staffName} numberOfLines={1}>
                        {emp.name}
                      </Text>
                      <StatusBadge status={emp.role} />
                    </View>

                    <Pressable
                      hitSlop={6}
                      onPress={(e) => {
                        e.stopPropagation();
                        Linking.openURL(`tel:${emp.phone}`);
                      }}
                      style={styles.phoneRow}>
                      <Ionicons name="call-outline" size={13} color={Colors.light.textMuted} />
                      <Text style={styles.phoneText}>{emp.phone}</Text>
                    </Pressable>

                    {taskCount > 0 ? (
                      <View style={styles.workloadRow}>
                        <View style={[styles.taskPill, styles.taskPillBusy]}>
                          <Ionicons
                            name="construct-outline"
                            size={12}
                            color={Colors.light.warning}
                          />
                          <Text style={[styles.taskPillText, styles.taskPillTextBusy]}>
                            {taskCount} active task{taskCount === 1 ? '' : 's'}
                          </Text>
                        </View>
                      </View>
                    ) : null}
                  </View>

                  {/* Chevron */}
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={Colors.light.textMuted}
                  />
                </Pressable>
              );
            })}
          </View>
        )}

        {/* 5. SORT MODAL */}
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
                <Text style={styles.modalTitle}>Sort Team Roster</Text>
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
                    { id: 'tasks', label: 'Active Workload (Most tasks first)' },
                    { id: 'name', label: 'Name (A-Z)' },
                    { id: 'role', label: 'Role (Admins first)' },
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
  teamList: {
    gap: Spacing.sm,
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  staffCardPressed: {
    backgroundColor: Colors.light.surfaceSubtle,
  },
  avatarBox: {
    width: 46,
    height: 46,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarText: {
    ...Typography.headline,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: Colors.light.surface,
  },
  statusDotActive: {
    backgroundColor: Colors.light.success,
  },
  statusDotInactive: {
    backgroundColor: Colors.light.textMuted,
  },
  staffMainInfo: {
    flex: 1,
    gap: 3,
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: Spacing.xs,
  },
  staffName: {
    ...Typography.headline,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
    flex: 1,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneText: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  workloadRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  taskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  taskPillBusy: {
    backgroundColor: Colors.light.warningSubtle,
    borderColor: '#fef3c7',
  },
  taskPillFree: {
    backgroundColor: Colors.light.successSubtle,
    borderColor: '#dcfce7',
  },
  taskPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  taskPillTextBusy: {
    color: Colors.light.warning,
  },
  taskPillTextFree: {
    color: Colors.light.success,
  },
  // Skeleton styles
  skeletonList: {
    gap: Spacing.sm,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  skeletonAvatar: {
    width: 46,
    height: 46,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surfaceSubtle,
  },
  skeletonInfo: {
    flex: 1,
    gap: 6,
  },
  skeletonName: {
    width: 140,
    height: 16,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.surfaceSubtle,
  },
  skeletonPhone: {
    width: 100,
    height: 12,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.surfaceSubtle,
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
