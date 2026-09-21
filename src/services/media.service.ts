import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { apiClient } from '@/api/client';
import type { ApiResponse } from '@/types/api';
import type { MotorImage } from '@/types/domain';

export const mediaService = {
  async pickAndCompressImage(fromCamera = false): Promise<string | null> {
    const permissionResult = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      throw new Error('Camera / photo library permission is required.');
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({
          quality: 0.8,
          mediaTypes: ['images'],
        });

    if (result.canceled || !result.assets[0]) {
      return null;
    }

    const manipulated = await ImageManipulator.manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: 1600 } }],
      { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG },
    );

    return manipulated.uri;
  },

  async uploadMotorImage(motorId: string, imageUri: string): Promise<MotorImage> {
    const filename = imageUri.split('/').pop() || 'motor_photo.jpg';

    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      name: filename,
      type: 'image/jpeg',
    } as unknown as Blob);

    const res = await apiClient.post<ApiResponse<MotorImage>>(`/motors/${motorId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return res.data.data;
  },
};
