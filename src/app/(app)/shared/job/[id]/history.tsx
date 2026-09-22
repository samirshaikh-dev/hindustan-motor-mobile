import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { parseApiError } from '@/api/errors';
import { TimelineItem } from '@/components/domain/TimelineItem';
import { ErrorBanner } from '@/components/feedback/ErrorBanner';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { queryKeys } from '@/config/queryKeys';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { jobService } from '@/services/job.service';

export default function JobHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: queryKeys.jobs.history(id!),
    queryFn: () => jobService.getHistory(id!),
    enabled: !!id,
  });

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
          <Text style={styles.empty}>No audit records found for this job.</Text>
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
