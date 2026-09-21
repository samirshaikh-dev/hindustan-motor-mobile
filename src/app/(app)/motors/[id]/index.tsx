import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { parseApiError } from '@/api/errors';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ErrorBanner } from '@/components/feedback/ErrorBanner';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { useMotorDetail } from '@/hooks/useMotors';
import { formatDateTime } from '@/utils/formatters';

export default function MotorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error, refetch, isRefetching } = useMotorDetail(id!);
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#0284c7" size="large" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <ScreenWrapper>
        <ErrorBanner message={parseApiError(error).message} onRetry={() => refetch()} />
      </ScreenWrapper>
    );
  }

  const callCustomer = () => {
    if (data.customerPhone) {
      Linking.openURL(`tel:${data.customerPhone}`);
    }
  };

  const powerText = data.power ? `${data.power} ${data.powerUnit || 'HP'}` : null;

  return (
    <ScreenWrapper refreshing={isRefetching} onRefresh={() => refetch()}>
      <View style={styles.header}>
        <View>
          <Text style={styles.number}>{data.motorNumber}</Text>
          <Text style={styles.customer}>{data.customerName}</Text>
        </View>
        <Button title="Call" variant="secondary" onPress={callCustomer} />
      </View>

      <Text style={styles.phone}>{data.customerPhone}</Text>
      <Text style={styles.meta}>Received: {formatDateTime(data.receivedAt)}</Text>
      {data.expectedDeliveryAt ? (
        <Text style={styles.meta}>Expected: {formatDateTime(data.expectedDeliveryAt)}</Text>
      ) : null}

      <Text style={styles.sectionTitle}>Specifications</Text>
      <View style={styles.specsGrid}>
        <View style={styles.specItem}>
          <Text style={styles.specLabel}>Power</Text>
          <Text style={styles.specValue}>{powerText ?? '—'}</Text>
        </View>
        <View style={styles.specItem}>
          <Text style={styles.specLabel}>RPM</Text>
          <Text style={styles.specValue}>{data.rpm ? `${data.rpm} RPM` : '—'}</Text>
        </View>
        <View style={styles.specItem}>
          <Text style={styles.specLabel}>Phase</Text>
          <Text style={styles.specValue}>{data.phase ?? '—'}</Text>
        </View>
        <View style={styles.specItem}>
          <Text style={styles.specLabel}>Brand</Text>
          <Text style={styles.specValue}>{data.brand ?? '—'}</Text>
        </View>
        <View style={styles.specItem}>
          <Text style={styles.specLabel}>Type</Text>
          <Text style={styles.specValue}>{data.motorType ?? '—'}</Text>
        </View>
        <View style={styles.specItem}>
          <Text style={styles.specLabel}>Serial No.</Text>
          <Text style={styles.specValue}>{data.serialNumber ?? '—'}</Text>
        </View>
      </View>

      {data.complaint ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Reported Complaint</Text>
          <Text style={styles.cardText}>{data.complaint}</Text>
        </View>
      ) : null}

      {data.notes ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Internal Notes</Text>
          <Text style={styles.cardText}>{data.notes}</Text>
        </View>
      ) : null}

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Job Orders</Text>
        <Button
          title="New Job Order"
          variant="secondary"
          onPress={() => router.push(`/(app)/jobs/create?motorId=${id}`)}
        />
      </View>

      {data.jobs && data.jobs.length > 0 ? (
        data.jobs.map((job) => (
          <View key={job.id} style={styles.jobRow}>
            <View style={styles.jobHeader}>
              <Text style={styles.jobNum}>{job.jobNumber}</Text>
              <StatusBadge status={job.status} />
            </View>
            {job.notes ? <Text style={styles.jobNotes}>{job.notes}</Text> : null}
            <Button
              title="Open Job Details"
              variant="secondary"
              onPress={() => router.push(`/(app)/jobs/${job.id}`)}
            />
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No active jobs for this motor.</Text>
      )}

      <Text style={styles.sectionTitle}>Damage & Inspection Photos</Text>
      {data.images && data.images.length > 0 ? (
        <View style={styles.gallery}>
          {data.images.map((img) => (
            <Pressable key={img.id} onPress={() => setActivePhotoUrl(img.secureUrl)}>
              <Image source={{ uri: img.secureUrl }} style={styles.thumb} />
            </Pressable>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>No photos uploaded yet.</Text>
      )}

      <View style={styles.actions}>
        <Button title="Take photo" onPress={() => router.push(`/(app)/motors/${id}/upload`)} />
        <Button
          title="Edit details"
          variant="secondary"
          onPress={() => router.push(`/(app)/motors/${id}/edit`)}
        />
        <Button
          title="View audit timeline"
          variant="secondary"
          onPress={() => router.push(`/(app)/motors/${id}/history`)}
        />
      </View>

      {/* Full-size Photo Preview Modal */}
      <Modal visible={!!activePhotoUrl} transparent animationType="fade">
        <View style={styles.modalBg}>
          <Pressable style={styles.modalCloseBtn} onPress={() => setActivePhotoUrl(null)}>
            <Text style={styles.modalCloseText}>✕ Close</Text>
          </Pressable>
          {activePhotoUrl ? (
            <Image
              source={{ uri: activePhotoUrl }}
              style={styles.fullImage}
              contentFit="contain"
            />
          ) : null}
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  number: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  customer: { fontSize: 18, fontWeight: '600', color: '#334155', marginTop: 2 },
  phone: { color: '#64748b', fontSize: 14, marginTop: 4 },
  meta: { color: '#64748b', fontSize: 13, marginTop: 2 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 22, marginBottom: 8, color: '#0f172a' },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 8,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    gap: 12,
  },
  specItem: { width: '47%' },
  specLabel: { fontSize: 12, color: '#64748b', textTransform: 'uppercase' },
  specValue: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginTop: 2 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginTop: 12,
  },
  cardLabel: { fontSize: 12, color: '#64748b', fontWeight: '700', marginBottom: 4 },
  cardText: { fontSize: 14, color: '#1e293b', lineHeight: 20 },
  jobRow: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  jobNum: { fontWeight: '700', fontSize: 15 },
  jobNotes: { color: '#64748b', fontSize: 13 },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  thumb: { width: 96, height: 96, borderRadius: 8, backgroundColor: '#f1f5f9' },
  emptyText: { color: '#94a3b8', fontSize: 14, marginVertical: 4 },
  actions: { marginTop: 24, gap: 10, marginBottom: 20 },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modalCloseText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  fullImage: { width: '90%', height: '70%' },
});
