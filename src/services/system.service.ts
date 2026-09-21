import { systemClient } from '@/api/client';
import type { ApiOverviewData, ApiResponse, HealthCheckData, VersionData } from '@/types/api';

export const systemService = {
  async getHealth(): Promise<HealthCheckData> {
    const res = await systemClient.get<ApiResponse<HealthCheckData>>('/health');
    return res.data.data;
  },

  async getVersion(): Promise<VersionData> {
    const res = await systemClient.get<ApiResponse<VersionData>>('/version');
    return res.data.data;
  },

  async getApiOverview(): Promise<ApiOverviewData> {
    const res = await systemClient.get<ApiResponse<ApiOverviewData>>('/api/v1');
    return res.data.data;
  },
};
