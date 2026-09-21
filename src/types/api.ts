export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_STATUS_TRANSITION'
  | 'INVALID_FILE_TYPE'
  | 'ACTOR_HEADER_MISSING'
  | 'ACTOR_NOT_FOUND'
  | 'ACTOR_INACTIVE'
  | 'ADMIN_ONLY'
  | 'NOT_FOUND'
  | 'MOTOR_NOT_FOUND'
  | 'JOB_NOT_FOUND'
  | 'TASK_NOT_FOUND'
  | 'EMPLOYEE_NOT_FOUND'
  | 'PHONE_ALREADY_EXISTS'
  | 'DUPLICATE_RESOURCE'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_SERVER_ERROR'
  | 'INVALID_CREDENTIALS'
  | 'TOKEN_REQUIRED'
  | 'INVALID_TOKEN'
  | 'REFRESH_TOKEN_REQUIRED'
  | 'REFRESH_TOKEN_EXPIRED'
  | 'TOKEN_REUSE_DETECTED';

export interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code: ApiErrorCode | string;
  data: { field: string; message: string }[] | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface HealthCheckData {
  status: string;
  database: string;
  uptime: number;
  timestamp: string;
}

export interface VersionData {
  name: string;
  version: string;
  environment: string;
  nodeVersion: string;
  startTime: string;
  uptime: number;
  timestamp: string;
}

export interface ApiOverviewData {
  version: string;
  endpoints: Record<string, string>;
  authentication: {
    type: string;
    header: string;
    description: string;
  };
}

