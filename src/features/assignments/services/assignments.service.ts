import { apiClient } from '@/lib/api-client';
import type {
  AssignmentItem,
  QueryAssignmentsParams,
  AssignmentsListResponse,
} from '../types/assignment.types';

export const assignmentsService = {
  /**
   * Lấy danh sách bài tập (ADMIN, STUDENT)
   * GET /assignments
   */
  async findAll(params?: QueryAssignmentsParams): Promise<AssignmentsListResponse> {
    const response = await apiClient.get<AssignmentsListResponse>('/assignments', { params });
    return response.data;
  },

  /**
   * Lấy chi tiết bài tập
   * GET /assignments/:id
   */
  async findOne(id: string): Promise<AssignmentItem> {
    const response = await apiClient.get<AssignmentItem>(`/assignments/${id}`);
    return response.data;
  },
};
