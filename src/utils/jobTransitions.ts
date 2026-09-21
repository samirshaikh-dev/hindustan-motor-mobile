import type { JobStatus } from '@/types/domain';

const TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  RECEIVED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['TESTING', 'READY_FOR_DELIVERY', 'CANCELLED'],
  TESTING: ['IN_PROGRESS', 'READY_FOR_DELIVERY', 'CANCELLED'],
  READY_FOR_DELIVERY: ['DELIVERED', 'IN_PROGRESS', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: ['RECEIVED', 'IN_PROGRESS'],
};

export function getNextJobStatuses(current: JobStatus): JobStatus[] {
  return TRANSITIONS[current] ?? [];
}
