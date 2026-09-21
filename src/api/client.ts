import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

import { ENV } from '@/config/env';
import { storageService } from '@/services/storage.service';
import { useAuthStore } from '@/store/useAuthStore';

export const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const accessToken = await storageService.getAccessToken();
    const actor = await storageService.getActiveActor();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    if (actor?.id) {
      config.headers['X-Employee-Id'] = actor.id;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (
      !originalRequest ||
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      const storedRefreshToken = await storageService.getRefreshToken();

      if (!storedRefreshToken) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          `${ENV.API_BASE_URL}/auth/refresh`,
          { refreshToken: storedRefreshToken },
          { headers: { 'Content-Type': 'application/json' } },
        );

        const newAccessToken =
          refreshResponse.data.data.accessToken || refreshResponse.data.data.token;
        const newRefreshToken = refreshResponse.data.data.refreshToken;

        await storageService.setAccessToken(newAccessToken);
        if (newRefreshToken) {
          await storageService.setRefreshToken(newRefreshToken);
        }

        useAuthStore.setState({ accessToken: newAccessToken });
        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export const systemClient = axios.create({
  baseURL: ENV.API_ROOT,
  timeout: ENV.TIMEOUT_MS,
});
