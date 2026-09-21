import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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
  const [showStaffRoster, setShowStaffRoster] = useState(false);

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

  const handleStaffProfilePress = () => {
    if (!accessToken && !activeActorId) {
      Alert.alert(
        'Owner Sign In Required',
        'Sign in as Workshop Owner once to load the staff roster onto this device.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Owner Sign In',
            onPress: () => router.push('/(auth)/login'),
          },
        ],
      );
      return;
    }
    setShowStaffRoster((prev) => !prev);
  };

  return (
    <ScreenWrapper
      refreshing={isRefetching}
      onRefresh={() => refetch()}
      contentContainerStyle={styles.container}>
      <View style={styles.contentWrapper}>
        <View style={styles.topSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoGlyph}>⚡</Text>
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>Select your profile</Text>
          </View>

          <Text style={styles.title}>Hindustan Electricals</Text>
          <Text style={styles.subtitle}>
            Choose how you want to access the app
          </Text>
        </View>

        <View style={styles.cardsSection}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconBox}>
                <Text style={styles.cardIcon}>👤</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>Workshop Owner</Text>
                <Text style={styles.cardSub}>Manage staff & jobs</Text>
              </View>
            </View>
            <Button
              title="Owner Sign In"
              variant="primary"
              onPress={() => router.push('/(auth)/login')}
            />
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconBox}>
                <Text style={styles.cardIcon}>👷</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>Staff Profile</Text>
                <Text style={styles.cardSub}>Select your profile</Text>
              </View>
            </View>

            <Button
              title={showStaffRoster ? 'Hide Profiles' : 'Select Profile'}
              variant="secondary"
              onPress={handleStaffProfilePress}
            />

            {showStaffRoster ? (
              <View style={styles.rosterContainer}>
                {isLoading ? (
                  <View style={styles.loadingBox}>
                    <ActivityIndicator
                      size="small"
                      color={Colors.light.textSecondary}
                    />
                  </View>
                ) : error ? (
                  <ErrorBanner
                    message={parseApiError(error).message}
                    onRetry={() => refetch()}
                  />
                ) : (
                  <View style={styles.rosterList}>
                    {(data?.employees ?? []).map((emp, index) => (
                      <Pressable
                        key={emp.id}
                        style={({ pressed }) => [
                          styles.rosterRow,
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
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>Hindustan Electricals</Text>
          <Text style={styles.footerVersion}>v1.0.0</Text>
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
    gap: Spacing.xxl,
  },
  topSection: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
  },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  logoGlyph: {
    fontSize: 26,
    lineHeight: 30,
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.sm,
  },
  badgeText: {
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
  cardsSection: {
    gap: Spacing.lg,
    width: '100%',
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    fontSize: 22,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    ...Typography.headline,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  cardSub: {
    ...Typography.subhead,
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  rosterContainer: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  rosterList: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
    backgroundColor: Colors.light.surface,
  },
  rosterRow: {
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
  hint: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  loadingBox: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  footerBrand: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  footerVersion: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.light.textMuted,
  },
});
