import * as Haptics from 'expo-haptics';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { parseApiError } from '@/api/errors';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useMotorDetail, useUpdateMotor } from '@/hooks/useMotors';
import { useAuthStore } from '@/store/useAuthStore';
import type { RegisterMotorPayload } from '@/services/motor.service';
import type { Motor } from '@/types/domain';

function EditMotorForm({
  motor,
  isPending,
  onSave,
}: {
  motor: Motor;
  isPending: boolean;
  onSave: (values: Partial<RegisterMotorPayload>) => Promise<void>;
}) {
  const [brand, setBrand] = useState(motor.brand ?? '');
  const [motorType, setMotorType] = useState(motor.motorType ?? '');
  const [power, setPower] = useState(motor.power ? String(motor.power) : '');
  const [powerUnit, setPowerUnit] = useState<'HP' | 'kW'>((motor.powerUnit as 'HP' | 'kW') || 'HP');
  const [rpm, setRpm] = useState(motor.rpm ? String(motor.rpm) : '');
  const [phase, setPhase] = useState<'Single' | 'Three'>((motor.phase as 'Single' | 'Three') || 'Three');
  const [serialNumber, setSerialNumber] = useState(motor.serialNumber ?? '');
  const [complaint, setComplaint] = useState(motor.complaint ?? '');
  const [notes, setNotes] = useState(motor.notes ?? '');

  const handleSave = () => {
    onSave({
      brand: brand.trim() || undefined,
      motorType: motorType.trim() || undefined,
      power: power ? Number(power) : undefined,
      powerUnit,
      rpm: rpm ? Number(rpm) : undefined,
      phase,
      serialNumber: serialNumber.trim() || undefined,
      complaint: complaint.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <>
      <View style={styles.row}>
        <View style={styles.half}>
          <Input label="Brand" value={brand} onChangeText={setBrand} />
        </View>
        <View style={styles.half}>
          <Input label="Motor Type" value={motorType} onChangeText={setMotorType} />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.half}>
          <Input
            label={`Power (${powerUnit})`}
            keyboardType="numeric"
            value={power}
            onChangeText={setPower}
          />
        </View>
        <View style={styles.half}>
          <Text style={styles.segmentLabel}>Unit</Text>
          <View style={styles.segment}>
            {(['HP', 'kW'] as const).map((u) => (
              <Pressable
                key={u}
                style={[styles.segmentBtn, powerUnit === u && styles.segmentBtnActive]}
                onPress={() => setPowerUnit(u)}>
                <Text style={[styles.segmentText, powerUnit === u && styles.segmentTextActive]}>
                  {u}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.half}>
          <Input label="RPM" keyboardType="numeric" value={rpm} onChangeText={setRpm} />
        </View>
        <View style={styles.half}>
          <Text style={styles.segmentLabel}>Phase</Text>
          <View style={styles.segment}>
            {(['Single', 'Three'] as const).map((p) => (
              <Pressable
                key={p}
                style={[styles.segmentBtn, phase === p && styles.segmentBtnActive]}
                onPress={() => setPhase(p)}>
                <Text style={[styles.segmentText, phase === p && styles.segmentTextActive]}>
                  {p}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <Input label="Serial / Model No." value={serialNumber} onChangeText={setSerialNumber} />
      <Input label="Reported Complaint" multiline numberOfLines={3} value={complaint} onChangeText={setComplaint} />
      <Input label="Internal Notes" multiline numberOfLines={3} value={notes} onChangeText={setNotes} />

      <View style={styles.submitRow}>
        <Button title="Save Changes" loading={isPending} onPress={handleSave} />
      </View>
    </>
  );
}

export default function EditMotorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isOwner = useAuthStore((s) => s.activeActorRole === 'OWNER');
  const { data, isLoading } = useMotorDetail(id!);
  const updateMutation = useUpdateMotor(id!);

  if (!isOwner) {
    return <Redirect href="/(app)/employee" />;
  }

  const save = async (values: Partial<RegisterMotorPayload>) => {
    try {
      await updateMutation.mutateAsync(values);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      Alert.alert('Update failed', parseApiError(e).message);
    }
  };

  if (isLoading || !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.light.textSecondary} size="small" />
      </View>
    );
  }

  return (
    <ScreenWrapper>
      <EditMotorForm motor={data} isPending={updateMutation.isPending} onSave={save} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', gap: Spacing.md },
  half: { flex: 1 },
  segmentLabel: {
    ...Typography.subhead,
    fontWeight: '500',
    color: Colors.light.textSecondary,
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
  submitRow: { marginTop: Spacing.lg, marginBottom: Spacing.xxl },
});
