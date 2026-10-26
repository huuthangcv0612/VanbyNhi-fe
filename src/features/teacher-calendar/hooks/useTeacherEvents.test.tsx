import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCreateEvent, useUpdateEvent, useDeleteEvent } from './useTeacherEvents';
import { teacherCalendarService } from '../services/teacher-calendar.service';

vi.mock('../services/teacher-calendar.service', () => ({
  teacherCalendarService: {
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
    deleteEvent: vi.fn(),
    getEvents: vi.fn(),
    getEventById: vi.fn(),
  },
}));

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
};

vi.mock('@/hooks/useToast', () => ({
  useToast: () => mockToast,
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { Wrapper, queryClient };
}

describe('useTeacherEvents mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useCreateEvent', () => {
    it('creates single event and displays standard success notification', async () => {
      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const mockEvent = {
        id: 'ev-1',
        title: 'Ca một buổi',
        startAt: '2026-10-27T15:00:00+07:00',
        endAt: '2026-10-27T16:30:00+07:00',
        hasConflict: false,
      };
      vi.mocked(teacherCalendarService.createEvent).mockResolvedValueOnce(mockEvent);

      const { result } = renderHook(() => useCreateEvent(), { wrapper: Wrapper });

      await result.current.mutateAsync({
        title: 'Ca một buổi',
        startAt: '2026-10-27T15:00:00+07:00',
        endAt: '2026-10-27T16:30:00+07:00',
      });

      expect(mockToast.success).toHaveBeenCalledWith(
        'Đã tạo ca giảng dạy thành công!',
        'Thành công',
      );
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['teacher-calendar', 'events'],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['student-schedules'],
      });
    });

    it('creates recurring events and displays total occurrences in notification', async () => {
      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const mockRecurringResult = {
        id: 'ev-1',
        title: 'Chuỗi ca dạy',
        startAt: '2026-10-27T15:00:00+07:00',
        endAt: '2026-10-27T16:30:00+07:00',
        totalOccurrences: 5,
        hasConflict: false,
      };
      vi.mocked(teacherCalendarService.createEvent).mockResolvedValueOnce(mockRecurringResult);

      const { result } = renderHook(() => useCreateEvent(), { wrapper: Wrapper });

      await result.current.mutateAsync({
        title: 'Chuỗi ca dạy',
        startAt: '2026-10-27T15:00:00+07:00',
        endAt: '2026-10-27T16:30:00+07:00',
        recurrence: 'WEEKLY_FOR_MONTH',
      });

      expect(mockToast.success).toHaveBeenCalledWith(
        'Đã tạo thành công chuỗi 5 ca giảng dạy (5 buổi)!',
        'Thành công',
      );
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['teacher-calendar', 'events'],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['student-schedules'],
      });
    });

    it('shows warning toast when recurring creation encounters conflicts', async () => {
      const { Wrapper } = createWrapper();

      const mockConflictResult = {
        id: 'ev-1',
        title: 'Chuỗi có xung đột',
        startAt: '2026-10-27T15:00:00+07:00',
        endAt: '2026-10-27T16:30:00+07:00',
        totalOccurrences: 5,
        hasConflict: true,
        conflicts: [
          { id: 'c-1', title: 'Ca trùng', startAt: '2026-11-03T15:00:00+07:00', endAt: '2026-11-03T16:30:00+07:00' },
        ],
      };
      vi.mocked(teacherCalendarService.createEvent).mockResolvedValueOnce(mockConflictResult);

      const { result } = renderHook(() => useCreateEvent(), { wrapper: Wrapper });

      await result.current.mutateAsync({
        title: 'Chuỗi có xung đột',
        startAt: '2026-10-27T15:00:00+07:00',
        endAt: '2026-10-27T16:30:00+07:00',
        recurrence: 'WEEKLY_FOR_MONTH',
      });

      expect(mockToast.warning).toHaveBeenCalledWith(
        'Đã tạo chuỗi 5 ca dạy, nhưng có 1 ca khác trùng giờ!',
        'Cảnh báo xung đột thời gian',
      );
    });
  });

  describe('useUpdateEvent and useDeleteEvent independence', () => {
    it('updateEvent operates strictly on the specific event ID', async () => {
      const { Wrapper } = createWrapper();

      vi.mocked(teacherCalendarService.updateEvent).mockResolvedValueOnce({
        id: 'ev-42',
        title: 'Ca cập nhật',
        startAt: '2026-10-27T15:00:00+07:00',
        endAt: '2026-10-27T16:30:00+07:00',
      });

      const { result } = renderHook(() => useUpdateEvent(), { wrapper: Wrapper });

      await result.current.mutateAsync({
        id: 'ev-42',
        payload: { title: 'Ca cập nhật' },
      });

      expect(teacherCalendarService.updateEvent).toHaveBeenCalledWith('ev-42', {
        title: 'Ca cập nhật',
      });
      expect(mockToast.success).toHaveBeenCalledWith(
        'Đã cập nhật ca giảng dạy thành công!',
        'Thành công',
      );
    });

    it('deleteEvent operates strictly on the specific event ID', async () => {
      const { Wrapper } = createWrapper();

      vi.mocked(teacherCalendarService.deleteEvent).mockResolvedValueOnce({ message: 'Xóa thành công' });

      const { result } = renderHook(() => useDeleteEvent(), { wrapper: Wrapper });

      await result.current.mutateAsync('ev-42');

      expect(teacherCalendarService.deleteEvent).toHaveBeenCalledWith('ev-42');
      expect(mockToast.success).toHaveBeenCalledWith(
        'Đã xóa ca giảng dạy thành công.',
        'Đã xóa',
      );
    });
  });
});
