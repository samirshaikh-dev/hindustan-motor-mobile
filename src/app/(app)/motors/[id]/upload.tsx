import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { parseApiError } from '@/api/errors';
import { Button } from '@/components/common/Button';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { queryKeys } from '@/config/queryKeys';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { mediaService } from '@/services/media.service';

export default function UploadMotorPhotoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const upload = async (fromCamera: boolean) => {
    setLoading(true);
    try {
      const uri = await mediaService.pickAndCompressImage(fromCamera);
      if (!uri) {
        setLoading(false);
        return;
      }
      await mediaService.uploadMotorImage(id!, uri);
      await queryClient.invalidateQueries({ queryKey: queryKeys.motors.detail(id!) });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      Alert.alert('Upload failed', parseApiError(e).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inspection Photo</Text>
        <Text style={styles.sub}>
          Document motor condition or burned coils before commencing rewinding work.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          title="Take Photo with Camera"
          loading={loading}
          onPress={() => upload(true)}
        />
        <Button
          title="Choose from Gallery"
          variant="secondary"
          disabled={loading}
          onPress={() => upload(false)}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.title,
    color: Colors.light.text,
  },
  sub: {
    ...Typography.subhead,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  actions: {
    gap: Spacing.md,
  },
});
