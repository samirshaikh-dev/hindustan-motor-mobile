import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { parseApiError } from '@/api/errors';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
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
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Filter by job number, customer, motor..."
          placeholderTextColor={Colors.light.textMuted}
          value={search}
          onChangeText={setSearch}
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
        <ErrorBanner message={parseApiError(error).message} onRetry={() => refetch()} />
      ) : filteredJobs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>No jobs found matching criteria.</Text>
        </View>
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
                  <Text style={styles.meta}>{job.motor?.motorNumber}</Text>
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
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    marginBottom: Spacing.sm,
  },
  search: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    backgroundColor: Colors.light.surface,
    fontSize: 15,
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
    marginTop: 2,
  },
  meta: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  notes: {
    ...Typography.caption,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  emptyContainer: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
  },
  empty: {
    ...Typography.body,
    color: Colors.light.textSecondary,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  pageLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
});
