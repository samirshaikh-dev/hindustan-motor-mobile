export type Role = 'OWNER' | 'EMPLOYEE';

export type JobStatus =
  | 'RECEIVED'
  | 'IN_PROGRESS'
  | 'TESTING'
  | 'READY_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type TaskStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type HistoryAction =
  | 'MOTOR_REGISTERED'
  | 'JOB_CREATED'
  | 'MOTOR_UPDATED'
  | 'JOB_UPDATED'
  | 'JOB_STATUS_CHANGED'
  | 'TASK_CREATED'
  | 'TASK_ASSIGNED'
  | 'TASK_STARTED'
  | 'TASK_COMPLETED'
  | 'TASK_STATUS_CHANGED'
  | 'EMPLOYEE_CREATED'
  | 'EMPLOYEE_UPDATED'
  | 'MOTOR_IMAGE_UPLOADED';

export interface Employee {
  id: string;
  name: string;
  phone: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MotorImage {
  id: string;
  motorId: string;
  publicId: string;
  secureUrl: string;
  resourceType: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
  createdAt: string;
}

export interface Motor {
  id: string;
  motorNumber: string;
  customerName: string;
  customerPhone: string;
  brand?: string | null;
  motorType?: string | null;
  power?: number | null;
  powerUnit: string;
  rpm?: number | null;
  phase?: string | null;
  serialNumber?: string | null;
  complaint?: string | null;
  notes?: string | null;
  receivedAt: string;
  expectedDeliveryAt?: string | null;
  createdAt: string;
  updatedAt: string;
  images?: MotorImage[];
  jobs?: Job[];
  job?: Job;
}

export interface Job {
  id: string;
  jobNumber: string;
  motorId: string;
  status: JobStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  motor?: Motor;
  tasks?: Task[];
  _count?: { tasks: number };
}

export interface Task {
  id: string;
  jobId: string;
  title: string;
  description?: string | null;
  assignedEmployeeId?: string | null;
  status: TaskStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  assignedEmployee?: Employee | null;
  job?: {
    id: string;
    jobNumber: string;
    status: JobStatus;
    motor?: {
      id: string;
      motorNumber: string;
      customerName: string;
      customerPhone?: string;
      brand?: string;
    };
  };
}

export interface HistoryItem {
  id: string;
  motorId?: string | null;
  jobId?: string | null;
  taskId?: string | null;
  actorEmployeeId?: string;
  action: HistoryAction;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  actorEmployee?: {
    id: string;
    name: string;
    role: Role;
  };
}

export interface EmployeeStatusRow extends Employee {
  activeTaskCount?: number;
  activeTasks?: Task[];
}
