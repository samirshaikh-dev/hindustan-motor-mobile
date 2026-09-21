import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { parseApiError } from '@/api/errors';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { ErrorBanner } from '@/components/feedback/ErrorBanner';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginScreen() {
  const setAdminSession = useAuthStore((s) => s.setAdminSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password');
      return;
    }
    setLoading(true);
    try {
      const result = await authService.login({ email, password });
      await setAdminSession(result.accessToken, result.refreshToken);
      router.replace('/(auth)/select-actor');
    } catch (e) {
      setError(parseApiError(e).message);
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

      {error ? <ErrorBanner message={error} /> : null}

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
