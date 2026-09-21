import { apiClient } from '@/api/client';
import type { ApiResponse, PaginationMeta } from '@/types/api';
import type { HistoryItem, Motor } from '@/types/domain';

export interface RegisterMotorPayload {
  customerName: string;
  customerPhone: string;
  brand?: string;
  motorType?: string;
  power?: number;
  powerUnit?: string;
  rpm?: number;
  phase?: string;
  serialNumber?: string;
  complaint?: string;
  notes?: string;
  expectedDeliveryAt?: string;
}

export const motorService = {
  async getMotors(params?: { search?: string; status?: string; page?: number; limit?: number }) {
    const res = await apiClient.get<
      ApiResponse<{ motors: Motor[]; pagination: PaginationMeta }>
    >('/motors', { params });
    return { items: res.data.data.motors, pagination: res.data.data.pagination };
  },

  async getMotorById(id: string) {
    const res = await apiClient.get<ApiResponse<Motor>>(`/motors/${id}`);
    return res.data.data;
  },

  async registerMotor(payload: RegisterMotorPayload) {
    const res = await apiClient.post<ApiResponse<Motor>>('/motors', payload);
    return res.data.data;
  },

  async updateMotor(id: string, payload: Partial<RegisterMotorPayload>) {
    const res = await apiClient.patch<ApiResponse<Motor>>(`/motors/${id}`, payload);
    return res.data.data;
  },

  async getMotorHistory(motorId: string, page = 1) {
    const res = await apiClient.get<
      ApiResponse<
        | HistoryItem[]
        | { history: HistoryItem[]; pagination: PaginationMeta }
      >
    >(`/motors/${motorId}/history`, { params: { page } });

    const data = res.data.data;
    if (Array.isArray(data)) {
      return { history: data, pagination: null };
    }
    return data;
  },
};
