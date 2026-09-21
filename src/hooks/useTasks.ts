import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/config/queryKeys';
import { taskService } from '@/services/task.service';
import type { TaskStatus } from '@/types/domain';

export const useTaskDetail = (id: string) => {
  return useQuery({
    queryKey: queryKeys.tasks.detail(id),
    queryFn: () => taskService.getById(id),
    enabled: Boolean(id),
  });
};

export const useUpdateTaskStatus = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: TaskStatus) => taskService.updateStatus(id, status),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      if (updated.jobId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(updated.jobId) });
      }
    },
  });
};

export const useAssignTask = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assignedEmployeeId: string) => taskService.assign(id, assignedEmployeeId),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      if (updated.jobId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(updated.jobId) });
      }
    },
  });
};
