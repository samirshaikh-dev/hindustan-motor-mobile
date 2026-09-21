import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { parseApiError } from '@/api/errors';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginScreen() {
  const setAdminSession = useAuthStore((s) => s.setAdminSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
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
    <ScreenWrapper showContactCta={false}>
      <Text style={styles.title}>Workshop Owner</Text>
      <Text style={styles.sub}>Sign in to assign tasks and manage the team.</Text>
      <Input
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Input label="Password" secureTextEntry value={password} onChangeText={setPassword} />
      <Button title="Sign In" loading={loading} onPress={onSubmit} />
      <View style={styles.footer}>
        <Button title="Back to profile selection" variant="secondary" onPress={() => router.back()} />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  sub: { color: '#64748b', marginBottom: 20 },
  footer: { marginTop: 16 },
});
