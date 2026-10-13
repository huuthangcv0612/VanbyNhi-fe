export type ScheduleStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export type MeetingType = 'ONLINE_MEET' | 'ONLINE_WEB' | 'IN_PERSON';

export interface TeacherInfo {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface ScheduleClass {
  id: string;
  name: string;
  classCode: string;
}

export interface StudentSchedule {
  id: string;
  title: string;
  description?: string | null;
  startAt: string; // ISO 8601
  endAt: string; // ISO 8601
  timezone: string;
  meetingType: MeetingType;
  meetingUrl?: string | null;
  location?: string | null;
  status: ScheduleStatus;
  createdAt?: string;
  updatedAt?: string;
  teacher?: TeacherInfo | null;
  class?: ScheduleClass | null;
}

export interface StudentSchedulePagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StudentSchedulesResponse {
  total: number;
  schedules: StudentSchedule[];
  pagination?: StudentSchedulePagination;
}

export interface QueryStudentSchedulesParams {
  from?: string; // ISO 8601
  to?: string; // ISO 8601
  status?: ScheduleStatus;
  classId?: string;
  page?: number;
  limit?: number;
}

export type ScheduleViewMode = 'month' | 'week' | 'day';

export type ScheduleStatusFilter = 'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED';

export interface PositionedSchedule {
  schedule: StudentSchedule;
  topPx: number;
  heightPx: number;
  leftPercent: number;
  widthPercent: number;
  startMinutes: number;
  endMinutes: number;
}
