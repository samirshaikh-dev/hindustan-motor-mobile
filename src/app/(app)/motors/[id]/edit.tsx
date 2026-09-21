import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { parseApiError } from '@/api/errors';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { useMotorDetail, useUpdateMotor } from '@/hooks/useMotors';

export default function EditMotorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useMotorDetail(id!);
  const updateMutation = useUpdateMotor(id!);

  const [brand, setBrand] = useState('');
  const [motorType, setMotorType] = useState('');
  const [power, setPower] = useState('');
  const [powerUnit, setPowerUnit] = useState<'HP' | 'kW'>('HP');
  const [rpm, setRpm] = useState('');
  const [phase, setPhase] = useState<'Single' | 'Three'>('Three');
  const [serialNumber, setSerialNumber] = useState('');
  const [complaint, setComplaint] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (data) {
      setBrand(data.brand ?? '');
      setMotorType(data.motorType ?? '');
      setPower(data.power ? String(data.power) : '');
      setPowerUnit((data.powerUnit as 'HP' | 'kW') || 'HP');
      setRpm(data.rpm ? String(data.rpm) : '');
      setPhase((data.phase as 'Single' | 'Three') || 'Three');
      setSerialNumber(data.serialNumber ?? '');
      setComplaint(data.complaint ?? '');
      setNotes(data.notes ?? '');
    }
  }, [data]);

  const save = async () => {
    try {
      await updateMutation.mutateAsync({
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
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      Alert.alert('Update failed', parseApiError(e).message);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#0284c7" />
      </View>
    );
  }

  return (
    <ScreenWrapper>
      <Text style={styles.title}>Edit motor details</Text>

      <View style={styles.row}>
        <View style={styles.half}>
          <Input label="Brand" value={brand} onChangeText={setBrand} />
        </View>
        <View style={styles.half}>
          <Input label="Motor type" value={motorType} onChangeText={setMotorType} />
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
          <Text style={styles.sublabel}>Unit</Text>
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
          <Text style={styles.sublabel}>Phase</Text>
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
      <Input label="Complaint" multiline value={complaint} onChangeText={setComplaint} />
      <Input label="Internal notes" multiline value={notes} onChangeText={setNotes} />

      <Button title="Save changes" loading={updateMutation.isPending} onPress={save} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 16 },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  sublabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    padding: 3,
    height: 44,
    alignItems: 'center',
    marginBottom: 12,
  },
  segmentBtn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  segmentBtnActive: { backgroundColor: '#fff' },
  segmentText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  segmentTextActive: { color: '#0f172a' },
});
