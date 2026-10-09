import type { AssignmentStatus, PaginatedResponse } from '@/types/common.types';

export interface AssignmentItem {
  id: string;
  classId: string;
  sessionId: string | null;
  title: string;
  description: string | null;
  fileUrls: string[];
  dueDate: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  class?: {
    id: string;
    name: string;
    classCode: string;
  };
  submissions?: Array<{
    id: string;
    studentId: string;
    status: AssignmentStatus;
    score: number | null;
  }>;
}

export interface QueryAssignmentsParams {
  page?: number;
  limit?: number;
  classId?: string;
  sessionId?: string;
}

export type AssignmentsListResponse = PaginatedResponse<AssignmentItem>;
