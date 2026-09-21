import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/config/queryKeys';
import { motorService, type RegisterMotorPayload } from '@/services/motor.service';

export const useMotors = (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
  return useQuery({
    queryKey: queryKeys.motors.list(params || {}),
    queryFn: () => motorService.getMotors(params),
  });
};

export const useMotorDetail = (id: string) => {
  return useQuery({
    queryKey: queryKeys.motors.detail(id),
    queryFn: () => motorService.getMotorById(id),
    enabled: Boolean(id),
  });
};

export const useMotorHistory = (motorId: string, page = 1) => {
  return useQuery({
    queryKey: queryKeys.motors.history(motorId),
    queryFn: () => motorService.getMotorHistory(motorId, page),
    enabled: Boolean(motorId),
  });
};

export const useRegisterMotor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegisterMotorPayload) => motorService.registerMotor(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.motors.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
    },
  });
};

export const useUpdateMotor = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<RegisterMotorPayload>) => motorService.updateMotor(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.motors.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.motors.all });
    },
  });
};
