import { apiClient } from '@/lib/api-client';
import type {
  CalendarEvent,
  CalendarLabel,
  CalendarParticipant,
  CreateEventPayload,
  CreateLabelPayload,
  QueryCalendarEventsParams,
  StudentOption,
  UpdateEventPayload,
  UpdateLabelPayload,
} from '../types/teacher-calendar.types';
import type { UsersListResponse } from '@/features/users/types/user.types';

/**
 * Trích xuất mảng sự kiện từ nhiều dạng envelope Backend có thể trả về
 */
function normalizeEventsResponse(data: unknown): CalendarEvent[] {
  if (Array.isArray(data)) {
    return data as CalendarEvent[];
  }
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.events)) {
      return record.events as CalendarEvent[];
    }
    if (Array.isArray(record.items)) {
      return record.items as CalendarEvent[];
    }
    if (Array.isArray(record.data)) {
      return record.data as CalendarEvent[];
    }
  }
  return [];
}

/**
 * Trích xuất mảng nhãn từ nhiều dạng envelope Backend có thể trả về
 */
function normalizeLabelsResponse(data: unknown): CalendarLabel[] {
  if (Array.isArray(data)) {
    return data as CalendarLabel[];
  }
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.labels)) {
      return record.labels as CalendarLabel[];
    }
    if (Array.isArray(record.items)) {
      return record.items as CalendarLabel[];
    }
    if (Array.isArray(record.data)) {
      return record.data as CalendarLabel[];
    }
  }
  return [];
}

/**
 * Trích xuất mảng người tham gia từ nhiều dạng envelope
 */
function normalizeParticipantsResponse(data: unknown): CalendarParticipant[] {
  if (Array.isArray(data)) {
    return data as CalendarParticipant[];
  }
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.participants)) {
      return record.participants as CalendarParticipant[];
    }
    if (Array.isArray(record.items)) {
      return record.items as CalendarParticipant[];
    }
    if (Array.isArray(record.data)) {
      return record.data as CalendarParticipant[];
    }
  }
  return [];
}

