import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherCalendarService } from '../services/teacher-calendar.service';
import type {
  CalendarLabel,
  CreateLabelPayload,
  UpdateLabelPayload,
} from '../types/teacher-calendar.types';
import { TEACHER_CALENDAR_KEYS } from './useTeacherEvents';
import { useToast } from '@/hooks/useToast';
import { getApiErrorMessage } from '@/lib/api-client';

export function useTeacherLabels() {
  return useQuery<CalendarLabel[]>({
    queryKey: TEACHER_CALENDAR_KEYS.labels(),
    queryFn: () => teacherCalendarService.getLabels(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateLabel() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (payload: CreateLabelPayload) => teacherCalendarService.createLabel(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEACHER_CALENDAR_KEYS.labels() });
      toast.success('Đã thêm nhãn màu mới thành công!', 'Thành công');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error), 'Lỗi tạo nhãn màu');
    },
  });
}

export function useUpdateLabel() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateLabelPayload }) =>
      teacherCalendarService.updateLabel(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEACHER_CALENDAR_KEYS.labels() });
      queryClient.invalidateQueries({ queryKey: [...TEACHER_CALENDAR_KEYS.all, 'events'] });
      toast.success('Đã cập nhật nhãn màu thành công!', 'Thành công');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error), 'Lỗi cập nhật nhãn');
    },
  });
}

export function useDeleteLabel() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => teacherCalendarService.deleteLabel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEACHER_CALENDAR_KEYS.labels() });
      queryClient.invalidateQueries({ queryKey: [...TEACHER_CALENDAR_KEYS.all, 'events'] });
      toast.success(
        'Đã xóa nhãn màu. Các ca dạy vẫn được giữ lại và chuyển về trạng thái không có nhãn.',
        'Đã xóa nhãn',
      );
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error), 'Lỗi xóa nhãn');
    },
  });
}
