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
      <TextInput
        style={styles.search}
        placeholder="Filter by job number, customer, motor..."
        placeholderTextColor="#94a3b8"
        value={search}
        onChangeText={setSearch}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        {STATUSES.map((s) => (
          <Pressable
            key={s}
            style={[styles.chip, status === s && styles.chipActive]}
            onPress={() => {
              setStatus(s);
              setPage(1);
            }}>
            <Text style={[styles.chipText, status === s && styles.chipTextActive]}>
              {s.replace(/_/g, ' ')}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator color="#0284c7" style={{ marginTop: 24 }} />
      ) : error ? (
        <ErrorBanner message={parseApiError(error).message} onRetry={() => refetch()} />
      ) : filteredJobs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>No jobs found matching criteria.</Text>
        </View>
      ) : (
        <>
          <View style={styles.list}>
            {filteredJobs.map((job) => (
              <Pressable
                key={job.id}
                style={styles.card}
                onPress={() => router.push(`/(app)/jobs/${job.id}`)}>
                <View style={styles.cardHeader}>
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
                  <Text style={styles.notes} numberOfLines={2}>
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
  search: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
    fontSize: 15,
  },
  chips: { marginBottom: 12, maxHeight: 40 },
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
  list: { gap: 10 },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  num: { fontWeight: '800', fontSize: 16, color: '#0f172a' },
  customer: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  metaRow: { flexDirection: 'row', gap: 6 },
  meta: { color: '#64748b', fontSize: 13 },
  notes: { color: '#475569', fontSize: 13, marginTop: 4 },
  emptyContainer: { paddingVertical: 40, alignItems: 'center' },
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
