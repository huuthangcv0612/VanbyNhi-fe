import { apiClient } from '@/lib/api-client';
import type {
  ClassItem,
  QueryClassesParams,
  CreateClassPayload,
  UpdateClassPayload,
  UpdateClassStatusPayload,
  ClassesListResponse,
} from '../types/class.types';

export const classesService = {
  /**
   * Danh sách lớp học (ADMIN)
   * GET /classes
   */
  async findAll(params?: QueryClassesParams): Promise<ClassesListResponse> {
    const response = await apiClient.get<ClassesListResponse>('/classes', { params });
    return response.data;
  },

  /**
   * Chi tiết lớp học
   * GET /classes/:id
   */
  async findOne(id: string): Promise<ClassItem> {
    const response = await apiClient.get<ClassItem>(`/classes/${id}`);
    return response.data;
  },

  /**
   * Tạo lớp học mới (ADMIN)
   * POST /classes
   */
  async create(payload: CreateClassPayload): Promise<ClassItem> {
    const response = await apiClient.post<ClassItem>('/classes', payload);
    return response.data;
  },

  /**
   * Cập nhật thông tin lớp học (ADMIN)
   * PATCH /classes/:id
   */
  async update(id: string, payload: UpdateClassPayload): Promise<ClassItem> {
    const response = await apiClient.patch<ClassItem>(`/classes/${id}`, payload);
    return response.data;
  },

  /**
   * Cập nhật trạng thái lớp học (ADMIN)
   * PATCH /classes/:id/status
   */
  async updateStatus(id: string, payload: UpdateClassStatusPayload): Promise<ClassItem> {
    const response = await apiClient.patch<ClassItem>(`/classes/${id}/status`, payload);
    return response.data;
  },
};
