import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { parseApiError } from '@/api/errors';
import { TimelineItem } from '@/components/domain/TimelineItem';
import { ErrorBanner } from '@/components/feedback/ErrorBanner';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { useMotorHistory } from '@/hooks/useMotors';

export default function MotorHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error, refetch, isRefetching } = useMotorHistory(id!);

  return (
    <ScreenWrapper onRefresh={() => refetch()} refreshing={isRefetching}>
      <Text style={styles.title}>Motor timeline</Text>
      {isLoading ? (
        <ActivityIndicator color="#0284c7" style={{ marginTop: 24 }} />
      ) : error ? (
        <ErrorBanner message={parseApiError(error).message} onRetry={() => refetch()} />
      ) : (data?.history ?? []).length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.empty}>No audit records found for this motor.</Text>
        </View>
      ) : (
        <View style={styles.timeline}>
          {(data?.history ?? []).map((item) => (
            <TimelineItem key={item.id} item={item} />
          ))}
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '800', marginBottom: 16, color: '#0f172a' },
  emptyBox: { paddingVertical: 40, alignItems: 'center' },
  empty: { color: '#64748b', fontSize: 14 },
  timeline: { gap: 12 },
});
