import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { parseApiError } from '@/api/errors';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ErrorBanner } from '@/components/feedback/ErrorBanner';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { queryKeys } from '@/config/queryKeys';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
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
      refreshing={isRefetching}
      onRefresh={() => refetch()}
      contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hindustan Electricals</Text>
        <Text style={styles.sub}>Select your shop-floor profile</Text>
      </View>

      {!accessToken && !activeActorId ? (
        <View style={styles.unauthedBox}>
          <Text style={styles.hint}>
            Sign in as Workshop Owner once to load the staff roster, then select your floor profile.
          </Text>
          <Button title="Owner Sign In" onPress={() => router.push('/(auth)/login')} />
        </View>
      ) : isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={Colors.light.textSecondary} />
        </View>
      ) : error ? (
        <ErrorBanner message={parseApiError(error).message} onRetry={() => refetch()} />
      ) : (
        <View style={styles.group}>
          {(data?.employees ?? []).map((emp, index) => (
            <Pressable
              key={emp.id}
              style={({ pressed }) => [
                styles.row,
                index > 0 && styles.rowBorder,
                pressed && styles.rowPressed,
              ]}
              onPress={() => onSelect(emp)}>
              <View style={styles.rowInfo}>
                <Text style={styles.name}>{emp.name}</Text>
                <Text style={styles.meta}>{emp.phone}</Text>
              </View>
              <StatusBadge status={emp.role} />
            </Pressable>
          ))}
          {(data?.employees?.length ?? 0) === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.hint}>No active employees found.</Text>
            </View>
          ) : null}
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.xxl,
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
  unauthedBox: {
    backgroundColor: Colors.light.surface,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: Spacing.md,
  },
  hint: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  loadingBox: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
  },
  group: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  rowPressed: {
    backgroundColor: Colors.light.secondary,
  },
  rowInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  name: {
    ...Typography.headline,
    fontSize: 15,
    color: Colors.light.text,
  },
  meta: {
    ...Typography.subhead,
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  emptyBox: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
});
