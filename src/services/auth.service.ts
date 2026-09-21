import axios from 'axios';

import { apiClient } from '@/api/client';
import { ENV } from '@/config/env';
import type { ApiResponse } from '@/types/api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken?: string;
  admin: { email: string; role: string };
}

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResult> {
    const res = await axios.post<
      ApiResponse<{
        token: string;
        accessToken: string;
        refreshToken?: string;
        admin: { email: string; role: string };
      }>
    >(`${ENV.API_BASE_URL}/auth/login`, payload);

    const data = res.data.data;
    return {
      accessToken: data.accessToken || data.token,
      refreshToken: data.refreshToken,
      admin: data.admin,
    };
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      /* ignore */
    }
  },

  async me() {
    const res = await apiClient.get<ApiResponse<{ email: string; role: string }>>('/auth/me');
    return res.data.data;
  },
};
