import * as Haptics from 'expo-haptics';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { parseApiError } from '@/api/errors';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useCreateJob } from '@/hooks/useJobs';
import { useMotorDetail } from '@/hooks/useMotors';
import { useAuthStore } from '@/store/useAuthStore';

export default function CreateJobScreen() {
  const isOwner = useAuthStore((s) => s.activeActorRole === 'OWNER');
  const { motorId } = useLocalSearchParams<{ motorId: string }>();
  const [notes, setNotes] = useState('');

  const motorQuery = useMotorDetail(motorId || '');
  const createJobMutation = useCreateJob();

  if (!isOwner) {
    return <Redirect href="/(app)/employee" />;
  }

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
      router.replace(`/(app)/shared/job/${job.id}`);
    } catch (e) {
      Alert.alert('Could not create job', parseApiError(e).message);
    }
  };

  return (
    <ScreenWrapper contentContainerStyle={styles.container}>
      <View style={styles.contentWrapper}>
        <View style={styles.topSection}>
          {motorQuery.data ? (
            <View style={styles.motorCard}>
              <Text style={styles.cardLabel}>Target Motor</Text>
              <Text style={styles.motorNumber}>{motorQuery.data.motorNumber}</Text>
              <Text style={styles.customerName}>{motorQuery.data.customerName}</Text>
              <Text style={styles.customerPhone}>{motorQuery.data.customerPhone}</Text>
            </View>
          ) : null}

          <View style={styles.formCard}>
            <Input
              label="Job Instructions & Notes (optional)"
              multiline
              numberOfLines={4}
              placeholder="e.g. Rewind coil, overhaul bearings, test under load"
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </View>

        <View style={styles.submitRow}>
          <Button
            title="Create Job Order"
            loading={createJobMutation.isPending}
            onPress={onSubmit}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingVertical: Spacing.xl,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    gap: Spacing.xl,
  },
  topSection: {
    gap: Spacing.md,
  },
  motorCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.lg,
    gap: 2,
  },
  cardLabel: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  motorNumber: {
    ...Typography.headline,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 2,
  },
  customerName: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.light.text,
    marginTop: 1,
  },
  customerPhone: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  formCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.lg,
  },
  submitRow: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
});
