import { apiClient } from '@/api/client';
import type { ApiResponse, PaginationMeta } from '@/types/api';
import type { HistoryAction, HistoryItem } from '@/types/domain';

export interface HistoryFilterParams {
  actorEmployeeId?: string;
  action?: HistoryAction | string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const historyService = {
  async getHistory(params?: HistoryFilterParams) {
    const res = await apiClient.get<
      ApiResponse<{ history: HistoryItem[]; pagination: PaginationMeta }>
    >('/history', { params });
    return res.data.data;
  },
};
