import { useMutation, useQueryClient } from '@tanstack/react-query';
import { studentClassesService } from '../services/classes.service';
import type { StudentCheckInDto, StudentCheckInResponse } from '../types/class.types';
import { getApiErrorMessage } from '@/lib/api-client';
import { useToast } from '@/hooks/useToast';

export function useStudentCheckIn() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<
    StudentCheckInResponse,
    unknown,
    { sessionId: string; dto?: StudentCheckInDto }
  >({
    mutationFn: ({ sessionId, dto }) => studentClassesService.checkIn(sessionId, dto),
    onSuccess: (data, variables) => {
      if (data.alreadyCheckedIn) {
        showToast({
          type: 'info',
          title: 'Đã điểm danh trước đó',
          message: data.message || 'Bạn đã hoàn tất điểm danh cho buổi học này.',
        });
      } else {
        showToast({
          type: 'success',
          title: 'Điểm danh thành công',
          message: data.message || 'Bạn đã xác nhận điểm danh thành công.',
        });
      }

      // Invalidate relevant queries so UI refreshes immediately
      queryClient.invalidateQueries({
        queryKey: ['student-session-detail', variables.sessionId],
      });
      queryClient.invalidateQueries({
        queryKey: ['student-class-sessions'],
      });
      queryClient.invalidateQueries({
        queryKey: ['student-class-detail'],
      });
      queryClient.invalidateQueries({
        queryKey: ['student-classes'],
      });
    },
    onError: (err) => {
      const message = getApiErrorMessage(err);
      showToast({
        type: 'error',
        title: 'Không thể điểm danh',
        message,
      });
    },
  });
}
