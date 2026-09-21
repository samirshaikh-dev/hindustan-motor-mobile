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
import { ErrorBanner } from '@/components/feedback/ErrorBanner';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
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
      <Text style={styles.title}>Workshop Audit Log</Text>
      <Text style={styles.sub}>Chronological record of floor activity and job state changes.</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        {ACTION_FILTERS.map((f) => (
          <Pressable
            key={f.label}
            style={[styles.chip, action === f.value && styles.chipActive]}
            onPress={() => {
              setAction(f.value);
              setPage(1);
            }}>
            <Text style={[styles.chipText, action === f.value && styles.chipTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator color="#0284c7" style={{ marginTop: 24 }} />
      ) : error ? (
        <ErrorBanner message={parseApiError(error).message} onRetry={() => refetch()} />
      ) : (data?.history ?? []).length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.empty}>No audit logs found for this filter.</Text>
        </View>
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
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  sub: { color: '#64748b', fontSize: 13, marginTop: 2, marginBottom: 14 },
  chips: { marginBottom: 14, maxHeight: 40 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  chipText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  chipTextActive: { color: '#fff' },
  list: { gap: 10, marginTop: 4 },
  emptyBox: { paddingVertical: 40, alignItems: 'center' },
  empty: { color: '#64748b', fontSize: 14 },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 10,
  },
  pageLabel: { color: '#64748b', fontSize: 14, fontWeight: '600' },
});
