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
import { useMotors } from '@/hooks/useMotors';
import type { JobStatus, Motor } from '@/types/domain';
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
];

type SortOption = 'newest' | 'oldest' | 'customer' | 'motor_number';

export default function MotorsListScreen() {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilterKey>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [page, setPage] = useState(1);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  // Fetch all motors for accurate counting & client-enhanced search
  const { data, isLoading, error, refetch, isRefetching } = useMotors({
    status: selectedStatus === 'ALL' ? undefined : selectedStatus,
    search: search.trim() || undefined,
    page,
    limit: 50,
  });

  // Query all motors without status filter for live counts
  const allMotorsQuery = useMotors({ limit: 100 });
  const allMotors = allMotorsQuery.data?.items ?? [];

  // Live status counts calculated from dataset
  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilterKey, number> = {
      ALL: allMotors.length,
      RECEIVED: 0,
      IN_PROGRESS: 0,
      TESTING: 0,
      READY_FOR_DELIVERY: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    allMotors.forEach((m) => {
      const activeJob = m.job || m.jobs?.[0];
      const status = activeJob?.status;
      if (status && counts[status] !== undefined) {
        counts[status] += 1;
      }
    });
    return counts;
  }, [allMotors]);

  const rawMotors: Motor[] = data?.items ?? [];

  // Sort motors
  const displayedMotors = useMemo(() => {
    return [...rawMotors].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.receivedAt || b.createdAt).getTime() - new Date(a.receivedAt || a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.receivedAt || a.createdAt).getTime() - new Date(b.receivedAt || b.createdAt).getTime();
      }
      if (sortBy === 'customer') {
        return (a.customerName || '').localeCompare(b.customerName || '');
      }
      if (sortBy === 'motor_number') {
        return a.motorNumber.localeCompare(b.motorNumber);
      }
      return 0;
    });
  }, [rawMotors, sortBy]);

  const isCustomFilterActive = sortBy !== 'newest';

  const resetFilters = () => {
    setSearch('');
    setSelectedStatus('ALL');
    setSortBy('newest');
    setPage(1);
  };

  const handleRefresh = () => {
    refetch();
    allMotorsQuery.refetch();
  };

  return (
    <ScreenWrapper refreshing={isRefetching} onRefresh={handleRefresh}>
      <View style={styles.contentWrapper}>
        {/* 1. SEARCH BAR & FILTER/SORT BUTTON */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <SearchInput
              value={search}
              onChangeText={(t) => {
                setSearch(t);
                setPage(1);
              }}
              placeholder="Search motor number, customer, phone..."
            />
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.filterBtn,
              isCustomFilterActive && styles.filterBtnActive,
              pressed && styles.filterBtnPressed,
            ]}
            onPress={() => setIsFilterModalVisible(true)}
            accessibilityLabel="Filter and sort motors">
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
                onPress={() => {
                  setSelectedStatus(filter.key);
                  setPage(1);
                }}>
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
                ? 'ALL MOTORS'
                : `${STATUS_FILTERS.find((f) => f.key === selectedStatus)?.label.toUpperCase()} MOTORS`}
            </Text>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{displayedMotors.length}</Text>
            </View>
          </View>
          {isCustomFilterActive ? (
            <Pressable hitSlop={8} onPress={resetFilters}>
              <Text style={styles.resetFilterText}>Reset sort</Text>
            </Pressable>
          ) : null}
        </View>

        {/* 4. MOTORS LIST / STATES */}
        {isLoading ? (
          <View style={styles.skeletonList}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.skeletonCard}>
                <View style={styles.skeletonTopLine}>
                  <View style={styles.skeletonMotorNum} />
                  <View style={styles.skeletonBadge} />
                </View>
                <View style={styles.skeletonCustomer} />
                <View style={styles.skeletonSpecs} />
              </View>
            ))}
          </View>
        ) : error ? (
          <ErrorBanner
            message={parseApiError(error).message}
            onRetry={handleRefresh}
          />
        ) : allMotors.length === 0 && !search.trim() ? (
          <EmptyState
            title="No motors registered"
            description="Incoming customer motors will appear here when registered."
            actionTitle="Register Incoming Motor"
            onAction={() => router.push('/(app)/motors/register')}
          />
        ) : displayedMotors.length === 0 ? (
          <EmptyState
            title="No motors found"
            description="No motors match your search and active filter criteria."
            actionTitle="Clear Filters"
            onAction={resetFilters}
          />
        ) : (
          <>
            <View style={styles.motorsList}>
              {displayedMotors.map((motor) => {
                const activeJob = motor.job || motor.jobs?.[0];
                const ageText = formatRelativeTime(motor.receivedAt || motor.createdAt);

                return (
                  <Pressable
                    key={motor.id}
                    style={({ pressed }) => [
                      styles.motorCard,
                      pressed && styles.motorCardPressed,
                    ]}
                    onPress={() => router.push(`/(app)/motors/${motor.id}`)}>
                    {/* Top Row: Motor ID & Status Badge */}
                    <View style={styles.cardHeader}>
                      <View style={styles.motorIdWrap}>
                        <Ionicons
                          name="hardware-chip-outline"
                          size={16}
                          color={Colors.light.text}
                        />
                        <Text style={styles.motorNumber}>{motor.motorNumber}</Text>
                      </View>
                      {activeJob ? (
                        <StatusBadge status={activeJob.status} />
                      ) : (
                        <View style={styles.noJobBadge}>
                          <Text style={styles.noJobText}>NO ACTIVE JOB</Text>
                        </View>
                      )}
                    </View>

                    {/* Customer Info */}
                    <View style={styles.customerSection}>
                      <Text style={styles.customerName} numberOfLines={1}>
                        {motor.customerName}
                      </Text>
                      <Text style={styles.customerPhone}>{motor.customerPhone}</Text>
                    </View>

                    {/* Motor Technical Specs Pill Row */}
                    <View style={styles.specsRow}>
                      {motor.power ? (
                        <View style={styles.specChip}>
                          <Text style={styles.specChipText}>
                            {motor.power} {motor.powerUnit || 'HP'}
                          </Text>
                        </View>
                      ) : null}
                      {motor.rpm ? (
                        <View style={styles.specChip}>
                          <Text style={styles.specChipText}>{motor.rpm} RPM</Text>
                        </View>
                      ) : null}
                      {motor.phase ? (
                        <View style={styles.specChip}>
                          <Text style={styles.specChipText}>{motor.phase} Phase</Text>
                        </View>
                      ) : null}
                      {motor.brand ? (
                        <View style={styles.specChip}>
                          <Text style={styles.specChipText}>{motor.brand}</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Complaint/Notes Preview */}
                    {motor.complaint ? (
                      <View style={styles.complaintBox}>
                        <Text style={styles.complaintLabel}>COMPLAINT</Text>
                        <Text style={styles.complaintText} numberOfLines={1}>
                          {motor.complaint}
                        </Text>
                      </View>
                    ) : null}

                    {/* Card Footer: Age & Chevron */}
                    <View style={styles.cardFooter}>
                      <Text style={styles.timestampText}>Received {ageText}</Text>
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

            {data?.pagination && data.pagination.totalPages > 1 ? (
              <View style={styles.paginationRow}>
                <Button
                  title="Previous"
                  variant="secondary"
                  disabled={!data.pagination.hasPrevPage}
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                />
                <Text style={styles.pageLabel}>
                  Page {data.pagination.page} of {data.pagination.totalPages}
                </Text>
                <Button
                  title="Next"
                  variant="secondary"
                  disabled={!data.pagination.hasNextPage}
                  onPress={() => setPage((p) => p + 1)}
                />
              </View>
            ) : null}
          </>
        )}

        {/* 5. SORT MODAL */}
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
                <Text style={styles.modalTitle}>Sort Motors</Text>
                <Pressable
                  hitSlop={8}
                  onPress={() => setIsFilterModalVisible(false)}
                  style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={22} color={Colors.light.text} />
                </Pressable>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.filterSectionTitle}>ORDER BY</Text>
                <View style={styles.filterOptionsGroup}>
                  {[
                    { id: 'newest', label: 'Newest first (Date received)' },
                    { id: 'oldest', label: 'Oldest first' },
                    { id: 'customer', label: 'Customer Name (A-Z)' },
                    { id: 'motor_number', label: 'Motor Number (A-Z)' },
                  ].map((opt) => (
                    <Pressable
                      key={opt.id}
                      style={styles.filterOptionRow}
                      onPress={() => {
                        setSortBy(opt.id as SortOption);
                        setIsFilterModalVisible(false);
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
  motorsList: {
    gap: Spacing.sm,
  },
  motorCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  motorCardPressed: {
    backgroundColor: Colors.light.surfaceSubtle,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  motorIdWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  motorNumber: {
    ...Typography.headline,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
  },
  noJobBadge: {
    backgroundColor: Colors.light.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  noJobText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.textMuted,
    letterSpacing: 0.4,
  },
  customerSection: {
    gap: 1,
  },
  customerName: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  customerPhone: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  specChip: {
    backgroundColor: Colors.light.backgroundSubtle,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  specChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  complaintBox: {
    backgroundColor: Colors.light.backgroundSubtle,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 2,
  },
  complaintLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.light.textMuted,
    letterSpacing: 0.6,
  },
  complaintText: {
    fontSize: 12,
    color: Colors.light.text,
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
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  pageLabel: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textSecondary,
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
  skeletonMotorNum: {
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
  skeletonSpecs: {
    height: 24,
    borderRadius: Radius.sm,
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
