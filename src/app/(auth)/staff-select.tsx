import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { parseApiError } from '@/api/errors';
import { SearchInput } from '@/components/common/SearchInput';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorBanner } from '@/components/feedback/ErrorBanner';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { queryKeys } from '@/config/queryKeys';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { employeeService } from '@/services/employee.service';
import { useAuthStore } from '@/store/useAuthStore';
import type { Employee } from '@/types/domain';

export default function StaffSelectScreen() {
  const setActiveActor = useAuthStore((s) => s.setActiveActor);
  const [search, setSearch] = useState('');
  const [selectingId, setSelectingId] = useState<string | null>(null);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: queryKeys.employees.list({ isActive: true }),
    queryFn: () => employeeService.list({ isActive: true, limit: 100 }),
  });

  const employees = data?.employees ?? [];

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(q) || emp.phone.includes(q),
    );
  }, [employees, search]);

  const onSelect = async (employee: Employee) => {
    try {
      setSelectingId(employee.id);
      await Haptics.selectionAsync();
      await setActiveActor(employee.id, employee.name, employee.role);
      router.replace('/(app)');
    } catch (e) {
      setSelectingId(null);
      const msg = parseApiError(e).message;
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Selection Error', msg);
      }
    }
  };

  return (
    <ScreenWrapper
      refreshing={isRefetching}
      onRefresh={() => refetch()}
      contentContainerStyle={styles.container}>
      <View style={styles.headerBox}>
        <Text style={styles.pageTitle}>Who is working today?</Text>
        <Text style={styles.pageSubtitle}>
          Select your name from the staff roster to view your assigned tasks.
        </Text>

        <View style={styles.searchWrap}>
          <SearchInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or phone..."
          />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading staff roster...</Text>
        </View>
      ) : error ? (
        <View style={styles.statusBox}>
          <ErrorBanner
            message={parseApiError(error).message}
            onRetry={() => refetch()}
          />
        </View>
      ) : filteredEmployees.length === 0 ? (
        <View style={styles.statusBox}>
          <EmptyState
            icon="people-outline"
            title={search ? 'No matches found' : 'No staff members registered'}
            description={
              search
                ? `No staff matching "${search}". Try searching another name or phone.`
                : 'Ask the workshop owner to add your name to the team roster.'
            }
            actionTitle={search ? 'Clear Search' : undefined}
            onAction={search ? () => setSearch('') : undefined}
          />
        </View>
      ) : (
        <View style={styles.list}>
          <Text style={styles.listHeader}>
            AVAILABLE STAFF ({filteredEmployees.length})
          </Text>

          {filteredEmployees.map((emp) => {
            const isSelected = selectingId === emp.id;
            const initials = emp.name
              .split(' ')
              .map((n) => n[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
              .toUpperCase() || 'ST';

            return (
              <Pressable
                key={emp.id}
                accessibilityRole="button"
                accessibilityLabel={`Select ${emp.name}`}
                disabled={isSelected}
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.cardPressed,
                  isSelected && styles.cardSelected,
                ]}
                onPress={() => onSelect(emp)}>
                <View style={styles.avatarBox}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>

                <View style={styles.cardInfo}>
                  <Text style={styles.name}>{emp.name}</Text>
                  <Text style={styles.phone}>{emp.phone}</Text>
                </View>

                <View style={styles.cardEnd}>
                  <StatusBadge status={emp.role} />
                  {isSelected ? (
                    <ActivityIndicator
                      size="small"
                      color={Colors.light.primary}
                    />
                  ) : (
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={Colors.light.textMuted}
                    />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.lg,
  },
  headerBox: {
    gap: Spacing.xs,
  },
  pageTitle: {
    ...Typography.title,
    color: Colors.light.text,
  },
  pageSubtitle: {
    ...Typography.subhead,
    color: Colors.light.textSecondary,
  },
  searchWrap: {
    marginTop: Spacing.sm,
  },
  centerBox: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.subhead,
    color: Colors.light.textSecondary,
  },
  statusBox: {
    paddingVertical: Spacing.md,
  },
  list: {
    gap: Spacing.sm,
  },
  listHeader: {
    ...Typography.caption,
    color: Colors.light.textMuted,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  cardPressed: {
    backgroundColor: Colors.light.backgroundSubtle,
    borderColor: Colors.light.primary,
  },
  cardSelected: {
    backgroundColor: Colors.light.backgroundSubtle,
    borderColor: Colors.light.primary,
    opacity: 0.8,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.headline,
    color: Colors.light.primary,
    fontWeight: '700',
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...Typography.headline,
    color: Colors.light.text,
  },
  phone: {
    ...Typography.subhead,
    color: Colors.light.textSecondary,
  },
  cardEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});
