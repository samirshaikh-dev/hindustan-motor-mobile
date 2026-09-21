import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { parseApiError } from '@/api/errors';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { queryKeys } from '@/config/queryKeys';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { employeeService } from '@/services/employee.service';
import { jobService } from '@/services/job.service';
import { useAuthStore } from '@/store/useAuthStore';

export default function AddTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isOwner = useAuthStore((s) => s.activeActorRole === 'OWNER');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const employeesQuery = useQuery({
    queryKey: queryKeys.employees.list({ isActive: true }),
    queryFn: () => employeeService.list({ isActive: true, limit: 100 }),
    enabled: isOwner,
  });

  const submit = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a task title');
      return;
    }
    setLoading(true);
    try {
      await jobService.createTask(id!, {
        title: title.trim(),
        description: description.trim() || undefined,
        assignedEmployeeId: assigneeId,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      Alert.alert('Could not create task', parseApiError(e).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <Input
        label="Task Title"
        placeholder="e.g. Coil Winding, Bearing Replacement, Varnishing"
        value={title}
        onChangeText={setTitle}
      />
      <Input
        label="Instructions / Description (optional)"
        multiline
        numberOfLines={3}
        placeholder="Specific instructions for the technician"
        value={description}
        onChangeText={setDescription}
      />

      {isOwner ? (
        <>
          <Text style={styles.label}>Assign to Technician (Owner Only)</Text>
          <View style={styles.group}>
            {(employeesQuery.data?.employees ?? []).map((emp, index) => {
              const selected = assigneeId === emp.id;
              return (
                <Pressable
                  key={emp.id}
                  style={({ pressed }) => [
                    styles.empRow,
                    index > 0 && styles.rowBorder,
                    selected && styles.empRowSelected,
                    pressed && styles.rowPressed,
                  ]}
                  onPress={() => setAssigneeId(selected ? undefined : emp.id)}>
                  <Text style={[styles.empName, selected && styles.empNameSelected]}>
                    {emp.name}
                  </Text>
                  <Text style={styles.empPhone}>{emp.phone}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      <View style={styles.submitRow}>
        <Button title="Create Task" loading={loading} onPress={submit} />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  label: {
    ...Typography.subhead,
    color: Colors.light.textSecondary,
    fontWeight: '500',
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  group: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
    marginBottom: Spacing.md,
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
    opacity: 0.8,
  },
  empName: {
    ...Typography.headline,
    fontSize: 14,
    color: Colors.light.text,
  },
  empNameSelected: {
    fontWeight: '700',
  },
  empPhone: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  submitRow: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xxl,
  },
});
