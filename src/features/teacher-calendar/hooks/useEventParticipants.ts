import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherCalendarService } from '../services/teacher-calendar.service';
import type { CalendarParticipant } from '../types/teacher-calendar.types';
import { TEACHER_CALENDAR_KEYS } from './useTeacherEvents';
import { useToast } from '@/hooks/useToast';
import { getApiErrorMessage } from '@/lib/api-client';

export function useEventParticipants(eventId?: string) {
  return useQuery<CalendarParticipant[]>({
    queryKey: TEACHER_CALENDAR_KEYS.participants(eventId || ''),
    queryFn: () => teacherCalendarService.getParticipants(eventId!),
    enabled: Boolean(eventId),
  });
}

export function useAddParticipant(eventId: string) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (studentId: string) => teacherCalendarService.addParticipant(eventId, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEACHER_CALENDAR_KEYS.participants(eventId) });
      queryClient.invalidateQueries({ queryKey: TEACHER_CALENDAR_KEYS.event(eventId) });
      queryClient.invalidateQueries({ queryKey: [...TEACHER_CALENDAR_KEYS.all, 'events'] });
      toast.success('Đã thêm học sinh vào ca dạy.', 'Thành công');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error), 'Lỗi thêm học sinh');
    },
  });
}

export function useRemoveParticipant(eventId: string) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (studentId: string) =>
      teacherCalendarService.removeParticipant(eventId, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEACHER_CALENDAR_KEYS.participants(eventId) });
      queryClient.invalidateQueries({ queryKey: TEACHER_CALENDAR_KEYS.event(eventId) });
      queryClient.invalidateQueries({ queryKey: [...TEACHER_CALENDAR_KEYS.all, 'events'] });
      toast.success('Đã loại học sinh khỏi ca dạy.', 'Đã loại học sinh');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error), 'Lỗi loại học sinh');
    },
  });
}