export const teacherCalendarService = {
  // ===================== EVENTS =====================

  /**
   * Lấy danh sách sự kiện lịch giảng dạy trong khoảng thời gian
   * GET /teacher-calendar/events?from=<ISO>&to=<ISO>&labelId=<ID>
   */
  async getEvents(params: QueryCalendarEventsParams): Promise<CalendarEvent[]> {
    const response = await apiClient.get<unknown>('/teacher-calendar/events', {
      params: {
        from: params.from,
        to: params.to,
        ...(params.labelId ? { labelId: params.labelId } : {}),
      },
    });
    return normalizeEventsResponse(response.data);
  },

  /**
   * Chi tiết ca dạy theo ID
   * GET /teacher-calendar/events/:id
   */
  async getEventById(id: string): Promise<CalendarEvent> {
    const response = await apiClient.get<CalendarEvent | { event: CalendarEvent }>(
      `/teacher-calendar/events/${id}`,
    );
    if (response.data && typeof response.data === 'object' && 'event' in response.data) {
      return (response.data as { event: CalendarEvent }).event;
    }
    return response.data as CalendarEvent;
  },

  /**
   * Tạo ca dạy mới
   * POST /teacher-calendar/events
   */
  async createEvent(payload: CreateEventPayload): Promise<CalendarEvent> {
    const cleanPayload: Record<string, unknown> = {
      title: payload.title,
      startAt: payload.startAt,
      endAt: payload.endAt,
    };
    if (payload.address !== undefined) cleanPayload.address = payload.address;
    if (payload.meetUrl !== undefined) cleanPayload.meetUrl = payload.meetUrl;
    if (payload.labelId !== undefined) cleanPayload.labelId = payload.labelId;
    if (payload.reminderMinutes !== undefined)
      cleanPayload.reminderMinutes = payload.reminderMinutes;
    if (payload.note !== undefined) cleanPayload.note = payload.note;
    if (payload.studentIds !== undefined && payload.studentIds.length > 0)
      cleanPayload.studentIds = payload.studentIds;

    const response = await apiClient.post<CalendarEvent | { event: CalendarEvent }>(
      '/teacher-calendar/events',
      cleanPayload,
    );
    if (response.data && typeof response.data === 'object' && 'event' in response.data) {
      return (response.data as { event: CalendarEvent }).event;
    }
    return response.data as CalendarEvent;
  },

  /**
   * Cập nhật ca dạy
   * PATCH /teacher-calendar/events/:id
   */
  async updateEvent(id: string, payload: UpdateEventPayload): Promise<CalendarEvent> {
    const cleanPayload: Record<string, unknown> = {};
    if (payload.title !== undefined) cleanPayload.title = payload.title;
    if (payload.address !== undefined) cleanPayload.address = payload.address;
    if (payload.meetUrl !== undefined) cleanPayload.meetUrl = payload.meetUrl;
    if (payload.startAt !== undefined) cleanPayload.startAt = payload.startAt;
    if (payload.endAt !== undefined) cleanPayload.endAt = payload.endAt;
    if (payload.labelId !== undefined) cleanPayload.labelId = payload.labelId;
    if (payload.reminderMinutes !== undefined)
      cleanPayload.reminderMinutes = payload.reminderMinutes;
    if (payload.note !== undefined) cleanPayload.note = payload.note;

    const response = await apiClient.patch<CalendarEvent | { event: CalendarEvent }>(
      `/teacher-calendar/events/${id}`,
      cleanPayload,
    );
    if (response.data && typeof response.data === 'object' && 'event' in response.data) {
      return (response.data as { event: CalendarEvent }).event;
    }
    return response.data as CalendarEvent;
  },

  /**
   * Xóa ca dạy
   * DELETE /teacher-calendar/events/:id
   */
  async deleteEvent(id: string): Promise<{ message?: string }> {
    const response = await apiClient.delete<{ message?: string }>(
      `/teacher-calendar/events/${id}`,
    );
    return response.data;
  },

  // ===================== LABELS =====================

  /**
   * Danh sách nhãn màu cá nhân của giáo viên
   * GET /teacher-calendar/labels
   */
  async getLabels(): Promise<CalendarLabel[]> {
    const response = await apiClient.get<unknown>('/teacher-calendar/labels');
    return normalizeLabelsResponse(response.data);
  },

  /**
   * Tạo nhãn màu mới
   * POST /teacher-calendar/labels
   */
  async createLabel(payload: CreateLabelPayload): Promise<CalendarLabel> {
    const response = await apiClient.post<CalendarLabel | { label: CalendarLabel }>(
      '/teacher-calendar/labels',
      payload,
    );
    if (response.data && typeof response.data === 'object' && 'label' in response.data) {
      return (response.data as { label: CalendarLabel }).label;
    }
    return response.data as CalendarLabel;
  },

  /**
   * Cập nhật nhãn màu
   * PATCH /teacher-calendar/labels/:id
   */
  async updateLabel(id: string, payload: UpdateLabelPayload): Promise<CalendarLabel> {
    const response = await apiClient.patch<CalendarLabel | { label: CalendarLabel }>(
      `/teacher-calendar/labels/${id}`,
      payload,
    );
    if (response.data && typeof response.data === 'object' && 'label' in response.data) {
      return (response.data as { label: CalendarLabel }).label;
    }
    return response.data as CalendarLabel;
  },

  /**
   * Xóa nhãn màu
   * DELETE /teacher-calendar/labels/:id
   */
  async deleteLabel(id: string): Promise<{ message?: string }> {
    const response = await apiClient.delete<{ message?: string }>(
      `/teacher-calendar/labels/${id}`,
    );
    return response.data;
  },

  // ===================== PARTICIPANTS =====================

  /**
   * Lấy danh sách học sinh tham gia ca dạy
   * GET /teacher-calendar/events/:id/participants
   */
  async getParticipants(eventId: string): Promise<CalendarParticipant[]> {
    const response = await apiClient.get<unknown>(
      `/teacher-calendar/events/${eventId}/participants`,
    );
    return normalizeParticipantsResponse(response.data);
  },

  /**
   * Thêm học sinh vào ca dạy
   * POST /teacher-calendar/events/:id/participants
   */
  async addParticipant(eventId: string, studentId: string): Promise<CalendarParticipant> {
    const response = await apiClient.post<CalendarParticipant>(
      `/teacher-calendar/events/${eventId}/participants`,
      { studentId },
    );
    return response.data;
  },

  /**
   * Xóa học sinh khỏi ca dạy
   * DELETE /teacher-calendar/events/:id/participants/:studentId
   */
  async removeParticipant(eventId: string, studentId: string): Promise<{ message?: string }> {
    const response = await apiClient.delete<{ message?: string }>(
      `/teacher-calendar/events/${eventId}/participants/${studentId}`,
    );
    return response.data;
  },

  // ===================== STUDENT SEARCH =====================

  /**
   * Tìm kiếm học sinh thực tế qua hệ thống (kiểm tra quyền và nguồn dữ liệu)
   * Sử dụng GET /users?role=STUDENT&search=...
   */
  async searchStudents(query?: string): Promise<{
    students: StudentOption[];
    isAvailable: boolean;
    errorNote?: string;
  }> {
    try {
      const response = await apiClient.get<UsersListResponse>('/users', {
        params: {
          role: 'STUDENT',
          search: query || undefined,
          limit: 30,
        },
      });

      const users = response.data?.items || [];
      const students: StudentOption[] = users.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        avatarUrl: u.avatarUrl,
      }));

      return { students, isAvailable: true };
    } catch (err: unknown) {
      // Báo cáo chi tiết nếu backend không cấp quyền hoặc endpoint chưa có cho vai trò TEACHER
      const isForbidden =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        (err as { response?: { status?: number } }).response?.status === 403;

      return {
        students: [],
        isAvailable: false,
        errorNote: isForbidden
          ? 'Tài khoản Giáo viên hiện chưa được cấp quyền gọi GET /users để tìm kiếm danh sách học sinh. Cần bổ sung endpoint tìm kiếm học sinh dành riêng cho giáo viên (ví dụ GET /teacher-calendar/students hoặc mở quyền GET /users?role=STUDENT).'
          : 'Không thể kết nối đến nguồn dữ liệu học sinh.',
      };
    }
  },

  // ===================== STUDENT CALENDAR (REUSABLE) =====================

  /**
   * Lấy lịch sự kiện của học sinh (phục vụ tái sử dụng khi phát triển giao diện học sinh sau này)
   * GET /student-calendar/events?from=<ISO>&to=<ISO>
   */
  async getStudentEvents(params: { from: string; to: string }): Promise<CalendarEvent[]> {
    const response = await apiClient.get<unknown>('/student-calendar/events', {
      params,
    });
    return normalizeEventsResponse(response.data);
  },

  /**
   * Lấy chi tiết sự kiện của học sinh
   * GET /student-calendar/events/:id
   */
  async getStudentEventById(id: string): Promise<CalendarEvent> {
    const response = await apiClient.get<CalendarEvent>(`/student-calendar/events/${id}`);
    return response.data;
  },
};
