import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { parseApiError } from '@/api/errors';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { useCreateJob } from '@/hooks/useJobs';
import { useMotorDetail } from '@/hooks/useMotors';

export default function CreateJobScreen() {
  const { motorId } = useLocalSearchParams<{ motorId: string }>();
  const [notes, setNotes] = useState('');

  const motorQuery = useMotorDetail(motorId || '');
  const createJobMutation = useCreateJob();

  const onSubmit = async () => {
    if (!motorId) {
      Alert.alert('Error', 'Motor ID is required to create a job order.');
      return;
    }

    try {
      const job = await createJobMutation.mutateAsync({
        motorId,
        notes: notes.trim() || undefined,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/(app)/jobs/${job.id}`);
    } catch (e) {
      Alert.alert('Could not create job', parseApiError(e).message);
    }
  };

  return (
    <ScreenWrapper>
      <Text style={styles.title}>Create new job order</Text>

      {motorQuery.data ? (
        <View style={styles.motorCard}>
          <Text style={styles.motorNumber}>{motorQuery.data.motorNumber}</Text>
          <Text style={styles.customerName}>{motorQuery.data.customerName}</Text>
          <Text style={styles.customerPhone}>{motorQuery.data.customerPhone}</Text>
        </View>
      ) : null}

      <Input
        label="Job notes / Instructions (optional)"
        multiline
        placeholder="e.g. Rewind coil, overhaul bearings, test under load"
        value={notes}
        onChangeText={setNotes}
      />

      <Button
        title="Create Job"
        loading={createJobMutation.isPending}
        onPress={onSubmit}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '800', marginBottom: 16, color: '#0f172a' },
  motorCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 16,
  },
  motorNumber: { fontSize: 16, fontWeight: '700', color: '#0284c7' },
  customerName: { fontSize: 15, fontWeight: '600', color: '#1e293b', marginTop: 2 },
  customerPhone: { fontSize: 13, color: '#64748b', marginTop: 2 },
});
