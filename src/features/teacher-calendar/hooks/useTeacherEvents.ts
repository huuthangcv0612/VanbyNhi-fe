import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherCalendarService } from '../services/teacher-calendar.service';
import type {
  CalendarEvent,
  CreateEventPayload,
  QueryCalendarEventsParams,
  UpdateEventPayload,
} from '../types/teacher-calendar.types';
import { useToast } from '@/hooks/useToast';
import { getApiErrorMessage } from '@/lib/api-client';

export const TEACHER_CALENDAR_KEYS = {
  all: ['teacher-calendar'] as const,
  events: (params?: QueryCalendarEventsParams) =>
    [...TEACHER_CALENDAR_KEYS.all, 'events', params] as const,
  event: (id: string) => [...TEACHER_CALENDAR_KEYS.all, 'event', id] as const,
  labels: () => [...TEACHER_CALENDAR_KEYS.all, 'labels'] as const,
  participants: (eventId: string) =>
    [...TEACHER_CALENDAR_KEYS.all, 'participants', eventId] as const,
};

export function useTeacherEvents(params: QueryCalendarEventsParams) {
  return useQuery<CalendarEvent[]>({
    queryKey: TEACHER_CALENDAR_KEYS.events(params),
    queryFn: () => teacherCalendarService.getEvents(params),
    staleTime: 60 * 1000, // 1 phút
    enabled: Boolean(params.from && params.to),
  });
}

export function useTeacherEventDetail(id?: string) {
  return useQuery<CalendarEvent>({
    queryKey: TEACHER_CALENDAR_KEYS.event(id || ''),
    queryFn: () => teacherCalendarService.getEventById(id!),
    enabled: Boolean(id),
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (payload: CreateEventPayload) => teacherCalendarService.createEvent(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [...TEACHER_CALENDAR_KEYS.all, 'events'] });
      queryClient.invalidateQueries({ queryKey: TEACHER_CALENDAR_KEYS.labels() });

      if (data.hasConflict && data.conflicts && data.conflicts.length > 0) {
        toast.warning(
          `Ca dạy đã được tạo, nhưng có ${data.conflicts.length} ca khác trùng giờ!`,
          'Cảnh báo xung đột thời gian',
        );
      } else {
        toast.success('Đã tạo ca giảng dạy thành công!', 'Thành công');
      }
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error), 'Lỗi tạo ca dạy');
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateEventPayload }) =>
      teacherCalendarService.updateEvent(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [...TEACHER_CALENDAR_KEYS.all, 'events'] });
      queryClient.invalidateQueries({ queryKey: TEACHER_CALENDAR_KEYS.event(variables.id) });
      queryClient.invalidateQueries({ queryKey: TEACHER_CALENDAR_KEYS.labels() });

      if (data.hasConflict && data.conflicts && data.conflicts.length > 0) {
        toast.warning(
          `Cập nhật thành công, nhưng có ${data.conflicts.length} ca khác trùng giờ!`,
          'Cảnh báo xung đột thời gian',
        );
      } else {
        toast.success('Đã cập nhật ca giảng dạy thành công!', 'Thành công');
      }
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error), 'Lỗi cập nhật ca dạy');
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => teacherCalendarService.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...TEACHER_CALENDAR_KEYS.all, 'events'] });
      queryClient.invalidateQueries({ queryKey: TEACHER_CALENDAR_KEYS.labels() });
      toast.success('Đã xóa ca giảng dạy thành công.', 'Đã xóa');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error), 'Lỗi xóa ca dạy');
    },
  });
}
