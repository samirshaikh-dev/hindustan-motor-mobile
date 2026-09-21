import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { parseApiError } from '@/api/errors';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { motorService } from '@/services/motor.service';

const schema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().min(8, 'Enter a valid phone number'),
  brand: z.string().optional(),
  motorType: z.string().optional(),
  power: z.string().optional(),
  rpm: z.string().optional(),
  phase: z.string().optional(),
  serialNumber: z.string().optional(),
  complaint: z.string().optional(),
  notes: z.string().optional(),
  expectedDeliveryDays: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterMotorScreen() {
  const [powerUnit, setPowerUnit] = useState<'HP' | 'kW'>('HP');
  const [phase, setPhase] = useState<'Single' | 'Three'>('Three');

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName: '',
      customerPhone: '',
      brand: '',
      motorType: '',
      power: '',
      rpm: '',
      serialNumber: '',
      complaint: '',
      notes: '',
      expectedDeliveryDays: '3',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      let expectedDeliveryAt: string | undefined;
      if (values.expectedDeliveryDays && !isNaN(Number(values.expectedDeliveryDays))) {
        const d = new Date();
        d.setDate(d.getDate() + Number(values.expectedDeliveryDays));
        expectedDeliveryAt = d.toISOString();
      }

      const motor = await motorService.registerMotor({
        customerName: values.customerName.trim(),
        customerPhone: values.customerPhone.trim(),
        brand: values.brand?.trim() || undefined,
        motorType: values.motorType?.trim() || undefined,
        power: values.power ? Number(values.power) : undefined,
        powerUnit,
        rpm: values.rpm ? Number(values.rpm) : undefined,
        phase,
        serialNumber: values.serialNumber?.trim() || undefined,
        complaint: values.complaint?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
        expectedDeliveryAt,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/(app)/motors/${motor.id}`);
    } catch (e) {
      Alert.alert('Could not register', parseApiError(e).message);
    }
  });

  return (
    <ScreenWrapper>
      <Text style={styles.title}>New motor intake</Text>

      <Controller
        control={control}
        name="customerName"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Customer name"
            value={value}
            onChangeText={onChange}
            error={errors.customerName?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="customerPhone"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Customer phone"
            keyboardType="phone-pad"
            value={value}
            onChangeText={onChange}
            error={errors.customerPhone?.message}
          />
        )}
      />

      <View style={styles.row}>
        <View style={styles.half}>
          <Controller
            control={control}
            name="brand"
            render={({ field: { onChange, value } }) => (
              <Input label="Brand" placeholder="e.g. Crompton" value={value} onChangeText={onChange} />
            )}
          />
        </View>
        <View style={styles.half}>
          <Controller
            control={control}
            name="motorType"
            render={({ field: { onChange, value } }) => (
              <Input label="Motor type" placeholder="e.g. Induction" value={value} onChangeText={onChange} />
            )}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.half}>
          <Controller
            control={control}
            name="power"
            render={({ field: { onChange, value } }) => (
              <Input
                label={`Power (${powerUnit})`}
                keyboardType="numeric"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
        </View>
        <View style={styles.half}>
          <Text style={styles.sublabel}>Unit</Text>
          <View style={styles.segment}>
            {(['HP', 'kW'] as const).map((unit) => (
              <Pressable
                key={unit}
                style={[styles.segmentBtn, powerUnit === unit && styles.segmentBtnActive]}
                onPress={() => setPowerUnit(unit)}>
                <Text style={[styles.segmentText, powerUnit === unit && styles.segmentTextActive]}>
                  {unit}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.half}>
          <Controller
            control={control}
            name="rpm"
            render={({ field: { onChange, value } }) => (
              <Input label="RPM" placeholder="1440 / 2880" keyboardType="numeric" value={value} onChangeText={onChange} />
            )}
          />
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

      <Controller
        control={control}
        name="serialNumber"
        render={({ field: { onChange, value } }) => (
          <Input label="Serial / Model No. (optional)" value={value} onChangeText={onChange} />
        )}
      />

      <Controller
        control={control}
        name="expectedDeliveryDays"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Expected delivery (days from today)"
            keyboardType="numeric"
            value={value}
            onChangeText={onChange}
          />
        )}
      />

      <Controller
        control={control}
        name="complaint"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Complaint / Problem description"
            multiline
            placeholder="e.g. Burnt coil, smoke observed, bearing seized"
            value={value}
            onChangeText={onChange}
          />
        )}
      />

      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, value } }) => (
          <Input label="Internal notes (optional)" multiline value={value} onChangeText={onChange} />
        )}
      />

      <Button title="Register & create job" loading={isSubmitting} onPress={onSubmit} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', marginBottom: 16 },
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
  segmentBtnActive: {
    backgroundColor: '#fff',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  segmentTextActive: {
    color: '#0f172a',
  },
});
