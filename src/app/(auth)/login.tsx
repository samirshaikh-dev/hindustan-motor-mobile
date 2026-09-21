import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { parseApiError } from '@/api/errors';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginScreen() {
  const setAdminSession = useAuthStore((s) => s.setAdminSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter your email and password');
      return;
    }
    setLoading(true);
    try {
      const result = await authService.login({ email, password });
      await setAdminSession(result.accessToken, result.refreshToken);
      router.replace('/(auth)/select-actor');
    } catch (e) {
      const err = parseApiError(e);
      Alert.alert('Login failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workshop Owner</Text>
        <Text style={styles.sub}>Sign in to assign tasks and manage shop-floor staff.</Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="owner@hindustan.com"
        />
        <Input
          label="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="Enter password"
        />

        <View style={styles.actions}>
          <Button title="Sign In" loading={loading} onPress={onSubmit} />
          <Button
            title="Back to profile selection"
            variant="ghost"
            onPress={() => router.back()}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.xxxl,
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
  },
  form: {
    gap: Spacing.xs,
  },
  actions: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
});
