import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { parseApiError } from '@/api/errors';
import { Button } from '@/components/common/Button';
import { ErrorBanner } from '@/components/feedback/ErrorBanner';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { queryKeys } from '@/config/queryKeys';
import { employeeService } from '@/services/employee.service';
import { useAuthStore } from '@/store/useAuthStore';
import type { Employee } from '@/types/domain';

export default function SelectActorScreen() {
  const setActiveActor = useAuthStore((s) => s.setActiveActor);
  const accessToken = useAuthStore((s) => s.accessToken);
  const activeActorId = useAuthStore((s) => s.activeActorId);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: queryKeys.employees.list({ isActive: true }),
    queryFn: () => employeeService.list({ isActive: true, limit: 100 }),
    enabled: !!accessToken || !!activeActorId,
    retry: false,
  });

  const onSelect = async (employee: Employee) => {
    try {
      await setActiveActor(employee.id, employee.name, employee.role);
      router.replace('/(app)');
    } catch (e) {
      Alert.alert('Error', parseApiError(e).message);
    }
  };

  return (
    <ScreenWrapper
      showContactCta
      refreshing={isRefetching}
      onRefresh={() => refetch()}
      contentContainerStyle={styles.content}>
      <Text style={styles.title}>Hindustan Electricals</Text>
      <Text style={styles.sub}>Select your shop-floor profile to continue.</Text>

      {!accessToken && !activeActorId ? (
        <View style={styles.box}>
          <Text style={styles.hint}>
            Sign in as owner once to load the team roster, then select your shop-floor profile.
          </Text>
          <Button title="Owner login" onPress={() => router.push('/(auth)/login')} />
        </View>
      ) : isLoading ? (
        <ActivityIndicator size="large" color="#0284c7" />
      ) : error ? (
        <ErrorBanner message={parseApiError(error).message} onRetry={() => refetch()} />
      ) : (
        <View style={styles.list}>
          {(data?.employees ?? []).map((emp) => (
            <Pressable key={emp.id} style={styles.card} onPress={() => onSelect(emp)}>
              <Text style={styles.name}>{emp.name}</Text>
              <Text style={styles.meta}>
                {emp.role} · {emp.phone}
              </Text>
            </Pressable>
          ))}
          {(data?.employees?.length ?? 0) === 0 ? (
            <Text style={styles.hint}>No active employees. Add staff from the Employees tab after sign-in.</Text>
          ) : null}
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 24 },
  title: { fontSize: 26, fontWeight: '800', color: '#0f172a' },
  sub: { color: '#64748b', marginTop: 8, marginBottom: 20 },
  box: { gap: 12 },
  hint: { color: '#64748b', lineHeight: 22 },
  list: { gap: 10 },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  name: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  meta: { color: '#64748b', marginTop: 4 },
});
