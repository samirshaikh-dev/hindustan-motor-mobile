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
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useMotorDetail } from '@/hooks/useMotors';
import { formatDateTime } from '@/utils/formatters';

export default function MotorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error, refetch, isRefetching } = useMotorDetail(id!);
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.light.textSecondary} size="small" />
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
        <View style={styles.headerMain}>
          <Text style={styles.number}>{data.motorNumber}</Text>
          <Text style={styles.customer}>{data.customerName}</Text>
          <Text style={styles.phone}>{data.customerPhone}</Text>
        </View>
        <Button title="Call" variant="secondary" onPress={callCustomer} />
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.meta}>Received {formatDateTime(data.receivedAt)}</Text>
        {data.expectedDeliveryAt ? (
          <Text style={styles.meta}>· Due {formatDateTime(data.expectedDeliveryAt)}</Text>
        ) : null}
      </View>

      {/* Specifications */}
      <Text style={styles.sectionTitle}>Specifications</Text>
      <View style={styles.group}>
        <View style={styles.specRow}>
          <Text style={styles.specKey}>Power</Text>
          <Text style={styles.specVal}>{powerText ?? '—'}</Text>
        </View>
        <View style={[styles.specRow, styles.rowBorder]}>
          <Text style={styles.specKey}>RPM</Text>
          <Text style={styles.specVal}>{data.rpm ? `${data.rpm} RPM` : '—'}</Text>
        </View>
        <View style={[styles.specRow, styles.rowBorder]}>
          <Text style={styles.specKey}>Phase</Text>
          <Text style={styles.specVal}>{data.phase ?? '—'}</Text>
        </View>
        <View style={[styles.specRow, styles.rowBorder]}>
          <Text style={styles.specKey}>Brand</Text>
          <Text style={styles.specVal}>{data.brand ?? '—'}</Text>
        </View>
        <View style={[styles.specRow, styles.rowBorder]}>
          <Text style={styles.specKey}>Type</Text>
          <Text style={styles.specVal}>{data.motorType ?? '—'}</Text>
        </View>
        <View style={[styles.specRow, styles.rowBorder]}>
          <Text style={styles.specKey}>Serial Number</Text>
          <Text style={styles.specVal}>{data.serialNumber ?? '—'}</Text>
        </View>
      </View>

      {/* Complaint */}
      {data.complaint ? (
        <>
          <Text style={styles.sectionTitle}>Reported Problem</Text>
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>{data.complaint}</Text>
          </View>
        </>
      ) : null}

      {/* Internal notes */}
      {data.notes ? (
        <>
          <Text style={styles.sectionTitle}>Internal Notes</Text>
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>{data.notes}</Text>
          </View>
        </>
      ) : null}

      {/* Job orders */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Job Orders</Text>
        <Button
          title="New Job"
          variant="secondary"
          onPress={() => router.push(`/(app)/jobs/create?motorId=${id}`)}
        />
      </View>

      {data.jobs && data.jobs.length > 0 ? (
        <View style={styles.group}>
          {data.jobs.map((job, idx) => (
            <Pressable
              key={job.id}
              style={({ pressed }) => [
                styles.jobRow,
                idx > 0 && styles.rowBorder,
                pressed && styles.rowPressed,
              ]}
              onPress={() => router.push(`/(app)/jobs/${job.id}`)}>
              <View style={styles.jobInfo}>
                <Text style={styles.jobNum}>{job.jobNumber}</Text>
                {job.notes ? (
                  <Text style={styles.jobNotes} numberOfLines={1}>
                    {job.notes}
                  </Text>
                ) : null}
              </View>
              <StatusBadge status={job.status} />
            </Pressable>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>No job orders created for this motor yet.</Text>
      )}

      {/* Photos */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Inspection Photos</Text>
        <Button
          title="Add Photo"
          variant="secondary"
          onPress={() => router.push(`/(app)/motors/${id}/upload`)}
        />
      </View>

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

      {/* Quiet Secondary Navigation Links */}
      <View style={styles.footerActions}>
        <Button
          title="Edit Motor Specifications"
          variant="secondary"
          onPress={() => router.push(`/(app)/motors/${id}/edit`)}
        />
        <Button
          title="View Motor Audit Timeline"
          variant="ghost"
          onPress={() => router.push(`/(app)/motors/${id}/history`)}
        />
      </View>

      {/* Photo Modal */}
      <Modal visible={!!activePhotoUrl} transparent animationType="fade">
        <View style={styles.modalBg}>
          <Pressable style={styles.modalCloseBtn} onPress={() => setActivePhotoUrl(null)}>
            <Text style={styles.modalCloseText}>Close</Text>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  headerMain: {
    flex: 1,
    marginRight: Spacing.md,
  },
  number: {
    ...Typography.title,
    color: Colors.light.text,
  },
  customer: {
    ...Typography.headline,
    fontSize: 16,
    color: Colors.light.text,
    marginTop: 2,
  },
  phone: {
    ...Typography.subhead,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: Spacing.lg,
  },
  meta: {
    ...Typography.caption,
    color: Colors.light.textMuted,
  },
  sectionTitle: {
    ...Typography.headline,
    fontSize: 13,
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  group: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  rowPressed: {
    backgroundColor: Colors.light.secondary,
  },
  specKey: {
    ...Typography.subhead,
    color: Colors.light.textSecondary,
  },
  specVal: {
    ...Typography.body,
    fontWeight: '500',
    color: Colors.light.text,
  },
  noteBox: {
    backgroundColor: Colors.light.surface,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  noteText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  jobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  jobInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  jobNum: {
    ...Typography.headline,
    fontSize: 15,
    color: Colors.light.text,
  },
  jobNotes: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  gallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.secondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  emptyText: {
    ...Typography.subhead,
    color: Colors.light.textMuted,
    marginVertical: Spacing.xs,
  },
  footerActions: {
    marginTop: Spacing.xl,
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 54,
    right: 20,
    zIndex: 10,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  modalCloseText: {
    color: Colors.light.primaryForeground,
    fontWeight: '600',
    fontSize: 13,
  },
  fullImage: {
    width: '90%',
    height: '75%',
  },
});
