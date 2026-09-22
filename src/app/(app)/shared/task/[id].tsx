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

  const linkedJob = data.job;
  const linkedMotor = linkedJob?.motor;

  return (
    <ScreenWrapper refreshing={isRefetching} onRefresh={() => refetch()}>
      <View style={styles.contentWrapper}>
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <Text style={styles.title}>{data.title}</Text>
            <StatusBadge status={data.status} />
          </View>
        </View>

        <Text style={styles.sectionLabel}>Technician Assignment</Text>
        <View style={styles.card}>
          <View style={styles.assignRow}>
            <View style={styles.assignInfo}>
              <Text style={styles.assignLabel}>Assigned Technician</Text>
              <Text style={styles.assignName}>
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

        {data.description ? (
          <>
            <Text style={styles.sectionLabel}>Instructions & Scope</Text>
            <View style={styles.card}>
              <Text style={styles.descText}>{data.description}</Text>
            </View>
          </>
        ) : null}

        {linkedJob ? (
          <>
            <Text style={styles.sectionLabel}>Linked Job Order</Text>
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => router.push(`/(app)/shared/job/${data.jobId}`)}>
              <View style={styles.jobTop}>
                <Text style={styles.jobNum}>{linkedJob.jobNumber}</Text>
                <Text style={styles.linkText}>View Job →</Text>
              </View>
              {linkedMotor ? (
                <Text style={styles.motorMeta}>
                  {linkedMotor.customerName} · {linkedMotor.motorNumber}
                </Text>
              ) : null}
            </Pressable>
            {linkedMotor ? (
              <Pressable
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={() => router.push(`/(app)/shared/motor/${linkedMotor.id}`)}>
                <View style={styles.jobTop}>
                  <Text style={styles.jobNum}>{linkedMotor.motorNumber}</Text>
                  <Text style={styles.linkText}>View Motor →</Text>
                </View>
                {linkedMotor.customerName ? (
                  <Text style={styles.motorMeta}>{linkedMotor.customerName}</Text>
                ) : null}
              </Pressable>
            ) : null}
          </>
        ) : null}

        <Text style={styles.sectionLabel}>Activity Timeline</Text>
        <View style={styles.card}>
          <View style={styles.timeRow}>
            <Text style={styles.timeKey}>Created</Text>
            <Text style={styles.timeVal}>{formatDateTime(data.createdAt)}</Text>
          </View>
          {data.startedAt ? (
            <View style={[styles.timeRow, styles.rowBorder]}>
              <Text style={styles.timeKey}>Started</Text>
              <Text style={styles.timeVal}>{formatDateTime(data.startedAt)}</Text>
            </View>
          ) : null}
          {data.completedAt ? (
            <View style={[styles.timeRow, styles.rowBorder]}>
              <Text style={styles.timeKey}>Completed</Text>
              <Text style={styles.timeVal}>{formatDateTime(data.completedAt)}</Text>
            </View>
          ) : null}
        </View>

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

        <Modal visible={assignModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Assign Task</Text>
              <Text style={styles.modalSub}>Select a technician on the shop floor:</Text>

              <ScrollView style={styles.empList}>
                <View style={styles.empGroup}>
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
    marginBottom: Spacing.xs,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  title: {
    ...Typography.title,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    flex: 1,
  },
  sectionLabel: {
    ...Typography.headline,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  cardPressed: {
    opacity: 0.85,
  },
  assignRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assignInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  assignLabel: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  assignName: {
    ...Typography.headline,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 2,
  },
  phoneText: {
    ...Typography.subhead,
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  descText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  jobTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobNum: {
    ...Typography.headline,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  linkText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  motorMeta: {
    ...Typography.subhead,
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  timeKey: {
    ...Typography.subhead,
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  timeVal: {
    ...Typography.caption,
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: '500',
  },
  actionSection: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 440,
    maxHeight: '80%',
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
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  empList: {
    maxHeight: 280,
  },
  empGroup: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  empRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
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
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
});
