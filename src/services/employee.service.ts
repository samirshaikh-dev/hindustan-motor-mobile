import { apiClient } from '@/api/client';
import type { ApiResponse, PaginationMeta } from '@/types/api';
import type { Employee, EmployeeStatusRow, Role, Task } from '@/types/domain';

export const employeeService = {
  async list(params?: {
    isActive?: boolean;
    role?: Role | string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const res = await apiClient.get<
      ApiResponse<{ employees: Employee[]; pagination: PaginationMeta }>
    >('/employees', { params });
    return res.data.data;
  },

  async getStatusDashboard() {
    const res = await apiClient.get<ApiResponse<EmployeeStatusRow[]>>('/employees/status');
    return res.data.data;
  },

  async getById(id: string) {
    const res = await apiClient.get<ApiResponse<Employee>>(`/employees/${id}`);
    return res.data.data;
  },

  async create(payload: { name: string; phone: string; role?: Role | string }) {
    const res = await apiClient.post<ApiResponse<Employee>>('/employees', payload);
    return res.data.data;
  },

  async update(id: string, payload: Partial<{ name: string; phone: string; role: Role | string; isActive: boolean }>) {
    const res = await apiClient.patch<ApiResponse<Employee>>(`/employees/${id}`, payload);
    return res.data.data;
  },

  async getTasks(id: string, params?: { status?: string; page?: number; limit?: number }) {
    const res = await apiClient.get<
      ApiResponse<{ tasks: Task[]; pagination: PaginationMeta }>
    >(`/employees/${id}/tasks`, { params });
    return res.data.data;
  },
};
