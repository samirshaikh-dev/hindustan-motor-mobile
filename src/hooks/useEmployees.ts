import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/config/queryKeys';
import { employeeService } from '@/services/employee.service';

export const useEmployees = (params?: {
  isActive?: boolean;
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: queryKeys.employees.list(params || {}),
    queryFn: () => employeeService.list(params),
  });
};

export const useEmployeeStatusDashboard = () => {
  return useQuery({
    queryKey: queryKeys.employees.statusDashboard,
    queryFn: () => employeeService.getStatusDashboard(),
  });
};

export const useEmployeeDetail = (id: string) => {
  return useQuery({
    queryKey: queryKeys.employees.detail(id),
    queryFn: () => employeeService.getById(id),
    enabled: Boolean(id),
  });
};

export const useEmployeeTasks = (
  id: string,
  params?: { status?: string; page?: number; limit?: number },
) => {
  return useQuery({
    queryKey: queryKeys.employees.tasks(id, params?.status),
    queryFn: () => employeeService.getTasks(id, params),
    enabled: Boolean(id),
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; phone: string; role?: string }) =>
      employeeService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
    },
  });
};

export const useUpdateEmployee = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      payload: Partial<{ name: string; phone: string; role: string; isActive: boolean }>,
    ) => employeeService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
    },
  });
};
