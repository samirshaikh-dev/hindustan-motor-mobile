import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/config/queryKeys';
import { historyService, type HistoryFilterParams } from '@/services/history.service';

export const useGlobalHistory = (params?: HistoryFilterParams) => {
  return useQuery({
    queryKey: queryKeys.history.list(params as Record<string, unknown>),
    queryFn: () => historyService.getHistory(params),
  });
};
