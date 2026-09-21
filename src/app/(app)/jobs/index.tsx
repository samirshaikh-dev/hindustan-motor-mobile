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
import { Button } from '@/components/common/Button';
import { SearchInput } from '@/components/common/SearchInput';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorBanner } from '@/components/feedback/ErrorBanner';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useJobs } from '@/hooks/useJobs';
import type { JobStatus } from '@/types/domain';

const STATUSES: (JobStatus | 'ALL')[] = [
  'ALL',
  'RECEIVED',
  'IN_PROGRESS',
  'TESTING',
  'READY_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

export default function JobsListScreen() {
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('ALL');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, error, refetch, isRefetching } = useJobs({
    status: status === 'ALL' ? undefined : status,
    page,
    limit: 20,
  });

  const filteredJobs = (data?.items ?? []).filter((j) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const num = j.jobNumber.toLowerCase();
    const cust = j.motor?.customerName?.toLowerCase() || '';
    const mtr = j.motor?.motorNumber?.toLowerCase() || '';
    return num.includes(q) || cust.includes(q) || mtr.includes(q);
  });

  return (
    <ScreenWrapper refreshing={isRefetching} onRefresh={() => refetch()}>
      <View style={styles.contentWrapper}>
        <View style={styles.searchWrap}>
          <SearchInput
            value={search}
            onChangeText={(t) => {
              setSearch(t);
              setPage(1);
            }}
            placeholder="Filter by job number, customer, motor..."
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
          style={styles.chips}>
          {STATUSES.map((s) => {
            const active = status === s;
            return (
              <Pressable
                key={s}
                style={({ pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  pressed && styles.chipPressed,
                ]}
                onPress={() => {
                  setStatus(s);
                  setPage(1);
                }}>
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
          <ErrorBanner
            message={parseApiError(error).message}
            onRetry={() => refetch()}
          />
        ) : filteredJobs.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No jobs found"
            description="No job orders match your active filter criteria."
          />
        ) : (
          <>
            <View style={styles.group}>
              {filteredJobs.map((job, index) => (
                <Pressable
                  key={job.id}
                  style={({ pressed }) => [
                    styles.row,
                    index > 0 && styles.rowBorder,
                    pressed && styles.rowPressed,
                  ]}
                  onPress={() => router.push(`/(app)/jobs/${job.id}`)}>
                  <View style={styles.topLine}>
                    <Text style={styles.num}>{job.jobNumber}</Text>
                    <StatusBadge status={job.status} />
                  </View>
                  <Text style={styles.customer}>{job.motor?.customerName}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.meta}>Motor: {job.motor?.motorNumber}</Text>
                    {job.tasks ? (
                      <Text style={styles.meta}>· {job.tasks.length} task(s)</Text>
                    ) : null}
                  </View>
                  {job.notes ? (
                    <Text style={styles.notes} numberOfLines={1}>
                      {job.notes}
                    </Text>
                  ) : null}
                </Pressable>
              ))}
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
  },
  searchWrap: {
    marginBottom: Spacing.sm,
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
    paddingVertical: 7,
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
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  chipTextActive: {
    color: Colors.light.primaryForeground,
  },
  loadingBox: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
  },
  group: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  row: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: 3,
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
    alignItems: 'center',
  },
  num: {
    ...Typography.headline,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
  },
  customer: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  meta: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  notes: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 1,
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
});
