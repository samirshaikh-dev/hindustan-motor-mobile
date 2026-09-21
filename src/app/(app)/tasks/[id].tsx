import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
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
import { useEmployees } from '@/hooks/useEmployees';
import { useAssignTask, useTaskDetail, useUpdateTaskStatus } from '@/hooks/useTasks';
import { useAuthStore } from '@/store/useAuthStore';
import type { TaskStatus } from '@/types/domain';
import { formatDateTime } from '@/utils/formatters';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isOwner = useAuthStore((s) => s.activeActorRole === 'OWNER');

  const { data, isLoading, error, refetch, isRefetching } = useTaskDetail(id!);
  const updateStatusMutation = useUpdateTaskStatus(id!);
  const assignMutation = useAssignTask(id!);

  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const employeesQuery = useEmployees({ isActive: true, limit: 100 });

  const setStatus = async (status: TaskStatus) => {
    try {
      await updateStatusMutation.mutateAsync(status);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert('Update failed', parseApiError(e).message);
    }
  };

  const handleAssign = async (employeeId: string) => {
    try {
      await assignMutation.mutateAsync(employeeId);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAssignModalVisible(false);
    } catch (e) {
      Alert.alert('Assignment failed', parseApiError(e).message);
    }
  };

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

  return (
    <ScreenWrapper refreshing={isRefetching} onRefresh={() => refetch()}>
      <View style={styles.header}>
        <Text style={styles.title}>{data.title}</Text>
        <StatusBadge status={data.status} />
      </View>

      {/* Assigned Technician */}
      <View style={styles.group}>
        <View style={styles.groupRow}>
          <View style={styles.rowMain}>
            <Text style={styles.rowLabel}>Assigned Technician</Text>
            <Text style={styles.rowValue}>
              {data.assignedEmployee ? data.assignedEmployee.name : 'Unassigned'}
            </Text>
            {data.assignedEmployee?.phone ? (
              <Text style={styles.phoneText}>{data.assignedEmployee.phone}</Text>
            ) : null}
          </View>
          {isOwner ? (
            <Button
              title={data.assignedEmployee ? 'Reassign' : 'Assign'}
              variant="secondary"
              onPress={() => setAssignModalVisible(true)}
            />
          ) : null}
        </View>
      </View>

      {/* Instructions */}
      {data.description ? (
        <View style={styles.box}>
          <Text style={styles.boxLabel}>Instructions</Text>
          <Text style={styles.desc}>{data.description}</Text>
        </View>
      ) : null}

      {/* Linked Job */}
      {data.job ? (
        <Pressable
          style={({ pressed }) => [styles.box, pressed && styles.boxPressed]}
          onPress={() => router.push(`/(app)/jobs/${data.jobId}`)}>
          <View style={styles.boxHeader}>
            <Text style={styles.boxLabel}>Linked Job Order</Text>
            <Text style={styles.linkText}>View Job →</Text>
          </View>
          <Text style={styles.jobNum}>{data.job.jobNumber}</Text>
          {data.job.motor ? (
            <Text style={styles.motorMeta}>
              {data.job.motor.customerName} · {data.job.motor.motorNumber}
            </Text>
          ) : null}
        </Pressable>
      ) : null}

      {/* Timestamps */}
      <View style={styles.timelineBox}>
        <Text style={styles.timeMeta}>Created: {formatDateTime(data.createdAt)}</Text>
        {data.startedAt ? (
          <Text style={styles.timeMeta}>Started: {formatDateTime(data.startedAt)}</Text>
        ) : null}
        {data.completedAt ? (
          <Text style={styles.timeMeta}>Completed: {formatDateTime(data.completedAt)}</Text>
        ) : null}
      </View>

      {/* One primary call to action */}
      <View style={styles.actionSection}>
        {data.status === 'ASSIGNED' ? (
          <Button
            title="Start Work"
            loading={updateStatusMutation.isPending}
            onPress={() => setStatus('IN_PROGRESS')}
          />
        ) : null}

        {data.status === 'IN_PROGRESS' ? (
          <Button
            title="Mark Completed"
            loading={updateStatusMutation.isPending}
            onPress={() => setStatus('COMPLETED')}
          />
        ) : null}

        {isOwner && data.status !== 'COMPLETED' && data.status !== 'CANCELLED' ? (
          <Button
            title="Cancel Task"
            variant="destructive"
            loading={updateStatusMutation.isPending}
            onPress={() => setStatus('CANCELLED')}
          />
        ) : null}
      </View>

      {/* Staff Assignment Modal */}
      <Modal visible={assignModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Task</Text>
            <Text style={styles.modalSub}>Select a technician on the shop floor:</Text>

            <ScrollView style={styles.empList}>
              <View style={styles.group}>
                {(employeesQuery.data?.employees ?? []).map((emp, index) => {
                  const isSelected = data.assignedEmployeeId === emp.id;
                  return (
                    <Pressable
                      key={emp.id}
                      style={({ pressed }) => [
                        styles.empRow,
                        index > 0 && styles.rowBorder,
                        isSelected && styles.empRowSelected,
                        pressed && styles.rowPressed,
                      ]}
                      onPress={() => handleAssign(emp.id)}>
                      <View>
                        <Text style={styles.empName}>{emp.name}</Text>
                        <Text style={styles.empPhone}>{emp.phone}</Text>
                      </View>
                      <StatusBadge status={emp.role} />
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <Button
              title="Close"
              variant="secondary"
              onPress={() => setAssignModalVisible(false)}
            />
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
  title: {
    ...Typography.title,
    color: Colors.light.text,
    flex: 1,
    marginRight: Spacing.md,
  },
  group: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  groupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  rowMain: {
    flex: 1,
    marginRight: Spacing.md,
  },
  rowLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  rowValue: {
    ...Typography.headline,
    fontSize: 16,
    color: Colors.light.text,
    marginTop: 2,
  },
  phoneText: {
    ...Typography.caption,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  box: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  boxPressed: {
    backgroundColor: Colors.light.secondary,
  },
  boxLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  desc: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  boxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkText: {
    ...Typography.caption,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  jobNum: {
    ...Typography.headline,
    fontSize: 15,
    color: Colors.light.text,
    marginTop: 2,
  },
  motorMeta: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  timelineBox: {
    paddingVertical: Spacing.sm,
    gap: 4,
    marginBottom: Spacing.lg,
  },
  timeMeta: {
    ...Typography.caption,
    color: Colors.light.textMuted,
  },
  actionSection: {
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
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  modalTitle: {
    ...Typography.title,
    color: Colors.light.text,
  },
  modalSub: {
    ...Typography.subhead,
    color: Colors.light.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  empList: {
    marginBottom: Spacing.lg,
  },
  empRow: {
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
  empRowSelected: {
    backgroundColor: Colors.light.secondary,
  },
  rowPressed: {
    backgroundColor: Colors.light.secondary,
  },
  empName: {
    ...Typography.headline,
    fontSize: 14,
    color: Colors.light.text,
  },
  empPhone: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
});
