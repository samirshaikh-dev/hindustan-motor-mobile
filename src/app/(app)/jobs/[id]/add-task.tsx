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
      Alert.alert('Title required');
      return;
    }
    setLoading(true);
    try {
      await jobService.createTask(id!, {
        title: title.trim(),
        description: description || undefined,
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
      <Input label="Task title" value={title} onChangeText={setTitle} />
      <Input label="Description" multiline value={description} onChangeText={setDescription} />

      {isOwner ? (
        <>
          <Text style={styles.label}>Assign to (owner only)</Text>
          <View style={styles.list}>
            {(employeesQuery.data?.employees ?? []).map((emp) => (
              <Pressable
                key={emp.id}
                style={[styles.emp, assigneeId === emp.id && styles.empActive]}
                onPress={() => setAssigneeId(assigneeId === emp.id ? undefined : emp.id)}>
                <Text>{emp.name}</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      <Button title="Create task" loading={loading} onPress={submit} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: '600', marginBottom: 8 },
  list: { gap: 6, marginBottom: 16 },
  emp: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  empActive: { borderColor: '#0284c7', backgroundColor: '#e0f2fe' },
});
