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

  return (
    <ScreenWrapper refreshing={isRefetching} onRefresh={() => refetch()}>
      <View style={styles.header}>
        <View>
          <Text style={styles.num}>{data.jobNumber}</Text>
          <Text style={styles.created}>Created {formatDateTime(data.createdAt)}</Text>
        </View>
        <StatusBadge status={data.status} />
      </View>

      {data.motor ? (
        <Pressable
          style={styles.motorCard}
          onPress={() => router.push(`/(app)/motors/${data.motorId}`)}>
          <View style={styles.motorHeader}>
            <Text style={styles.motorLabel}>Linked Motor</Text>
            <Text style={styles.motorLink}>View Motor →</Text>
          </View>
          <Text style={styles.motorNumber}>{data.motor.motorNumber}</Text>
          <Text style={styles.customer}>{data.motor.customerName}</Text>
        </Pressable>
      ) : null}

      {data.notes ? (
        <View style={styles.notesCard}>
          <Text style={styles.notesLabel}>Job Notes</Text>
          <Text style={styles.notesText}>{data.notes}</Text>
        </View>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.section}>Tasks Workbench ({data.tasks?.length ?? 0})</Text>
        <Button
          title="Add Task"
          variant="secondary"
          onPress={() => router.push(`/(app)/jobs/${id}/add-task`)}
        />
      </View>

      {(data.tasks?.length ?? 0) === 0 ? (
        <Text style={styles.emptyText}>No tasks created under this job order yet.</Text>
      ) : (
        <View style={styles.taskList}>
          {data.tasks?.map((task) => (
            <Pressable
              key={task.id}
              style={styles.taskRow}
              onPress={() => router.push(`/(app)/tasks/${task.id}`)}>
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                {task.assignedEmployee ? (
                  <Text style={styles.taskAssignee}>
                    Assigned: {task.assignedEmployee.name}
                  </Text>
                ) : (
                  <Text style={styles.taskUnassigned}>Unassigned</Text>
                )}
              </View>
              <StatusBadge status={task.status} />
            </Pressable>
          ))}
        </View>
      )}

      {nextStatuses.length > 0 ? (
        <View style={styles.transitionSection}>
          <Text style={styles.section}>Advance Job Status</Text>
          <View style={styles.transitionButtons}>
            {nextStatuses.map((s) => (
              <Button
                key={s}
                title={s.replace(/_/g, ' ')}
                variant={s === 'CANCELLED' ? 'danger' : 'secondary'}
                onPress={() => {
                  setPendingStatus(s);
                  setTransitionNotes('');
                }}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.footerActions}>
        <Button
          title="View Job Audit History"
          variant="secondary"
          onPress={() => router.push(`/(app)/jobs/${id}/history`)}
        />
      </View>

      {/* Transition Modal with Notes */}
      <Modal visible={!!pendingStatus} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Job Status</Text>
            <Text style={styles.modalDesc}>
              Move status to <Text style={styles.bold}>{pendingStatus?.replace(/_/g, ' ')}</Text>
            </Text>

            <Input
              label="Transition Notes (optional)"
              placeholder="e.g. Coil winding complete; ready for varnish baking"
              multiline
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  num: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  created: { color: '#64748b', fontSize: 13, marginTop: 2 },
  motorCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 12,
  },
  motorHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  motorLabel: { fontSize: 12, color: '#64748b', fontWeight: '700', textTransform: 'uppercase' },
  motorLink: { fontSize: 13, color: '#0284c7', fontWeight: '600' },
  motorNumber: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginTop: 4 },
  customer: { fontSize: 14, color: '#475569', marginTop: 2 },
  notesCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 16,
  },
  notesLabel: { fontSize: 12, color: '#64748b', fontWeight: '700', marginBottom: 4 },
  notesText: { fontSize: 14, color: '#1e293b', lineHeight: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  section: { fontWeight: '700', fontSize: 17, color: '#0f172a' },
  emptyText: { color: '#94a3b8', fontSize: 14, marginVertical: 6 },
  taskList: { gap: 8, marginBottom: 16 },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  taskInfo: { flex: 1, marginRight: 8 },
  taskTitle: { fontWeight: '600', fontSize: 15, color: '#0f172a' },
  taskAssignee: { color: '#64748b', fontSize: 13, marginTop: 2 },
  taskUnassigned: { color: '#f59e0b', fontSize: 12, fontWeight: '600', marginTop: 2 },
  transitionSection: { marginTop: 16, marginBottom: 16 },
  transitionButtons: { gap: 8, marginTop: 8 },
  footerActions: { marginTop: 10, marginBottom: 20 },
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
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  modalDesc: { color: '#64748b', fontSize: 14, marginTop: 4, marginBottom: 14 },
  bold: { fontWeight: '700', color: '#0284c7' },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 14 },
});
