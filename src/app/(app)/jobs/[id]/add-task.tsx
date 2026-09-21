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
      <View style={styles.contentWrapper}>
        <Text style={styles.sectionTitle}>Task Information</Text>
        <View style={styles.card}>
          <Input
            label="Task Title *"
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
        </View>

        {isOwner ? (
          <>
            <Text style={styles.sectionTitle}>Assign to Technician (Owner Only)</Text>
            <View style={styles.cardGroup}>
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
                    <View style={styles.empInfo}>
                      <Text style={[styles.empName, selected && styles.empNameSelected]}>
                        {emp.name}
                      </Text>
                      <Text style={styles.empPhone}>{emp.phone}</Text>
                    </View>
                    <View
                      style={[
                        styles.radioCircle,
                        selected && styles.radioCircleSelected,
                      ]}>
                      {selected ? <View style={styles.radioDot} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        <View style={styles.submitRow}>
          <Button title="Create Task" loading={loading} onPress={submit} />
        </View>
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
  sectionTitle: {
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
  cardGroup: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
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
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  empRowSelected: {
    backgroundColor: Colors.light.secondary,
  },
  rowPressed: {
    opacity: 0.85,
  },
  empInfo: {
    flex: 1,
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
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.primaryForeground,
  },
  submitRow: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xxxl,
  },
});
