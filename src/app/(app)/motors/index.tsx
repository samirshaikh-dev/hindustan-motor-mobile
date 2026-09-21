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
import { useMotors } from '@/hooks/useMotors';
import type { JobStatus } from '@/types/domain';

const STATUS_FILTERS: (JobStatus | 'ALL')[] = [
  'ALL',
  'RECEIVED',
  'IN_PROGRESS',
  'TESTING',
  'READY_FOR_DELIVERY',
  'DELIVERED',
];

export default function MotorsListScreen() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch, isRefetching } = useMotors({
    search: search.trim() || undefined,
    status: status === 'ALL' ? undefined : status,
    page,
    limit: 20,
  });

  return (
    <ScreenWrapper refreshing={isRefetching} onRefresh={() => refetch()}>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Search motor number, customer, phone..."
          placeholderTextColor={Colors.light.textMuted}
          value={search}
          onChangeText={(t) => {
            setSearch(t);
            setPage(1);
          }}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
        style={styles.chips}>
        {STATUS_FILTERS.map((s) => {
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

      <View style={styles.ctaRow}>
        <Button
          title="Register New Motor"
          onPress={() => router.push('/(app)/motors/register')}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Colors.light.textSecondary} size="small" />
        </View>
      ) : error ? (
        <ErrorBanner message={parseApiError(error).message} onRetry={() => refetch()} />
      ) : (data?.items.length ?? 0) === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>No motors found matching criteria.</Text>
        </View>
      ) : (
        <>
          <View style={styles.group}>
            {data?.items.map((motor, index) => {
              const activeJob = motor.jobs?.[0];
              const powerSpec = motor.power ? `${motor.power} ${motor.powerUnit || 'HP'}` : null;
              return (
                <Pressable
                  key={motor.id}
                  style={({ pressed }) => [
                    styles.row,
                    index > 0 && styles.rowBorder,
                    pressed && styles.rowPressed,
                  ]}
                  onPress={() => router.push(`/(app)/motors/${motor.id}`)}>
                  <View style={styles.rowMain}>
                    <View style={styles.topLine}>
                      <Text style={styles.number}>{motor.motorNumber}</Text>
                      {activeJob ? <StatusBadge status={activeJob.status} /> : null}
                    </View>
                    <Text style={styles.customer}>{motor.customerName}</Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.meta}>{motor.customerPhone}</Text>
                      {powerSpec ? <Text style={styles.meta}>· {powerSpec}</Text> : null}
                      {motor.brand ? <Text style={styles.meta}>· {motor.brand}</Text> : null}
                    </View>
                    {motor.complaint ? (
                      <Text style={styles.complaint} numberOfLines={1}>
                        {motor.complaint}
                      </Text>
                    ) : null}
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
  ctaRow: {
    marginBottom: Spacing.md,
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
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  rowPressed: {
    backgroundColor: Colors.light.secondary,
  },
  rowMain: {
    gap: 3,
  },
  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  number: {
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
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: 2,
  },
  meta: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  complaint: {
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
