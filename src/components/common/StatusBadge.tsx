import { StyleSheet, Text, View } from 'react-native';

const COLORS: Record<string, string> = {
  RECEIVED: '#6366f1',
  IN_PROGRESS: '#0284c7',
  TESTING: '#d97706',
  READY_FOR_DELIVERY: '#16a34a',
  DELIVERED: '#15803d',
  CANCELLED: '#64748b',
  PENDING: '#94a3b8',
  ASSIGNED: '#6366f1',
  COMPLETED: '#16a34a',
};

export function StatusBadge({ status }: { status: string }) {
  const bg = COLORS[status] ?? '#64748b';
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={styles.text}>{status.replace(/_/g, ' ')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  text: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
