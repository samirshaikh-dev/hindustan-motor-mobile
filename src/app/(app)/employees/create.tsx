import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { parseApiError } from '@/api/errors';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Spacing } from '@/constants/theme';
import { employeeService } from '@/services/employee.service';

export default function CreateEmployeeScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Required', 'Please enter employee name and phone number');
      return;
    }
    setLoading(true);
    try {
      await employeeService.create({ name: name.trim(), phone: phone.trim(), role: 'EMPLOYEE' });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      Alert.alert('Could not add staff', parseApiError(e).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <Input
        label="Full Name"
        placeholder="e.g. Suresh Varma"
        value={name}
        onChangeText={setName}
      />
      <Input
        label="Phone Number"
        placeholder="e.g. 9825123456"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      <View style={styles.submitRow}>
        <Button title="Save Staff Member" loading={loading} onPress={submit} />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  submitRow: {
    marginTop: Spacing.md,
  },
});
