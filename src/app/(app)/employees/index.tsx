import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { parseApiError } from '@/api/errors';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
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
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Search staff by name or phone..."
          placeholderTextColor={Colors.light.textMuted}
          value={search}
          onChangeText={setSearch}
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
        <ErrorBanner message={parseApiError(error).message} onRetry={() => refetch()} />
      ) : filteredEmployees.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.empty}>No team members found.</Text>
        </View>
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
              <View style={styles.mainInfo}>
                <View style={styles.nameLine}>
                  <Text style={styles.name}>{emp.name}</Text>
                  {!emp.isActive ? <StatusBadge status="CANCELLED" /> : null}
                </View>
                <Text style={styles.phone}>{emp.phone}</Text>
                <Text style={styles.tasks}>
                  {emp.activeTaskCount ?? 0} active task{emp.activeTaskCount === 1 ? '' : 's'}
                </Text>
              </View>
              <StatusBadge status={emp.role} />
            </Pressable>
          ))}
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    marginBottom: Spacing.sm,
  },
  search: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    backgroundColor: Colors.light.surface,
    fontSize: 15,
    color: Colors.light.text,
  },
  ctaRow: {
    marginBottom: Spacing.md,
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
  mainInfo: {
    flex: 1,
    marginRight: Spacing.md,
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
    color: Colors.light.text,
  },
  phone: {
    ...Typography.subhead,
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  tasks: {
    ...Typography.caption,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  emptyBox: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
  },
  empty: {
    ...Typography.body,
    color: Colors.light.textSecondary,
  },
});
