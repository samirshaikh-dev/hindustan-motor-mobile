import { apiClient } from '@/api/client';
import type { ApiResponse } from '@/types/api';
import type { Task, TaskStatus } from '@/types/domain';

export const taskService = {
  async getById(id: string) {
    const res = await apiClient.get<ApiResponse<Task>>(`/tasks/${id}`);
    return res.data.data;
  },

  async update(
    id: string,
    payload: { title?: string; description?: string; assignedEmployeeId?: string },
  ) {
    const res = await apiClient.patch<ApiResponse<Task>>(`/tasks/${id}`, payload);
    return res.data.data;
  },

  async assign(id: string, assignedEmployeeId: string) {
    return this.update(id, { assignedEmployeeId });
  },

  async updateStatus(id: string, status: TaskStatus) {
    const res = await apiClient.patch<ApiResponse<Task>>(`/tasks/${id}/status`, { status });
    return res.data.data;
  },
};
