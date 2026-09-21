import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { parseApiError } from '@/api/errors';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
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
      {motorQuery.data ? (
        <View style={styles.motorCard}>
          <Text style={styles.cardLabel}>Target Motor</Text>
          <Text style={styles.motorNumber}>{motorQuery.data.motorNumber}</Text>
          <Text style={styles.customerName}>{motorQuery.data.customerName}</Text>
          <Text style={styles.customerPhone}>{motorQuery.data.customerPhone}</Text>
        </View>
      ) : null}

      <Input
        label="Job Instructions & Notes (optional)"
        multiline
        numberOfLines={3}
        placeholder="e.g. Rewind coil, overhaul bearings, test under load"
        value={notes}
        onChangeText={setNotes}
      />

      <View style={styles.submitRow}>
        <Button
          title="Create Job Order"
          loading={createJobMutation.isPending}
          onPress={onSubmit}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  motorCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  cardLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  motorNumber: {
    ...Typography.headline,
    color: Colors.light.text,
  },
  customerName: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  customerPhone: {
    ...Typography.caption,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  submitRow: {
    marginTop: Spacing.md,
  },
});
