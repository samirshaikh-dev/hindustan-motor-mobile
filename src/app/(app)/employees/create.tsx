import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { parseApiError } from '@/api/errors';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { employeeService } from '@/services/employee.service';

export default function CreateEmployeeScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await employeeService.create({ name, phone, role: 'EMPLOYEE' });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      Alert.alert('Could not add employee', parseApiError(e).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <Text style={styles.title}>New team member</Text>
      <Input label="Full name" value={name} onChangeText={setName} />
      <Input label="Phone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
      <Button title="Save" loading={loading} onPress={submit} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '800', marginBottom: 12 },
});
