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
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
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
      Alert.alert('Registration failed', parseApiError(e).message);
    }
  });

  return (
    <ScreenWrapper>
      <Controller
        control={control}
        name="customerName"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Customer Name"
            placeholder="e.g. Ramesh Patel"
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
            label="Customer Phone"
            placeholder="e.g. 9825012345"
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
              <Input
                label="Brand"
                placeholder="e.g. Crompton"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
        </View>
        <View style={styles.half}>
          <Controller
            control={control}
            name="motorType"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Motor Type"
                placeholder="e.g. Induction"
                value={value}
                onChangeText={onChange}
              />
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
                placeholder="e.g. 5"
                keyboardType="numeric"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
        </View>
        <View style={styles.half}>
          <Text style={styles.segmentLabel}>Unit</Text>
          <View style={styles.segment}>
            {(['HP', 'kW'] as const).map((unit) => (
              <Pressable
                key={unit}
                style={[styles.segmentBtn, powerUnit === unit && styles.segmentBtnActive]}
                onPress={() => setPowerUnit(unit)}>
                <Text
                  style={[
                    styles.segmentText,
                    powerUnit === unit && styles.segmentTextActive,
                  ]}>
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
              <Input
                label="RPM"
                placeholder="1440 / 2880"
                keyboardType="numeric"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
        </View>
        <View style={styles.half}>
          <Text style={styles.segmentLabel}>Phase</Text>
          <View style={styles.segment}>
            {(['Single', 'Three'] as const).map((p) => (
              <Pressable
                key={p}
                style={[styles.segmentBtn, phase === p && styles.segmentBtnActive]}
                onPress={() => setPhase(p)}>
                <Text
                  style={[
                    styles.segmentText,
                    phase === p && styles.segmentTextActive,
                  ]}>
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
          <Input
            label="Serial / Model No. (optional)"
            placeholder="e.g. MTR-2024-001"
            value={value}
            onChangeText={onChange}
          />
        )}
      />

      <Controller
        control={control}
        name="expectedDeliveryDays"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Expected Delivery (days from today)"
            placeholder="3"
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
            label="Problem Description / Complaint"
            multiline
            numberOfLines={3}
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
          <Input
            label="Internal Notes (optional)"
            multiline
            placeholder="e.g. Customer requested quick turnaround"
            value={value}
            onChangeText={onChange}
          />
        )}
      />

      <View style={styles.submitRow}>
        <Button
          title="Register & Create Job"
          loading={isSubmitting}
          onPress={onSubmit}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  half: {
    flex: 1,
  },
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
  segmentBtnActive: {
    backgroundColor: Colors.light.surface,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  segmentTextActive: {
    fontWeight: '600',
    color: Colors.light.text,
  },
  submitRow: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
});
