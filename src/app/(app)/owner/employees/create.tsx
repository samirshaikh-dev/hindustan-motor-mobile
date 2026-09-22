import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { parseApiError } from '@/api/errors';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
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
      await employeeService.create({
        name: name.trim(),
        phone: phone.trim(),
        role: 'EMPLOYEE',
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      Alert.alert('Could not add staff', parseApiError(e).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper contentContainerStyle={styles.container}>
      <View style={styles.contentWrapper}>
        <View style={styles.topSection}>
          <View style={styles.iconBox}>
            <Text style={styles.iconGlyph}>👷</Text>
          </View>
          <Text style={styles.title}>New Team Member</Text>
          <Text style={styles.subtitle}>
            Register a shop-floor technician or winding team member.
          </Text>

          <View style={styles.card}>
            <Input
              label="Full Name *"
              placeholder="e.g. Suresh Varma"
              value={name}
              onChangeText={setName}
            />
            <Input
              label="Phone Number *"
              placeholder="e.g. 9825123456"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>
        </View>

        <View style={styles.footerSection}>
          <Button
            title="Save Staff Member"
            loading={loading}
            onPress={submit}
          />
          <Text style={styles.hintText}>
            Added staff members can immediately select their floor profile.
          </Text>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingVertical: Spacing.xl,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    gap: Spacing.xl,
  },
  topSection: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  iconGlyph: {
    fontSize: 26,
  },
  title: {
    ...Typography.title,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.subhead,
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.lg,
    width: '100%',
  },
  footerSection: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  hintText: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textMuted,
    textAlign: 'center',
  },
});
