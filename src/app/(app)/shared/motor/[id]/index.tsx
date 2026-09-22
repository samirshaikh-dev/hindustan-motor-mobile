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
import { useAuthStore } from '@/store/useAuthStore';
import { formatDateTime } from '@/utils/formatters';

export default function MotorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error, refetch, isRefetching } = useMotorDetail(id!);
  const isOwner = useAuthStore((s) => s.activeActorRole === 'OWNER');
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  if (isLoading) {
    return (
      <ScreenWrapper>
        <View style={styles.centerBox}>
          <ActivityIndicator color={Colors.light.textSecondary} size="small" />
        </View>
      </ScreenWrapper>
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
      <View style={styles.contentWrapper}>
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroMain}>
              <Text style={styles.motorNum}>{data.motorNumber}</Text>
              <Text style={styles.customer}>{data.customerName}</Text>
              <Text style={styles.phone}>{data.customerPhone}</Text>
            </View>
            <Button title="Call Customer" variant="secondary" onPress={callCustomer} />
          </View>

          <View style={styles.heroDates}>
            <Text style={styles.dateLabel}>
              Received {formatDateTime(data.receivedAt)}
            </Text>
            {data.expectedDeliveryAt ? (
              <Text style={styles.dateLabel}>
                · Due {formatDateTime(data.expectedDeliveryAt)}
              </Text>
            ) : null}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Specifications</Text>
        <View style={styles.cardGroup}>
          <View style={styles.specRow}>
            <Text style={styles.specKey}>Power Rating</Text>
            <Text style={styles.specVal}>{powerText ?? '—'}</Text>
          </View>
          <View style={[styles.specRow, styles.rowBorder]}>
            <Text style={styles.specKey}>Speed (RPM)</Text>
            <Text style={styles.specVal}>{data.rpm ? `${data.rpm} RPM` : '—'}</Text>
          </View>
          <View style={[styles.specRow, styles.rowBorder]}>
            <Text style={styles.specKey}>Supply Phase</Text>
            <Text style={styles.specVal}>{data.phase ?? '—'}</Text>
          </View>
          <View style={[styles.specRow, styles.rowBorder]}>
            <Text style={styles.specKey}>Manufacturer / Brand</Text>
            <Text style={styles.specVal}>{data.brand ?? '—'}</Text>
          </View>
          <View style={[styles.specRow, styles.rowBorder]}>
            <Text style={styles.specKey}>Motor Type</Text>
            <Text style={styles.specVal}>{data.motorType ?? '—'}</Text>
          </View>
          <View style={[styles.specRow, styles.rowBorder]}>
            <Text style={styles.specKey}>Serial Number</Text>
            <Text style={styles.specVal}>{data.serialNumber ?? '—'}</Text>
          </View>
        </View>

        {data.complaint ? (
          <>
            <Text style={styles.sectionTitle}>Reported Problem</Text>
            <View style={styles.noteCard}>
              <Text style={styles.noteText}>{data.complaint}</Text>
            </View>
          </>
        ) : null}

        {data.notes ? (
          <>
            <Text style={styles.sectionTitle}>Internal Workshop Notes</Text>
            <View style={styles.noteCard}>
              <Text style={styles.noteText}>{data.notes}</Text>
            </View>
          </>
        ) : null}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Job Orders</Text>
          {isOwner ? (
            <Button
              title="New Job"
              variant="secondary"
              onPress={() => router.push(`/(app)/shared/jobs/create?motorId=${id}`)}
            />
          ) : null}
        </View>

        {data.jobs && data.jobs.length > 0 ? (
          <View style={styles.cardGroup}>
            {data.jobs.map((job, idx) => (
              <Pressable
                key={job.id}
                style={({ pressed }) => [
                  styles.jobRow,
                  idx > 0 && styles.rowBorder,
                  pressed && styles.rowPressed,
                ]}
                onPress={() => router.push(`/(app)/shared/job/${job.id}`)}>
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
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No job orders created for this motor yet.</Text>
          </View>
        )}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Inspection Photos</Text>
          <Button
            title="Add Photo"
            variant="secondary"
            onPress={() => router.push(`/(app)/shared/motor/${id}/upload`)}
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
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No inspection photos uploaded yet.</Text>
          </View>
        )}

        <View style={styles.footerActions}>
          {isOwner ? (
            <Button
              title="Edit Motor Specifications"
              variant="secondary"
              onPress={() => router.push(`/(app)/shared/motor/${id}/edit`)}
            />
          ) : null}
          <Button
            title="View Audit Timeline"
            variant="ghost"
            onPress={() => router.push(`/(app)/shared/motor/${id}/history`)}
          />
        </View>

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
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  contentWrapper: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    gap: Spacing.sm,
  },
  centerBox: {
    paddingVertical: Spacing.xxxl * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroMain: {
    flex: 1,
    marginRight: Spacing.md,
  },
  motorNum: {
    ...Typography.title,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  customer: {
    ...Typography.headline,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 2,
  },
  phone: {
    ...Typography.subhead,
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  heroDates: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
    paddingTop: Spacing.sm,
  },
  dateLabel: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  sectionTitle: {
    ...Typography.headline,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  cardGroup: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  specKey: {
    ...Typography.subhead,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  specVal: {
    ...Typography.headline,
    fontSize: 14,
    color: Colors.light.text,
  },
  noteCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.lg,
  },
  noteText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  jobRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  rowPressed: {
    backgroundColor: Colors.light.secondary,
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
    ...Typography.subhead,
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.subhead,
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  gallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  thumb: {
    width: 84,
    height: 84,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  footerActions: {
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
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
    padding: Spacing.sm,
  },
  modalCloseText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  fullImage: {
    width: '90%',
    height: '80%',
  },
});
