import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { parseApiError } from '@/api/errors';
import { Button } from '@/components/common/Button';
import { SearchInput } from '@/components/common/SearchInput';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorBanner } from '@/components/feedback/ErrorBanner';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useEmployeeStatusDashboard } from '@/hooks/useEmployees';

export default function EmployeesScreen() {
  const [search, setSearch] = useState('');
  const { data, isLoading, error, refetch, isRefetching } = useEmployeeStatusDashboard();

  const filteredEmployees = (data ?? []).filter((emp) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return emp.name.toLowerCase().includes(q) || emp.phone.includes(q);
  });

  return (
    <ScreenWrapper refreshing={isRefetching} onRefresh={() => refetch()}>
      <View style={styles.contentWrapper}>
        <View style={styles.searchWrap}>
          <SearchInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search staff by name or phone..."
          />
        </View>

        <View style={styles.ctaRow}>
          <Button
            title="Add Staff Member"
            onPress={() => router.push('/(app)/employees/create')}
          />
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Colors.light.textSecondary} size="small" />
          </View>
        ) : error ? (
          <ErrorBanner
            message={parseApiError(error).message}
            onRetry={() => refetch()}
          />
        ) : filteredEmployees.length === 0 ? (
          <EmptyState
            icon="👷"
            title="No team members found"
            description="No staff members match your search criteria."
            actionTitle="Add Staff Member"
            onAction={() => router.push('/(app)/employees/create')}
          />
        ) : (
          <View style={styles.group}>
            {filteredEmployees.map((emp, index) => (
              <Pressable
                key={emp.id}
                style={({ pressed }) => [
                  styles.row,
                  index > 0 && styles.rowBorder,
                  pressed && styles.rowPressed,
                ]}
                onPress={() => router.push(`/(app)/employees/${emp.id}`)}>
                <View style={styles.avatarBox}>
                  <Text style={styles.avatarText}>{emp.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.mainInfo}>
                  <View style={styles.nameLine}>
                    <Text style={styles.name}>{emp.name}</Text>
                    {!emp.isActive ? <StatusBadge status="CANCELLED" /> : null}
                  </View>
                  <Text style={styles.phone}>{emp.phone}</Text>
                  <Text style={styles.tasks}>
                    {emp.activeTaskCount ?? 0} active task
                    {emp.activeTaskCount === 1 ? '' : 's'}
                  </Text>
                </View>
                <StatusBadge status={emp.role} />
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  contentWrapper: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  searchWrap: {
    marginBottom: Spacing.sm,
  },
  ctaRow: {
    marginBottom: Spacing.lg,
  },
  loadingBox: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
  },
  group: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  rowPressed: {
    backgroundColor: Colors.light.secondary,
  },
  avatarBox: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.headline,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  mainInfo: {
    flex: 1,
    gap: 2,
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  name: {
    ...Typography.headline,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  phone: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  tasks: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.light.textMuted,
  },
});
