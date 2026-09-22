import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { parseApiError } from '@/api/errors';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { ErrorBanner } from '@/components/feedback/ErrorBanner';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginScreen() {
  const setAdminSession = useAuthStore((s) => s.setAdminSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      router.replace('/(app)/owner');
    } catch (e) {
      setError(parseApiError(e).message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/select-actor');
    }
  };

  return (
    <ScreenWrapper contentContainerStyle={styles.container}>
      <View style={styles.contentWrapper}>
        <View style={styles.topSection}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeGlyph}>⚡</Text>
            <Text style={styles.brandBadgeText}>Hindustan Electricals</Text>
          </View>

          <Text style={styles.title}>Workshop Owner</Text>
          <Text style={styles.subtitle}>
            Sign in to assign tasks and manage shop-floor staff.
          </Text>
        </View>

        <View style={styles.card}>
          {error ? <ErrorBanner message={error} /> : null}

          <View style={styles.form}>
            <Input
              label="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              placeholder="admin@motors.com"
            />
            <Input
              label="Password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••••"
              rightAccessory={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={8}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={Colors.light.textSecondary}
                  />
                </Pressable>
              }
            />

            <View style={styles.actions}>
              <Button
                title="Sign In"
                variant="primary"
                loading={loading}
                onPress={onSubmit}
              />
              <Button
                title="Back to profile selection"
                variant="ghost"
                onPress={handleBack}
              />
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.securityNote}>
            <Text style={styles.securityIcon}>🔒</Text>
            <Text style={styles.securityText}>
              Authorized workshop access only.
            </Text>
          </View>
          <Text style={styles.footerVersion}>
            Hindustan Electricals • v1.0.0
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
    maxWidth: 440,
    alignSelf: 'center',
    gap: Spacing.xl,
  },
  topSection: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.sm,
  },
  brandBadgeGlyph: {
    fontSize: 14,
  },
  brandBadgeText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    ...Typography.largeTitle,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitle: {
    ...Typography.subhead,
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.xl,
  },
  form: {
    gap: Spacing.xs,
  },
  eyeButton: {
    padding: Spacing.xs,
  },
  actions: {
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  securityIcon: {
    fontSize: 13,
  },
  securityText: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  footerVersion: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.light.textMuted,
  },
});
