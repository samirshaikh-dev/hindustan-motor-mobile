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
    try {
      const res = await apiClient.get<
        ApiResponse<{ history: HistoryItem[]; pagination: PaginationMeta }>
      >('/history', { params });
      return res.data.data;
    } catch (e: unknown) {
      const errorWithResponse = e as { response?: { status?: number } };
      if (errorWithResponse?.response?.status === 404) {
        return {
          history: [] as HistoryItem[],
          pagination: {
            total: 0,
            page: 1,
            limit: params?.limit || 20,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        };
      }
      throw e;
    }
  },
};
