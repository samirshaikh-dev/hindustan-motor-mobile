import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/config/queryKeys';
import { systemService } from '@/services/system.service';

export const useSystemHealth = () => {
  return useQuery({
    queryKey: queryKeys.system.health,
    queryFn: () => systemService.getHealth(),
    staleTime: 30000,
    retry: 1,
  });
};
