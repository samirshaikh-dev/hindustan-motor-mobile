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
import { TimelineItem } from '@/components/domain/TimelineItem';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorBanner } from '@/components/feedback/ErrorBanner';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useGlobalHistory } from '@/hooks/useHistory';
import type { HistoryAction } from '@/types/domain';

const ACTION_FILTERS: { label: string; value: string | undefined }[] = [
  { label: 'All Activities', value: undefined },
  { label: 'Motors', value: 'MOTOR_REGISTERED' },
  { label: 'Jobs', value: 'JOB_STATUS_CHANGED' },
  { label: 'Tasks', value: 'TASK_COMPLETED' },
  { label: 'Photos', value: 'MOTOR_IMAGE_UPLOADED' },
  { label: 'Team', value: 'EMPLOYEE_CREATED' },
];

export default function HistoryScreen() {
  const [action, setAction] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch, isRefetching } = useGlobalHistory({
    action: action as HistoryAction,
    page,
    limit: 25,
  });

  return (
    <ScreenWrapper refreshing={isRefetching} onRefresh={() => refetch()}>
      <View style={styles.contentWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
          style={styles.chips}>
          {ACTION_FILTERS.map((f) => {
            const active = action === f.value;
            return (
              <Pressable
                key={f.label}
                style={({ pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  pressed && styles.chipPressed,
                ]}
                onPress={() => {
                  setAction(f.value);
                  setPage(1);
                }}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {f.label}
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
        ) : (data?.history ?? []).length === 0 ? (
          <EmptyState
            icon="📜"
            title="No audit logs"
            description="No logged events found for the selected category."
          />
        ) : (
          <>
            <View style={styles.list}>
              {(data?.history ?? []).map((item) => (
                <TimelineItem key={item.id} item={item} />
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
  list: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xs,
    paddingBottom: Spacing.xl,
  },
  pageLabel: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
});
