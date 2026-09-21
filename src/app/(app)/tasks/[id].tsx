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

  return (
    <ScreenWrapper refreshing={isRefetching} onRefresh={() => refetch()}>
      <View style={styles.header}>
        <Text style={styles.title}>{data.title}</Text>
        <StatusBadge status={data.status} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Assigned Technician</Text>
        <Text style={styles.cardValue}>
          {data.assignedEmployee ? data.assignedEmployee.name : 'Unassigned'}
        </Text>
        {data.assignedEmployee?.phone ? (
          <Text style={styles.phoneText}>{data.assignedEmployee.phone}</Text>
        ) : null}

        {isOwner ? (
          <View style={styles.assignBtnRow}>
            <Button
              title={data.assignedEmployee ? 'Reassign Staff' : 'Assign to Staff'}
              variant="secondary"
              onPress={() => setAssignModalVisible(true)}
            />
          </View>
        ) : null}
      </View>

      {data.description ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Instructions / Description</Text>
          <Text style={styles.desc}>{data.description}</Text>
        </View>
      ) : null}

      {data.job ? (
        <Pressable
          style={styles.jobCard}
          onPress={() => router.push(`/(app)/jobs/${data.jobId}`)}>
          <View style={styles.jobHeader}>
            <Text style={styles.cardLabel}>Linked Job</Text>
            <Text style={styles.linkText}>View Job Details →</Text>
          </View>
          <Text style={styles.jobNum}>{data.job.jobNumber}</Text>
          {data.job.motor ? (
            <Text style={styles.motorMeta}>
              {data.job.motor.customerName} · {data.job.motor.motorNumber}
            </Text>
          ) : null}
        </Pressable>
      ) : null}

      <View style={styles.timelineBox}>
        <Text style={styles.timeMeta}>Created: {formatDateTime(data.createdAt)}</Text>
        {data.startedAt ? (
          <Text style={styles.timeMeta}>Started: {formatDateTime(data.startedAt)}</Text>
        ) : null}
        {data.completedAt ? (
          <Text style={styles.timeMeta}>Completed: {formatDateTime(data.completedAt)}</Text>
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
            variant="danger"
            loading={updateStatusMutation.isPending}
            onPress={() => setStatus('CANCELLED')}
          />
        ) : null}
      </View>

      {/* Owner Employee Selection Modal */}
      <Modal visible={assignModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Task to Staff</Text>
            <Text style={styles.modalSub}>Select a technician on the shop floor:</Text>

            <ScrollView style={styles.empList}>
              {(employeesQuery.data?.employees ?? []).map((emp) => (
                <Pressable
                  key={emp.id}
                  style={[
                    styles.empRow,
                    data.assignedEmployeeId === emp.id && styles.empRowSelected,
                  ]}
                  onPress={() => handleAssign(emp.id)}>
                  <View>
                    <Text style={styles.empName}>{emp.name}</Text>
                    <Text style={styles.empPhone}>{emp.phone}</Text>
                  </View>
                  <StatusBadge status={emp.role} />
                </Pressable>
              ))}
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a', flex: 1, marginRight: 8 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 12,
  },
  cardLabel: { fontSize: 12, color: '#64748b', fontWeight: '700', textTransform: 'uppercase' },
  cardValue: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginTop: 4 },
  phoneText: { color: '#64748b', fontSize: 13, marginTop: 2 },
  assignBtnRow: { marginTop: 10 },
  desc: { color: '#1e293b', fontSize: 14, lineHeight: 22, marginTop: 4 },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 12,
  },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  linkText: { color: '#0284c7', fontSize: 13, fontWeight: '600' },
  jobNum: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginTop: 4 },
  motorMeta: { color: '#64748b', fontSize: 13, marginTop: 2 },
  timelineBox: { paddingVertical: 8, gap: 4 },
  timeMeta: { color: '#94a3b8', fontSize: 12 },
  actionSection: { marginTop: 16, gap: 10, marginBottom: 20 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  modalSub: { color: '#64748b', fontSize: 13, marginTop: 4, marginBottom: 12 },
  empList: { marginBottom: 16 },
  empRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  empRowSelected: {
    borderColor: '#0284c7',
    backgroundColor: '#f0f9ff',
  },
  empName: { fontWeight: '700', fontSize: 15, color: '#0f172a' },
  empPhone: { color: '#64748b', fontSize: 12, marginTop: 2 },
});
