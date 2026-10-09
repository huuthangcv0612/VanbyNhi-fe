import type { ClassStatus, PaginatedResponse } from '@/types/common.types';
import type { User } from '@/types/auth.types';

export interface ClassItem {
  id: string;
  name: string;
  description: string | null;
  classCode: string;
  defaultMeetUrl: string | null;
  monthlyTuition: string | number;
  status: ClassStatus;
  createdById: string;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
  teacher?: User;
  _count?: {
    members: number;
    sessions: number;
  };
}

export interface QueryClassesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ClassStatus;
  teacherId?: string;
}

export interface CreateClassPayload {
  name: string;
  description?: string;
  teacherId: string;
  defaultMeetUrl?: string;
  monthlyTuition?: number;
}

export interface UpdateClassPayload {
  name?: string;
  description?: string;
  teacherId?: string;
  defaultMeetUrl?: string;
  monthlyTuition?: number;
}

export interface UpdateClassStatusPayload {
  status: ClassStatus;
}

export type ClassesListResponse = PaginatedResponse<ClassItem>;
