import { apiClient } from '@/api/client';
import type { ApiResponse, PaginationMeta } from '@/types/api';
import type { HistoryItem, Job, JobStatus, Task } from '@/types/domain';

export const jobService = {
  async list(params?: { status?: string; motorId?: string; page?: number; limit?: number }) {
    const res = await apiClient.get<
      ApiResponse<{ jobs: Job[]; pagination: PaginationMeta }>
    >('/jobs', { params });
    return { items: res.data.data.jobs, pagination: res.data.data.pagination };
  },

  async getById(id: string) {
    const res = await apiClient.get<ApiResponse<Job>>(`/jobs/${id}`);
    return res.data.data;
  },

  async create(payload: { motorId: string; notes?: string }) {
    const res = await apiClient.post<ApiResponse<Job>>('/jobs', payload);
    return res.data.data;
  },

  async updateStatus(id: string, payload: { status: JobStatus; notes?: string }) {
    const res = await apiClient.patch<ApiResponse<Job>>(`/jobs/${id}/status`, payload);
    return res.data.data;
  },

  async getTasks(jobId: string, params?: { status?: string; page?: number; limit?: number }) {
    const res = await apiClient.get<
      ApiResponse<{ tasks: Task[]; pagination: PaginationMeta }>
    >(`/jobs/${jobId}/tasks`, { params });
    return res.data.data;
  },

  async createTask(
    jobId: string,
    payload: { title: string; description?: string; assignedEmployeeId?: string },
  ) {
    const res = await apiClient.post<ApiResponse<Task>>(`/jobs/${jobId}/tasks`, payload);
    return res.data.data;
  },

  async getHistory(jobId: string, page = 1) {
    const res = await apiClient.get<
      ApiResponse<
        | HistoryItem[]
        | { history: HistoryItem[]; pagination: PaginationMeta }
      >
    >(`/jobs/${jobId}/history`, { params: { page } });

    const data = res.data.data;
    if (Array.isArray(data)) {
      return { history: data, pagination: null };
    }
    return data;
  },
};
