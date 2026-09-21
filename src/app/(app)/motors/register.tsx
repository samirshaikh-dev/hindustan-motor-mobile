import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { z } from 'zod';

import { parseApiError } from '@/api/errors';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { queryKeys } from '@/config/queryKeys';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { mediaService } from '@/services/media.service';
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
  const queryClient = useQueryClient();
  const [powerUnit, setPowerUnit] = useState<'HP' | 'kW'>('HP');
  const [phase, setPhase] = useState<'Single' | 'Three'>('Three');

  // Photo upload states
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

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

  const handlePickImage = async (fromCamera: boolean) => {
    try {
      setIsPickingImage(true);
      const uri = await mediaService.pickAndCompressImage(fromCamera);
      if (uri) {
        setSelectedImages((prev) => [...prev, uri]);
      }
    } catch (e) {
      const err = parseApiError(e);
      Alert.alert('Photo Selection', err.message || 'Could not select photo.');
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setSelectedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

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

      // Upload selected photos if any
      if (selectedImages.length > 0) {
        setUploadProgress(`Uploading photos (1/${selectedImages.length})...`);
        for (let i = 0; i < selectedImages.length; i++) {
          setUploadProgress(`Uploading photo ${i + 1} of ${selectedImages.length}...`);
          try {
            await mediaService.uploadMotorImage(motor.id, selectedImages[i]);
          } catch {
            // Keep going if a photo fails so the motor remains registered
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.motors.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/(app)/motors/${motor.id}`);
    } catch (e) {
      Alert.alert('Registration failed', parseApiError(e).message);
    } finally {
      setUploadProgress(null);
    }
  });

  return (
    <ScreenWrapper>
      <View style={styles.contentWrapper}>
        <Text style={styles.sectionHeader}>Customer Details</Text>
        <View style={styles.card}>
          <Controller
            control={control}
            name="customerName"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Customer Name *"
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
                label="Customer Phone *"
                placeholder="e.g. 9825012345"
                keyboardType="phone-pad"
                value={value}
                onChangeText={onChange}
                error={errors.customerPhone?.message}
              />
            )}
          />
        </View>

        <Text style={styles.sectionHeader}>Motor Specifications</Text>
        <View style={styles.card}>
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
                    label="Speed (RPM)"
                    placeholder="1440 / 2880"
                    keyboardType="numeric"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.segmentLabel}>Supply Phase</Text>
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
                label="Serial Number (optional)"
                placeholder="From motor nameplate"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
        </View>

        <Text style={styles.sectionHeader}>Service Details & Timeline</Text>
        <View style={styles.card}>
          <Controller
            control={control}
            name="complaint"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Customer Reported Problem"
                placeholder="e.g. Burnt smell, bearing jam, humming"
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
                label="Expected Delivery (in days)"
                placeholder="3"
                keyboardType="numeric"
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
                label="Internal Workshop Notes (optional)"
                placeholder="Condition on arrival, urgent priority, etc."
                value={value}
                onChangeText={onChange}
              />
            )}
          />
        </View>

        {/* MOTOR CONDITION PHOTOS */}
        <Text style={styles.sectionHeader}>Motor Condition Photos (Optional)</Text>
        <View style={styles.card}>
          <Text style={styles.photoHelpText}>
            Document the motor nameplate, burnt coils, or physical condition upon arrival.
          </Text>

          {selectedImages.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailList}
              style={styles.thumbnailScroll}>
              {selectedImages.map((uri, index) => (
                <View key={uri + index} style={styles.thumbnailWrapper}>
                  <Image source={{ uri }} style={styles.thumbnailImage} contentFit="cover" />
                  <Pressable
                    hitSlop={8}
                    style={styles.removeImageBtn}
                    onPress={() => handleRemoveImage(index)}
                    accessibilityLabel="Remove photo">
                    <Ionicons name="close-circle" size={22} color={Colors.light.destructive} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          ) : null}

          <View style={styles.photoActionsRow}>
            <Pressable
              style={styles.photoActionBtn}
              disabled={isPickingImage}
              onPress={() => handlePickImage(true)}>
              <Ionicons name="camera-outline" size={18} color={Colors.light.primary} />
              <Text style={styles.photoActionText}>Take Photo</Text>
            </Pressable>

            <Pressable
              style={[styles.photoActionBtn, styles.photoActionBtnSecondary]}
              disabled={isPickingImage}
              onPress={() => handlePickImage(false)}>
              <Ionicons name="images-outline" size={18} color={Colors.light.primary} />
              <Text style={styles.photoActionText}>Gallery</Text>
            </Pressable>
          </View>

          {isPickingImage ? (
            <View style={styles.pickingIndicator}>
              <ActivityIndicator size="small" color={Colors.light.textSecondary} />
              <Text style={styles.pickingText}>Compressing image...</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.submitRow}>
          <Button
            title={uploadProgress || 'Register Motor'}
            loading={isSubmitting || Boolean(uploadProgress)}
            onPress={onSubmit}
          />
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
  sectionHeader: {
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
    height: 44,
    backgroundColor: Colors.light.backgroundSubtle,
    borderRadius: Radius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  segmentBtn: {
    flex: 1,
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
    fontWeight: '700',
    color: Colors.light.text,
  },
  // Photo styles
  photoHelpText: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  thumbnailScroll: {
    marginBottom: Spacing.md,
    maxHeight: 90,
  },
  thumbnailList: {
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  thumbnailWrapper: {
    position: 'relative',
    width: 76,
    height: 76,
  },
  thumbnailImage: {
    width: 76,
    height: 76,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.full,
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  photoActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.backgroundSubtle,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  photoActionBtnSecondary: {
    backgroundColor: Colors.light.surface,
  },
  photoActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  pickingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    justifyContent: 'center',
  },
  pickingText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  submitRow: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xxxl,
  },
});
