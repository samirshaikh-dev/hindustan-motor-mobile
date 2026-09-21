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
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
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
        <ActivityIndicator color={Colors.light.textSecondary} size="small" />
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
        <View style={styles.headerMain}>
          <Text style={styles.name}>{emp.name}</Text>
          <Text style={styles.phone}>{emp.phone}</Text>
        </View>
        <StatusBadge status={emp.role} />
      </View>

      <View style={styles.group}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Roster Status</Text>
          <Text style={styles.statusValue}>
            {emp.isActive ? 'Active' : 'Deactivated'}
          </Text>
        </View>
      </View>

      <View style={styles.btnRow}>
        <View style={styles.half}>
          <Button
            title="Call Staff"
            variant="secondary"
            onPress={() => Linking.openURL(`tel:${emp.phone}`)}
          />
        </View>
        {isOwner ? (
          <View style={styles.half}>
            <Button title="Edit Profile" variant="secondary" onPress={openEditModal} />
          </View>
        ) : null}
      </View>

      {isOwner ? (
        <View style={styles.toggleRow}>
          <Button
            title={emp.isActive ? 'Deactivate Staff Member' : 'Activate Staff Member'}
            variant={emp.isActive ? 'destructive' : 'secondary'}
            loading={updateMutation.isPending}
            onPress={toggleActiveStatus}
          />
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>
        Assigned Tasks ({tasksQuery.data?.tasks?.length ?? 0})
      </Text>

      {tasksQuery.isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Colors.light.textSecondary} size="small" />
        </View>
      ) : (tasksQuery.data?.tasks ?? []).length === 0 ? (
        <Text style={styles.empty}>No tasks assigned to this employee.</Text>
      ) : (
        <View style={styles.group}>
          {(tasksQuery.data?.tasks ?? []).map((task, idx) => (
            <Pressable
              key={task.id}
              style={({ pressed }) => [
                styles.taskRow,
                idx > 0 && styles.rowBorder,
                pressed && styles.rowPressed,
              ]}
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
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Staff Member</Text>

            <Input label="Name" value={editName} onChangeText={setEditName} />
            <Input
              label="Phone Number"
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
    marginBottom: Spacing.md,
  },
  headerMain: {
    flex: 1,
    marginRight: Spacing.md,
  },
  name: {
    ...Typography.title,
    color: Colors.light.text,
  },
  phone: {
    ...Typography.subhead,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  group: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  statusLabel: {
    ...Typography.subhead,
    color: Colors.light.textSecondary,
  },
  statusValue: {
    ...Typography.headline,
    fontSize: 14,
    color: Colors.light.text,
  },
  btnRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  half: {
    flex: 1,
  },
  toggleRow: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.headline,
    fontSize: 14,
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  loadingBox: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
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
  taskContent: { flex: 1, marginRight: Spacing.md },
  taskTitle: {
    ...Typography.headline,
    fontSize: 15,
    color: Colors.light.text,
  },
  taskJob: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  empty: {
    ...Typography.subhead,
    color: Colors.light.textMuted,
    marginVertical: Spacing.xs,
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
    marginBottom: Spacing.md,
  },
  sublabel: {
    ...Typography.subhead,
    color: Colors.light.textSecondary,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: Colors.light.secondary,
    borderRadius: Radius.md,
    padding: 2,
    height: 42,
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  segmentBtn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  segmentBtnActive: { backgroundColor: Colors.light.surface },
  segmentText: { fontSize: 13, fontWeight: '500', color: Colors.light.textSecondary },
  segmentTextActive: { fontWeight: '600', color: Colors.light.text },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
});
