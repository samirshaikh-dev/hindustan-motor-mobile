export const queryKeys = {
  auth: { me: ['auth', 'me'] as const },
  employees: {
    all: ['employees'] as const,
    list: (filters: Record<string, unknown>) => ['employees', 'list', filters] as const,
    statusDashboard: ['employees', 'status'] as const,
    detail: (id: string) => ['employees', 'detail', id] as const,
    tasks: (id: string, status?: string) => ['employees', 'tasks', id, status] as const,
  },
  motors: {
    all: ['motors'] as const,
    list: (params: Record<string, unknown>) => ['motors', 'list', params] as const,
    detail: (id: string) => ['motors', 'detail', id] as const,
    history: (motorId: string) => ['motors', 'history', motorId] as const,
  },
  jobs: {
    all: ['jobs'] as const,
    list: (params: Record<string, unknown>) => ['jobs', 'list', params] as const,
    detail: (id: string) => ['jobs', 'detail', id] as const,
    tasks: (jobId: string) => ['jobs', 'tasks', jobId] as const,
    history: (jobId: string) => ['jobs', 'history', jobId] as const,
  },
  tasks: {
    all: ['tasks'] as const,
    list: (params?: Record<string, unknown>) => ['tasks', 'list', params ?? {}] as const,
    detail: (id: string) => ['tasks', 'detail', id] as const,
  },
  history: {
    all: ['history'] as const,
    list: (params?: Record<string, unknown>) => ['history', 'list', params ?? {}] as const,
  },
  system: {
    health: ['system', 'health'] as const,
  },
};
