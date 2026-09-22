import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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

const STATUS_FILTERS: { key: StatusFilterKey; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'RECEIVED', label: 'Received' },
  { key: 'IN_PROGRESS', label: 'Active' },
  { key: 'TESTING', label: 'Testing' },
  { key: 'READY_FOR_DELIVERY', label: 'Ready' },
  { key: 'DELIVERED', label: 'Delivered' },
];

export default function MyMotorsScreen() {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilterKey>('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch, isRefetching } = useMotors({
    status: selectedStatus === 'ALL' ? undefined : selectedStatus,
    search: search.trim() || undefined,
    page,
    limit: 50,
  });

  const allMotorsQuery = useMotors({ limit: 100 });
  const allMotors = allMotorsQuery.data?.items ?? [];

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

  const motors: Motor[] = data?.items ?? [];

  const resetFilters = () => {
    setSearch('');
    setSelectedStatus('ALL');
    setPage(1);
  };

  const handleRefresh = () => {
    refetch();
    allMotorsQuery.refetch();
  };

  return (
    <ScreenWrapper refreshing={isRefetching} onRefresh={handleRefresh}>
      <View style={styles.contentWrapper}>
        <SearchInput
          value={search}
          onChangeText={(t) => {
            setSearch(t);
            setPage(1);
          }}
          placeholder="Search motor number, customer, phone..."
        />

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
                <View style={[styles.statusCountBadge, isActive && styles.statusCountBadgeActive]}>
                  <Text style={[styles.statusCountText, isActive && styles.statusCountTextActive]}>
                    {count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>
              {selectedStatus === 'ALL'
                ? 'ALL MOTORS'
                : `${STATUS_FILTERS.find((f) => f.key === selectedStatus)?.label.toUpperCase()} MOTORS`}
            </Text>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{motors.length}</Text>
            </View>
          </View>
          {search.trim() || selectedStatus !== 'ALL' ? (
            <Pressable hitSlop={8} onPress={resetFilters}>
              <Text style={styles.resetFilterText}>Reset</Text>
            </Pressable>
          ) : null}
        </View>

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
          <ErrorBanner message={parseApiError(error).message} onRetry={handleRefresh} />
        ) : allMotors.length === 0 && !search.trim() ? (
          <EmptyState
            title="No motors registered"
            description="Incoming customer motors will appear here when registered."
            actionTitle="Register Incoming Motor"
            onAction={() => router.push('/(app)/shared/motors/register')}
          />
        ) : motors.length === 0 ? (
          <EmptyState
            title="No motors found"
            description="No motors match your search and active filter criteria."
            actionTitle="Clear Filters"
            onAction={resetFilters}
          />
        ) : (
          <>
            <View style={styles.motorsList}>
              {motors.map((motor) => {
                const activeJob = motor.job || motor.jobs?.[0];
                const ageText = formatRelativeTime(motor.receivedAt || motor.createdAt);

                return (
                  <Pressable
                    key={motor.id}
                    style={({ pressed }) => [styles.motorCard, pressed && styles.motorCardPressed]}
                    onPress={() => router.push(`/(app)/shared/motor/${motor.id}`)}>
                    <View style={styles.cardHeader}>
                      <View style={styles.motorIdWrap}>
                        <Ionicons name="hardware-chip-outline" size={16} color={Colors.light.primary} />
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

                    <View style={styles.customerSection}>
                      <Text style={styles.customerName} numberOfLines={1}>
                        {motor.customerName}
                      </Text>
                      <Text style={styles.customerPhone}>{motor.customerPhone}</Text>
                    </View>

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

                    {motor.complaint ? (
                      <View style={styles.complaintBox}>
                        <Text style={styles.complaintLabel}>COMPLAINT</Text>
                        <Text style={styles.complaintText} numberOfLines={1}>
                          {motor.complaint}
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.cardFooter}>
                      <Text style={styles.timestampText}>Received {ageText}</Text>
                      <Ionicons name="chevron-forward" size={16} color={Colors.light.textMuted} />
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
  statusChipsScroll: {
    flexGrow: 0,
  },
  statusChipsContainer: {
    gap: Spacing.xs,
    paddingVertical: 2,
  },
  statusChip: {
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
  statusChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  statusChipPressed: {
    opacity: 0.7,
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
    minWidth: 18,
    height: 18,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    backgroundColor: Colors.light.backgroundSubtle,
  },
  statusCountBadgeActive: {
    backgroundColor: Colors.light.primaryForeground,
  },
  statusCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },
  statusCountTextActive: {
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
    width: 90,
    height: 16,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.backgroundSubtle,
  },
  skeletonBadge: {
    width: 60,
    height: 16,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.backgroundSubtle,
  },
  skeletonCustomer: {
    width: 140,
    height: 14,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.backgroundSubtle,
  },
  skeletonSpecs: {
    width: '70%',
    height: 14,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.backgroundSubtle,
  },
  motorsList: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
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
    opacity: 0.85,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  motorIdWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  motorNumber: {
    ...Typography.subhead,
    fontWeight: '700',
    color: Colors.light.text,
  },
  noJobBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.backgroundSubtle,
  },
  noJobText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: Colors.light.textSecondary,
  },
  customerSection: {
    gap: 1,
  },
  customerName: {
    ...Typography.body,
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
    gap: 6,
  },
  specChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.backgroundSubtle,
  },
  specChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  complaintBox: {
    backgroundColor: Colors.light.backgroundSubtle,
    borderRadius: Radius.md,
    padding: 8,
    gap: 2,
  },
  complaintLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: Colors.light.textSecondary,
  },
  complaintText: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.text,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  timestampText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.xxxl,
  },
  pageLabel: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
});