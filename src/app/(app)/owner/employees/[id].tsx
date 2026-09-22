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
import { EmptyState } from '@/components/feedback/EmptyState';
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
      <ScreenWrapper>
        <View style={styles.centerBox}>
          <ActivityIndicator color={Colors.light.textSecondary} size="small" />
        </View>
      </ScreenWrapper>
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
      <View style={styles.contentWrapper}>
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarText}>{emp.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.heroMain}>
              <Text style={styles.name}>{emp.name}</Text>
              <Text style={styles.phone}>{emp.phone}</Text>
            </View>
            <StatusBadge status={emp.role} />
          </View>

          <View style={styles.rosterRow}>
            <Text style={styles.rosterLabel}>Roster Status</Text>
            <StatusBadge status={emp.isActive ? 'IN_PROGRESS' : 'CANCELLED'} />
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

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            Assigned Tasks ({tasksQuery.data?.tasks?.length ?? 0})
          </Text>
        </View>

        {tasksQuery.isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Colors.light.textSecondary} size="small" />
          </View>
        ) : (tasksQuery.data?.tasks ?? []).length === 0 ? (
          <EmptyState
            icon="📋"
            title="No tasks assigned"
            description="This staff member has no active or pending tasks."
          />
        ) : (
          <View style={styles.cardGroup}>
            {(tasksQuery.data?.tasks ?? []).map((task, idx) => (
              <Pressable
                key={task.id}
                style={({ pressed }) => [
                  styles.taskRow,
                  idx > 0 && styles.rowBorder,
                  pressed && styles.rowPressed,
                ]}
                onPress={() => router.push(`/(app)/shared/task/${task.id}`)}>
                <View style={styles.taskContent}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  {task.job ? (
                    <Text style={styles.taskJob}>Job: {task.job.jobNumber}</Text>
                  ) : null}
                </View>
                <StatusBadge status={task.status} />
              </Pressable>
            ))}
          </View>
        )}

        <Modal visible={editModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Staff Member</Text>

              <Input label="Full Name" value={editName} onChangeText={setEditName} />
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
                  variant="ghost"
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
    gap: Spacing.md,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.title,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  heroMain: {
    flex: 1,
  },
  name: {
    ...Typography.title,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  phone: {
    ...Typography.subhead,
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  rosterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
    paddingTop: Spacing.sm,
  },
  rosterLabel: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  btnRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  half: {
    flex: 1,
  },
  toggleRow: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  sectionHeaderRow: {
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
  loadingBox: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
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
  taskContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  taskTitle: {
    ...Typography.headline,
    fontSize: 15,
    color: Colors.light.text,
  },
  taskJob: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
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
    maxWidth: 400,
    gap: Spacing.sm,
  },
  modalTitle: {
    ...Typography.title,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  sublabel: {
    ...Typography.subhead,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: Colors.light.backgroundSubtle,
    borderRadius: Radius.md,
    padding: 3,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  segmentBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  segmentBtnActive: {
    backgroundColor: Colors.light.surface,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  segmentTextActive: {
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
