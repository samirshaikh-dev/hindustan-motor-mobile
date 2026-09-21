import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { parseApiError } from '@/api/errors';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorBanner } from '@/components/feedback/ErrorBanner';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useJobDetail, useUpdateJobStatus } from '@/hooks/useJobs';
import type { JobStatus } from '@/types/domain';
import { formatDateTime } from '@/utils/formatters';
import { getNextJobStatuses } from '@/utils/jobTransitions';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error, refetch, isRefetching } = useJobDetail(id!);
  const updateStatusMutation = useUpdateJobStatus(id!);

  const [pendingStatus, setPendingStatus] = useState<JobStatus | null>(null);
  const [transitionNotes, setTransitionNotes] = useState('');

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

  const onConfirmTransition = async () => {
    if (!pendingStatus) return;
    try {
      await updateStatusMutation.mutateAsync({
        status: pendingStatus,
        notes: transitionNotes.trim() || undefined,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPendingStatus(null);
      setTransitionNotes('');
    } catch (e) {
      Alert.alert('Status update failed', parseApiError(e).message);
    }
  };

  const nextStatuses = getNextJobStatuses(data.status);
  const primaryNextStatus = nextStatuses.find((s) => s !== 'CANCELLED');
  const cancelStatus = nextStatuses.find((s) => s === 'CANCELLED');

  return (
    <ScreenWrapper refreshing={isRefetching} onRefresh={() => refetch()}>
      <View style={styles.contentWrapper}>
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroMain}>
              <Text style={styles.num}>{data.jobNumber}</Text>
              <Text style={styles.created}>Created {formatDateTime(data.createdAt)}</Text>
            </View>
            <StatusBadge status={data.status} />
          </View>

          {primaryNextStatus || cancelStatus ? (
            <View style={styles.transitionRow}>
              {primaryNextStatus ? (
                <Button
                  title={`Advance to ${primaryNextStatus.replace(/_/g, ' ')}`}
                  variant="primary"
                  style={styles.transitionBtn}
                  onPress={() => setPendingStatus(primaryNextStatus)}
                />
              ) : null}
              {cancelStatus ? (
                <Button
                  title="Cancel Job"
                  variant="danger"
                  onPress={() => setPendingStatus('CANCELLED')}
                />
              ) : null}
            </View>
          ) : null}
        </View>

        {data.motor ? (
          <Pressable
            style={({ pressed }) => [styles.motorCard, pressed && styles.cardPressed]}
            onPress={() => router.push(`/(app)/motors/${data.motorId}`)}>
            <View style={styles.motorTop}>
              <Text style={styles.sectionLabel}>Target Motor</Text>
              <Text style={styles.linkText}>View Motor →</Text>
            </View>
            <Text style={styles.motorNumber}>{data.motor.motorNumber}</Text>
            <Text style={styles.customer}>{data.motor.customerName}</Text>
          </Pressable>
        ) : null}

        {data.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.sectionLabel}>Instructions & Notes</Text>
            <Text style={styles.notesText}>{data.notes}</Text>
          </View>
        ) : null}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            Tasks ({data.tasks?.length ?? 0})
          </Text>
          <Button
            title="Add Task"
            variant="secondary"
            onPress={() => router.push(`/(app)/jobs/${id}/add-task`)}
          />
        </View>

        {(data.tasks?.length ?? 0) === 0 ? (
          <EmptyState
            icon="🔧"
            title="No tasks created"
            description="Add tasks to assign work steps to floor technicians."
            actionTitle="Add First Task"
            onAction={() => router.push(`/(app)/jobs/${id}/add-task`)}
          />
        ) : (
          <View style={styles.cardGroup}>
            {data.tasks?.map((task, idx) => (
              <Pressable
                key={task.id}
                style={({ pressed }) => [
                  styles.taskRow,
                  idx > 0 && styles.rowBorder,
                  pressed && styles.rowPressed,
                ]}
                onPress={() => router.push(`/(app)/tasks/${task.id}`)}>
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  {task.assignedEmployee ? (
                    <Text style={styles.assignee}>
                      Assigned: {task.assignedEmployee.name}
                    </Text>
                  ) : (
                    <Text style={styles.unassigned}>Unassigned</Text>
                  )}
                </View>
                <StatusBadge status={task.status} />
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.footerActions}>
          <Button
            title="View Job Audit History"
            variant="ghost"
            onPress={() => router.push(`/(app)/jobs/${id}/history`)}
          />
        </View>

        <Modal visible={!!pendingStatus} transparent animationType="fade">
          <View style={styles.modalBg}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Update Job Status</Text>
              <Text style={styles.modalSub}>
                Advance status to{' '}
                <Text style={styles.boldText}>
                  {pendingStatus?.replace(/_/g, ' ')}
                </Text>
              </Text>

              <Input
                label="Transition Note (optional)"
                placeholder="Reason or notes for status update"
                value={transitionNotes}
                onChangeText={setTransitionNotes}
              />

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  variant="ghost"
                  onPress={() => {
                    setPendingStatus(null);
                    setTransitionNotes('');
                  }}
                />
                <Button
                  title="Confirm Update"
                  loading={updateStatusMutation.isPending}
                  onPress={onConfirmTransition}
                />
              </View>
            </View>
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
  num: {
    ...Typography.title,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  created: {
    ...Typography.subhead,
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  transitionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
    paddingTop: Spacing.md,
  },
  transitionBtn: {
    flex: 1,
  },
  motorCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.lg,
    gap: 3,
  },
  cardPressed: {
    opacity: 0.85,
  },
  motorTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  sectionLabel: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  linkText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  motorNumber: {
    ...Typography.headline,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
  },
  customer: {
    ...Typography.subhead,
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  notesBox: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  notesText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.headline,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cardGroup: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  taskRow: {
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
  rowPressed: {
    backgroundColor: Colors.light.secondary,
  },
  taskInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  taskTitle: {
    ...Typography.headline,
    fontSize: 15,
    color: Colors.light.text,
  },
  assignee: {
    ...Typography.subhead,
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  unassigned: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  footerActions: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    gap: Spacing.md,
  },
  modalTitle: {
    ...Typography.title,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  modalSub: {
    ...Typography.subhead,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  boldText: {
    fontWeight: '700',
    color: Colors.light.text,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
});
