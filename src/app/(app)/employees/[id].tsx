import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
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
import {
  useEmployeeDetail,
  useEmployeeTasks,
  useUpdateEmployee,
} from '@/hooks/useEmployees';
import { useAuthStore } from '@/store/useAuthStore';
import type { Role } from '@/types/domain';

export default function EmployeeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isOwner = useAuthStore((s) => s.activeActorRole === 'OWNER');

  const employeeQuery = useEmployeeDetail(id!);
  const tasksQuery = useEmployeeTasks(id!);
  const updateMutation = useUpdateEmployee(id!);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<Role>('EMPLOYEE');
  const [editIsActive, setEditIsActive] = useState(true);

  const openEditModal = () => {
    if (employeeQuery.data) {
      setEditName(employeeQuery.data.name);
      setEditPhone(employeeQuery.data.phone);
      setEditRole(employeeQuery.data.role);
      setEditIsActive(employeeQuery.data.isActive);
      setEditModalVisible(true);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await updateMutation.mutateAsync({
        name: editName.trim(),
        phone: editPhone.trim(),
        role: editRole,
        isActive: editIsActive,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditModalVisible(false);
    } catch (e) {
      Alert.alert('Update failed', parseApiError(e).message);
    }
  };

  const toggleActiveStatus = async () => {
    if (!employeeQuery.data) return;
    const newStatus = !employeeQuery.data.isActive;
    try {
      await updateMutation.mutateAsync({ isActive: newStatus });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert('Status change failed', parseApiError(e).message);
    }
  };

  if (employeeQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#0284c7" size="large" />
      </View>
    );
  }

  if (employeeQuery.error || !employeeQuery.data) {
    return (
      <ScreenWrapper>
        <ErrorBanner
          message={parseApiError(employeeQuery.error).message}
          onRetry={() => employeeQuery.refetch()}
        />
      </ScreenWrapper>
    );
  }

  const emp = employeeQuery.data;

  return (
    <ScreenWrapper
      refreshing={tasksQuery.isRefetching}
      onRefresh={() => {
        employeeQuery.refetch();
        tasksQuery.refetch();
      }}>
      <View style={styles.header}>
        <View>
          <Text style={styles.name}>{emp.name}</Text>
          <Text style={styles.phone}>{emp.phone}</Text>
        </View>
        <StatusBadge status={emp.role} />
      </View>

      <View style={styles.statusBanner}>
        <Text style={styles.statusText}>
          Account Status: {emp.isActive ? 'Active (Can receive tasks)' : 'Deactivated'}
        </Text>
      </View>

      <View style={styles.btnRow}>
        <Button
          title="Call staff"
          variant="secondary"
          onPress={() => Linking.openURL(`tel:${emp.phone}`)}
        />
        {isOwner ? (
          <Button title="Edit details" variant="secondary" onPress={openEditModal} />
        ) : null}
      </View>

      {isOwner ? (
        <View style={styles.toggleRow}>
          <Button
            title={emp.isActive ? 'Deactivate staff member' : 'Activate staff member'}
            variant={emp.isActive ? 'danger' : 'secondary'}
            loading={updateMutation.isPending}
            onPress={toggleActiveStatus}
          />
        </View>
      ) : null}

      <Text style={styles.section}>Assigned Tasks ({tasksQuery.data?.tasks?.length ?? 0})</Text>

      {tasksQuery.isLoading ? (
        <ActivityIndicator color="#0284c7" style={{ marginTop: 12 }} />
      ) : (tasksQuery.data?.tasks ?? []).length === 0 ? (
        <Text style={styles.empty}>No tasks assigned to this employee.</Text>
      ) : (
        <View style={styles.taskList}>
          {(tasksQuery.data?.tasks ?? []).map((task) => (
            <Pressable
              key={task.id}
              style={styles.task}
              onPress={() => router.push(`/(app)/tasks/${task.id}`)}>
              <View style={styles.taskContent}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                {task.job ? (
                  <Text style={styles.taskJob}>Job {task.job.jobNumber}</Text>
                ) : null}
              </View>
              <StatusBadge status={task.status} />
            </Pressable>
          ))}
        </View>
      )}

      {/* Edit Employee Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Staff Member</Text>

            <Input label="Name" value={editName} onChangeText={setEditName} />
            <Input
              label="Phone"
              keyboardType="phone-pad"
              value={editPhone}
              onChangeText={setEditPhone}
            />

            <Text style={styles.sublabel}>Role</Text>
            <View style={styles.segment}>
              {(['EMPLOYEE', 'OWNER'] as const).map((r) => (
                <Pressable
                  key={r}
                  style={[styles.segmentBtn, editRole === r && styles.segmentBtnActive]}
                  onPress={() => setEditRole(r)}>
                  <Text
                    style={[
                      styles.segmentText,
                      editRole === r && styles.segmentTextActive,
                    ]}>
                    {r}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setEditModalVisible(false)}
              />
              <Button
                title="Save Changes"
                loading={updateMutation.isPending}
                onPress={handleSaveEdit}
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
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  name: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  phone: { color: '#64748b', marginTop: 4, fontSize: 14 },
  statusBanner: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginVertical: 10,
  },
  statusText: { fontSize: 13, color: '#334155', fontWeight: '600' },
  btnRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  toggleRow: { marginBottom: 16 },
  section: { fontWeight: '700', fontSize: 17, marginTop: 14, marginBottom: 8, color: '#0f172a' },
  taskList: { gap: 8, marginBottom: 20 },
  task: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  taskContent: { flex: 1, marginRight: 8 },
  taskTitle: { fontWeight: '600', fontSize: 15, color: '#0f172a' },
  taskJob: { color: '#64748b', fontSize: 12, marginTop: 2 },
  empty: { color: '#64748b', fontSize: 14, marginVertical: 8 },
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
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 14 },
  sublabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    padding: 3,
    height: 40,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentBtnActive: { backgroundColor: '#fff' },
  segmentText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  segmentTextActive: { color: '#0f172a' },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 10 },
});
