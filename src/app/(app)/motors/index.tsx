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
      <View style={styles.contentWrapper}>
        <View style={styles.searchWrap}>
          <SearchInput
            value={search}
            onChangeText={(t) => {
              setSearch(t);
              setPage(1);
            }}
            placeholder="Search motor number, customer, phone..."
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
          <ErrorBanner
            message={parseApiError(error).message}
            onRetry={() => refetch()}
          />
        ) : (data?.items.length ?? 0) === 0 ? (
          <EmptyState
            icon="⚙️"
            title="No motors found"
            description="No motors match your search and filter criteria."
            actionTitle="Register New Motor"
            onAction={() => router.push('/(app)/motors/register')}
          />
        ) : (
          <>
            <View style={styles.group}>
              {data?.items.map((motor, index) => (
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
                      <Text style={styles.motorNum}>{motor.motorNumber}</Text>
                      {motor.jobs && motor.jobs.length > 0 ? (
                        <StatusBadge status={motor.jobs[0].status} />
                      ) : null}
                    </View>
                    <Text style={styles.customer}>{motor.customerName}</Text>
                    <View style={styles.specLine}>
                      {motor.power ? (
                        <Text style={styles.spec}>
                          {motor.power} {motor.powerUnit || 'HP'}
                        </Text>
                      ) : null}
                      {motor.rpm ? (
                        <Text style={styles.spec}>· {motor.rpm} RPM</Text>
                      ) : null}
                      {motor.phase ? (
                        <Text style={styles.spec}>· {motor.phase} Phase</Text>
                      ) : null}
                      {motor.brand ? (
                        <Text style={styles.spec}>· {motor.brand}</Text>
                      ) : null}
                    </View>
                    <Text style={styles.phone}>{motor.customerPhone}</Text>
                  </View>
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
  ctaRow: {
    marginBottom: Spacing.lg,
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
  motorNum: {
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
  specLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 1,
  },
  spec: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  phone: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.light.textMuted,
    marginTop: 2,
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
