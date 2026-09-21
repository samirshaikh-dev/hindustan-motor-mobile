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
      <TextInput
        style={styles.search}
        placeholder="Search staff by name or phone..."
        placeholderTextColor="#94a3b8"
        value={search}
        onChangeText={setSearch}
      />

      <Button title="Register new team member" onPress={() => router.push('/(app)/employees/create')} />

      {isLoading ? (
        <ActivityIndicator color="#0284c7" style={{ marginTop: 24 }} />
      ) : error ? (
        <ErrorBanner message={parseApiError(error).message} onRetry={() => refetch()} />
      ) : filteredEmployees.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.empty}>No team members found.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {filteredEmployees.map((emp) => (
            <Pressable
              key={emp.id}
              style={styles.card}
              onPress={() => router.push(`/(app)/employees/${emp.id}`)}>
              <View style={styles.row}>
                <View style={styles.nameCol}>
                  <Text style={styles.name}>{emp.name}</Text>
                  <Text style={styles.phone}>{emp.phone}</Text>
                </View>
                <View style={styles.badgeCol}>
                  <StatusBadge status={emp.role} />
                  {!emp.isActive ? <StatusBadge status="CANCELLED" /> : null}
                </View>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.meta}>
                  {emp.activeTaskCount ?? 0} active task(s)
                </Text>
                {emp.isActive ? (
                  <Text style={styles.activeTag}>● Active</Text>
                ) : (
                  <Text style={styles.inactiveTag}>○ Inactive</Text>
                )}
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  search: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    fontSize: 15,
  },
  list: { marginTop: 16, gap: 10 },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  nameCol: { flex: 1, marginRight: 8 },
  badgeCol: { alignItems: 'flex-end', gap: 4 },
  name: { fontWeight: '700', fontSize: 16, color: '#0f172a' },
  phone: { color: '#64748b', fontSize: 13, marginTop: 2 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  meta: { color: '#64748b', fontSize: 13, fontWeight: '500' },
  activeTag: { color: '#16a34a', fontSize: 12, fontWeight: '600' },
  inactiveTag: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  emptyBox: { paddingVertical: 40, alignItems: 'center' },
  empty: { color: '#64748b', fontSize: 14 },
});
