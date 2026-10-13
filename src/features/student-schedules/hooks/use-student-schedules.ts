import { useQuery } from '@tanstack/react-query';
import { studentSchedulesApi } from '../api/student-schedules.api';
import type {
  QueryStudentSchedulesParams,
  StudentSchedule,
} from '../types/student-schedule.types';

export const STUDENT_SCHEDULES_KEYS = {
  all: ['student-schedules'] as const,
  range: (params: QueryStudentSchedulesParams) =>
    [...STUDENT_SCHEDULES_KEYS.all, 'range', params] as const,
  detail: (id: string) => [...STUDENT_SCHEDULES_KEYS.all, 'detail', id] as const,
};

/**
 * Hook truy vấn toàn bộ lịch học của học sinh trong một khoảng thời gian (from, to)
 */
export function useStudentSchedules(params: QueryStudentSchedulesParams) {
  return useQuery<StudentSchedule[]>({
    queryKey: STUDENT_SCHEDULES_KEYS.range(params),
    queryFn: () => studentSchedulesApi.getAllSchedulesInRange(params),
    staleTime: 60 * 1000, // 1 phút cache
    enabled: Boolean(params.from && params.to),
  });
}

/**
 * Hook xem chi tiết buổi học theo ID
 * GET /student/schedules/:id
 */
export function useStudentScheduleDetail(id?: string) {
  return useQuery<StudentSchedule>({
    queryKey: STUDENT_SCHEDULES_KEYS.detail(id || ''),
    queryFn: () => studentSchedulesApi.getScheduleById(id!),
    enabled: Boolean(id),
  });
}
