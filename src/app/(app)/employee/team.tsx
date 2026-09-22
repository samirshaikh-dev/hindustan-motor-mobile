import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { parseApiError } from '@/api/errors';
import { SearchInput } from '@/components/common/SearchInput';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorBanner } from '@/components/feedback/ErrorBanner';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useEmployeeStatusDashboard } from '@/hooks/useEmployees';
import type { EmployeeStatusRow } from '@/types/domain';

type TeamFilterKey = 'ALL' | 'BUSY' | 'AVAILABLE' | 'EMPLOYEE';

const FILTER_TABS: { key: TeamFilterKey; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'BUSY', label: 'On Task' },
  { key: 'AVAILABLE', label: 'Available' },
  { key: 'EMPLOYEE', label: 'Technicians' },
];

export default function TeamScreen() {
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<TeamFilterKey>('ALL');

  const { data, isLoading, error, refetch, isRefetching } = useEmployeeStatusDashboard();

  const allEmployees: EmployeeStatusRow[] = data ?? [];

  const filterCounts = useMemo(() => {
    const counts: Record<TeamFilterKey, number> = {
      ALL: allEmployees.length,
      BUSY: 0,
      AVAILABLE: 0,
      EMPLOYEE: 0,
    };
    allEmployees.forEach((emp) => {
      const tasks = emp.activeTaskCount ?? 0;
      if (tasks > 0) counts.BUSY += 1;
      else counts.AVAILABLE += 1;
      if (emp.role === 'EMPLOYEE') counts.EMPLOYEE += 1;
    });
    return counts;
  }, [allEmployees]);

  const displayedEmployees = useMemo(() => {
    return allEmployees
      .filter((emp) => {
        if (selectedFilter === 'BUSY' && (emp.activeTaskCount ?? 0) === 0) return false;
        if (selectedFilter === 'AVAILABLE' && (emp.activeTaskCount ?? 0) > 0) return false;
        if (selectedFilter === 'EMPLOYEE' && emp.role !== 'EMPLOYEE') return false;

        if (search.trim()) {
          const q = search.toLowerCase();
          if (!emp.name.toLowerCase().includes(q) && !emp.phone.toLowerCase().includes(q)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => (b.activeTaskCount ?? 0) - (a.activeTaskCount ?? 0));
  }, [allEmployees, selectedFilter, search]);

  const resetFilters = () => {
    setSearch('');
    setSelectedFilter('ALL');
  };

  return (
    <ScreenWrapper refreshing={isRefetching} onRefresh={refetch}>
      <View style={styles.contentWrapper}>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or phone..."
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          style={styles.chipsScroll}>
          {FILTER_TABS.map((filter) => {
            const isActive = selectedFilter === filter.key;
            const count = filterCounts[filter.key] ?? 0;
            return (
              <Pressable
                key={filter.key}
                style={({ pressed }) => [
                  styles.chip,
                  isActive && styles.chipActive,
                  pressed && styles.chipPressed,
                ]}
                onPress={() => setSelectedFilter(filter.key)}>
                <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>
                  {filter.label}
                </Text>
                <View style={[styles.chipCount, isActive && styles.chipCountActive]}>
                  <Text style={[styles.chipCountText, isActive && styles.chipCountTextActive]}>
                    {count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>TEAM</Text>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{displayedEmployees.length}</Text>
            </View>
          </View>
          {search.trim() || selectedFilter !== 'ALL' ? (
            <Pressable hitSlop={8} onPress={resetFilters}>
              <Text style={styles.resetFilterText}>Reset</Text>
            </Pressable>
          ) : null}
        </View>

        {isLoading ? (
          <View style={styles.skeletonList}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.skeletonCard}>
                <View style={styles.skeletonAvatar} />
                <View style={styles.skeletonLines}>
                  <View style={styles.skeletonName} />
                  <View style={styles.skeletonMeta} />
                </View>
              </View>
            ))}
          </View>
        ) : error ? (
          <ErrorBanner message={parseApiError(error).message} onRetry={refetch} />
        ) : allEmployees.length === 0 ? (
          <EmptyState
            title="No team members"
            description="Workshop staff and admins will appear here once added."
          />
        ) : displayedEmployees.length === 0 ? (
          <EmptyState
            title="No one found"
            description="No team members match your search and filter criteria."
            actionTitle="Clear Filters"
            onAction={resetFilters}
          />
        ) : (
          <View style={styles.rosterList}>
            {displayedEmployees.map((emp) => {
              const tasks = emp.activeTaskCount ?? 0;
              const isBusy = tasks > 0;
              return (
                <View key={emp.id} style={styles.memberCard}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{emp.name.trim().charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName} numberOfLines={1}>
                      {emp.name}
                    </Text>
                    <Text style={styles.memberMeta}>
                      {emp.role === 'OWNER' ? 'Admin' : 'Technician'}
                      {isBusy ? ` · ${tasks} active task${tasks > 1 ? 's' : ''}` : ' · Available'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusDot,
                      isBusy ? styles.statusDotBusy : styles.statusDotAvailable,
                    ]}
                  />
                </View>
              );
            })}
          </View>
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
    gap: Spacing.sm,
  },
  chipsScroll: {
    flexGrow: 0,
  },
  chipsRow: {
    gap: Spacing.xs,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
  },
  chipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  chipPressed: {
    opacity: 0.7,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  chipLabelActive: {
    color: Colors.light.primaryForeground,
  },
  chipCount: {
    minWidth: 18,
    height: 18,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    backgroundColor: Colors.light.backgroundSubtle,
  },
  chipCountActive: {
    backgroundColor: Colors.light.primaryForeground,
  },
  chipCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },
  chipCountTextActive: {
    color: Colors.light.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    ...Typography.headline,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  countPill: {
    minWidth: 22,
    height: 22,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.backgroundSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },
  resetFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  skeletonList: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.md,
  },
  skeletonAvatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.backgroundSubtle,
  },
  skeletonLines: {
    flex: 1,
    gap: Spacing.xs,
  },
  skeletonName: {
    width: '55%',
    height: 14,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.backgroundSubtle,
  },
  skeletonMeta: {
    width: '70%',
    height: 12,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.backgroundSubtle,
  },
  rosterList: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.primaryForeground,
  },
  memberInfo: {
    flex: 1,
    gap: 2,
  },
  memberName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.light.text,
  },
  memberMeta: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
  },
  statusDotBusy: {
    backgroundColor: Colors.light.warning,
  },
  statusDotAvailable: {
    backgroundColor: Colors.light.success,
  },
});