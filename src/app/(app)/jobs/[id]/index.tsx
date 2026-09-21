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
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <Text style={styles.num}>{data.jobNumber}</Text>
          <Text style={styles.created}>Created {formatDateTime(data.createdAt)}</Text>
        </View>
        <StatusBadge status={data.status} />
      </View>

      {/* Linked Motor */}
      {data.motor ? (
        <Pressable
          style={({ pressed }) => [styles.motorCard, pressed && styles.cardPressed]}
          onPress={() => router.push(`/(app)/motors/${data.motorId}`)}>
          <View style={styles.motorTop}>
            <Text style={styles.sectionLabel}>Linked Motor</Text>
            <Text style={styles.linkText}>View Motor →</Text>
          </View>
          <Text style={styles.motorNumber}>{data.motor.motorNumber}</Text>
          <Text style={styles.customer}>{data.motor.customerName}</Text>
        </Pressable>
      ) : null}

      {/* Job Notes */}
      {data.notes ? (
        <View style={styles.notesBox}>
          <Text style={styles.sectionLabel}>Instructions & Notes</Text>
          <Text style={styles.notesText}>{data.notes}</Text>
        </View>
      ) : null}

      {/* Tasks Section */}
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
        <Text style={styles.emptyText}>No tasks created under this job order yet.</Text>
      ) : (
        <View style={styles.group}>
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
                <Text style={styles.taskAssignee}>
                  {task.assignedEmployee
                    ? `Assigned: ${task.assignedEmployee.name}`
                    : 'Unassigned'}
                </Text>
              </View>
              <StatusBadge status={task.status} />
            </Pressable>
          ))}
        </View>
      )}

      {/* Advance Status: Exactly one primary CTA */}
      {primaryNextStatus ? (
        <View style={styles.transitionSection}>
          <Button
            title={`Advance Status to ${primaryNextStatus.replace(/_/g, ' ')}`}
            onPress={() => {
              setPendingStatus(primaryNextStatus);
              setTransitionNotes('');
            }}
          />
        </View>
      ) : null}

      {/* Secondary / Danger Actions */}
      <View style={styles.footerActions}>
        {cancelStatus ? (
          <Button
            title="Cancel Job Order"
            variant="destructive"
            onPress={() => {
              setPendingStatus('CANCELLED');
              setTransitionNotes('');
            }}
          />
        ) : null}
        <Button
          title="View Job Audit History"
          variant="ghost"
          onPress={() => router.push(`/(app)/jobs/${id}/history`)}
        />
      </View>

      {/* Status Transition Modal */}
      <Modal visible={!!pendingStatus} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Job Status</Text>
            <Text style={styles.modalDesc}>
              Advance to{' '}
              <Text style={styles.bold}>
                {pendingStatus?.replace(/_/g, ' ')}
              </Text>
            </Text>

            <Input
              label="Transition Notes (optional)"
              placeholder="e.g. Baking complete, ready for testing"
              multiline
              numberOfLines={3}
              value={transitionNotes}
              onChangeText={setTransitionNotes}
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setPendingStatus(null)}
              />
              <Button
                title="Confirm & Save"
                loading={updateStatusMutation.isPending}
                onPress={onConfirmTransition}
              />
            </View>
          </View>
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
    marginBottom: Spacing.lg,
  },
  headerMain: {
    flex: 1,
    marginRight: Spacing.md,
  },
  num: {
    ...Typography.title,
    color: Colors.light.text,
  },
  created: {
    ...Typography.caption,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  motorCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardPressed: {
    backgroundColor: Colors.light.secondary,
  },
  motorTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  linkText: {
    ...Typography.caption,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  motorNumber: {
    ...Typography.headline,
    color: Colors.light.text,
  },
  customer: {
    ...Typography.subhead,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  notesBox: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: 4,
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
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.headline,
    fontSize: 14,
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  emptyText: {
    ...Typography.subhead,
    color: Colors.light.textMuted,
    marginVertical: Spacing.xs,
  },
  group: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  taskAssignee: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  transitionSection: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  footerActions: {
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  modalTitle: {
    ...Typography.title,
    color: Colors.light.text,
  },
  modalDesc: {
    ...Typography.subhead,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  bold: {
    fontWeight: '700',
    color: Colors.light.text,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
});
