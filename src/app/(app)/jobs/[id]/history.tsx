import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';

import { parseApiError } from '@/api/errors';
import { TimelineItem } from '@/components/domain/TimelineItem';
import { ErrorBanner } from '@/components/feedback/ErrorBanner';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { queryKeys } from '@/config/queryKeys';
import { jobService } from '@/services/job.service';

export default function JobHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.jobs.history(id!),
    queryFn: () => jobService.getHistory(id!),
    enabled: !!id,
  });

  return (
    <ScreenWrapper onRefresh={() => refetch()}>
      <Text style={styles.title}>Job timeline</Text>
      {isLoading ? (
        <ActivityIndicator color="#0284c7" />
      ) : error ? (
        <ErrorBanner message={parseApiError(error).message} onRetry={() => refetch()} />
      ) : (
        (data?.history ?? []).map((item) => <TimelineItem key={item.id} item={item} />)
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '800', marginBottom: 16 },
});
