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
      <TextInput
        style={styles.search}
        placeholder="Search motor number, customer, phone..."
        placeholderTextColor="#94a3b8"
        value={search}
        onChangeText={(t) => {
          setSearch(t);
          setPage(1);
        }}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        {STATUS_FILTERS.map((s) => (
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

      <Button title="Register new motor" onPress={() => router.push('/(app)/motors/register')} />

      {isLoading ? (
        <ActivityIndicator color="#0284c7" style={{ marginTop: 24 }} />
      ) : error ? (
        <ErrorBanner message={parseApiError(error).message} onRetry={() => refetch()} />
      ) : (data?.items.length ?? 0) === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>No motors found matching criteria.</Text>
        </View>
      ) : (
        <>
          <View style={styles.list}>
            {data?.items.map((motor) => {
              const activeJob = motor.jobs?.[0];
              const powerSpec = motor.power ? `${motor.power} ${motor.powerUnit || 'HP'}` : null;
              return (
                <Pressable
                  key={motor.id}
                  style={styles.card}
                  onPress={() => router.push(`/(app)/motors/${motor.id}`)}>
                  <View style={styles.cardHeader}>
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
                    <Text style={styles.complaint} numberOfLines={2}>
                      {motor.complaint}
                    </Text>
                  ) : null}
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
  list: { marginTop: 14, gap: 10 },
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
  number: { fontWeight: '800', fontSize: 16, color: '#0f172a' },
  customer: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  metaRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  meta: { color: '#64748b', fontSize: 13 },
  complaint: { color: '#475569', fontSize: 13, marginTop: 4 },
  emptyContainer: { paddingVertical: 40, alignItems: 'center' },
  empty: { color: '#64748b', textAlign: 'center', fontSize: 15 },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 10,
  },
  pageLabel: { color: '#64748b', fontSize: 14, fontWeight: '600' },
});
