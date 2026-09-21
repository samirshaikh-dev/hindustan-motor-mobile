import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/config/queryKeys';
import { jobService } from '@/services/job.service';
import type { JobStatus } from '@/types/domain';

export const useJobs = (params?: { status?: string; motorId?: string; page?: number; limit?: number }) => {
  return useQuery({
    queryKey: queryKeys.jobs.list(params || {}),
    queryFn: () => jobService.list(params),
  });
};

export const useJobDetail = (id: string) => {
  return useQuery({
    queryKey: queryKeys.jobs.detail(id),
    queryFn: () => jobService.getById(id),
    enabled: Boolean(id),
  });
};

export const useJobHistory = (jobId: string, page = 1) => {
  return useQuery({
    queryKey: queryKeys.jobs.history(jobId),
    queryFn: () => jobService.getHistory(jobId, page),
    enabled: Boolean(jobId),
  });
};

export const useCreateJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { motorId: string; notes?: string }) => jobService.create(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.motors.detail(variables.motorId) });
    },
  });
};

export const useUpdateJobStatus = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { status: JobStatus; notes?: string }) =>
      jobService.updateStatus(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
      if (updated.motorId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.motors.detail(updated.motorId) });
      }
    },
  });
};
