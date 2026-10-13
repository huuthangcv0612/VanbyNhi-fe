import { apiClient } from '@/lib/api-client';
import type {
  QueryStudentSchedulesParams,
  StudentSchedule,
  StudentSchedulesResponse,
} from '../types/student-schedule.types';

/**
 * Trích xuất danh sách lịch học từ nhiều định dạng envelope mà Backend có thể trả về
 */
function normalizeSchedulesResponse(data: unknown): StudentSchedule[] {
  if (Array.isArray(data)) {
    return data as StudentSchedule[];
  }
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.schedules)) {
      return record.schedules as StudentSchedule[];
    }
    if (Array.isArray(record.items)) {
      return record.items as StudentSchedule[];
    }
    if (Array.isArray(record.data)) {
      return record.data as StudentSchedule[];
    }
  }
  return [];
}

/**
 * Trích xuất chi tiết lịch học đơn lẻ từ envelope
 */
function normalizeSingleScheduleResponse(data: unknown): StudentSchedule {
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (record.schedule && typeof record.schedule === 'object') {
      return record.schedule as StudentSchedule;
    }
    if (record.data && typeof record.data === 'object' && !Array.isArray(record.data)) {
      return record.data as StudentSchedule;
    }
  }
  return data as StudentSchedule;
}

export const studentSchedulesApi = {
  /**
   * Lấy một trang danh sách lịch học của học sinh
   * GET /student/schedules
   */
  async getSchedules(params: QueryStudentSchedulesParams = {}): Promise<StudentSchedulesResponse> {
    const queryParams: Record<string, unknown> = {};
    if (params.from) queryParams.from = params.from;
    if (params.to) queryParams.to = params.to;
    if (params.status) queryParams.status = params.status;
    if (params.classId) queryParams.classId = params.classId;
    if (params.page !== undefined) queryParams.page = params.page;
    if (params.limit !== undefined) queryParams.limit = params.limit;

    const response = await apiClient.get<unknown>('/student/schedules', {
      params: queryParams,
    });

    const data = response.data as Record<string, unknown> | undefined;
    const schedules = normalizeSchedulesResponse(data);

    const pagination =
      data?.pagination && typeof data.pagination === 'object'
        ? {
            total: Number((data.pagination as Record<string, unknown>).total ?? schedules.length),
            page: Number((data.pagination as Record<string, unknown>).page ?? params.page ?? 1),
            limit: Number((data.pagination as Record<string, unknown>).limit ?? params.limit ?? 20),
            totalPages: Number((data.pagination as Record<string, unknown>).totalPages ?? 1),
          }
        : {
            total: Number(data?.total ?? schedules.length),
            page: Number(params.page ?? 1),
            limit: Number(params.limit ?? 20),
            totalPages: Math.max(
              1,
              Math.ceil(Number(data?.total ?? schedules.length) / Number(params.limit ?? 20)),
            ),
          };

    return {
      total: pagination.total,
      schedules,
      pagination,
    };
  },

  /**
   * Lấy toàn bộ lịch học trong khoảng thời gian (tự động tải tiếp các trang nếu cần thiết)
   * Đồng thời lọc trùng ID nếu một buổi học đồng thời được gán theo lớp và gán trực tiếp.
   */
  async getAllSchedulesInRange(
    params: QueryStudentSchedulesParams = {},
  ): Promise<StudentSchedule[]> {
    const limit = 100; // Tối đa 100 theo hợp đồng
    const firstPage = await this.getSchedules({ ...params, page: 1, limit });

    const allSchedules: StudentSchedule[] = [...firstPage.schedules];
    const totalPages = firstPage.pagination?.totalPages ?? 1;

    // Giới hạn an toàn tối đa 10 trang để tránh vòng lặp ngoài ý muốn
    const maxSafePages = Math.min(totalPages, 10);

    if (totalPages > 1) {
      for (let page = 2; page <= maxSafePages; page++) {
        const nextPage = await this.getSchedules({ ...params, page, limit });
        allSchedules.push(...nextPage.schedules);
        if (nextPage.schedules.length === 0) break;
      }
    }

    // Lọc trùng theo schedule.id
    const uniqueMap = new Map<string, StudentSchedule>();
    for (const schedule of allSchedules) {
      if (!uniqueMap.has(schedule.id)) {
        uniqueMap.set(schedule.id, schedule);
      }
    }

    return Array.from(uniqueMap.values());
  },

  /**
   * Xem chi tiết một buổi học theo ID
   * GET /student/schedules/:id
   */
  async getScheduleById(id: string): Promise<StudentSchedule> {
    const response = await apiClient.get<unknown>(`/student/schedules/${id}`);
    return normalizeSingleScheduleResponse(response.data);
  },
};
