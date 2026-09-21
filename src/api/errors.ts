import axios, { AxiosError } from 'axios';

import type { ApiErrorResponse } from '@/types/api';

export interface AppError {
  message: string;
  code: string;
  validationErrors?: Array<{ field: string; message: string }>;
  isNetworkError: boolean;
}

export const parseApiError = (error: unknown): AppError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;

    if (!axiosError.response) {
      return {
        message: 'Unable to connect to workshop server. Check your network or server status.',
        code: 'NETWORK_ERROR',
        isNetworkError: true,
      };
    }

    const payload = axiosError.response.data;
    return {
      message: payload?.message || axiosError.message || 'An unexpected error occurred',
      code: payload?.code || `HTTP_${axiosError.response.status}`,
      validationErrors: Array.isArray(payload?.data) ? payload.data : undefined,
      isNetworkError: false,
    };
  }

  return {
    message: (error as Error)?.message || 'An unknown error occurred',
    code: 'UNKNOWN_ERROR',
    isNetworkError: false,
  };
};
