import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { parseApiError } from '@/api/errors';
import { Button } from '@/components/common/Button';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { queryKeys } from '@/config/queryKeys';
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
    <ScreenWrapper>
      <Text style={styles.title}>Motor photo</Text>
      <Text style={styles.sub}>Capture damage before repair work begins.</Text>
      <Button title="Take photo" loading={loading} onPress={() => upload(true)} />
      <Button title="Choose from gallery" variant="secondary" loading={loading} onPress={() => upload(false)} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '800' },
  sub: { color: '#64748b', marginVertical: 12 },
});
