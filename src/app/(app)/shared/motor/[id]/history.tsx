import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { parseApiError } from '@/api/errors';
import { TimelineItem } from '@/components/domain/TimelineItem';
import { ErrorBanner } from '@/components/feedback/ErrorBanner';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useMotorHistory } from '@/hooks/useMotors';

export default function MotorHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error, refetch, isRefetching } = useMotorHistory(id!);

  return (
    <ScreenWrapper onRefresh={() => refetch()} refreshing={isRefetching}>
      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Colors.light.textSecondary} size="small" />
        </View>
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
  loadingBox: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
  },
  emptyBox: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
  },
  empty: {
    ...Typography.body,
    color: Colors.light.textSecondary,
  },
  timeline: {
    paddingTop: Spacing.md,
  },
});
