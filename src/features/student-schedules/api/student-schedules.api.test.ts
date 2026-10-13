import { describe, it, expect, vi, beforeEach } from 'vitest';
import { studentSchedulesApi } from './student-schedules.api';
import { apiClient } from '@/lib/api-client';
import type { StudentSchedule } from '../types/student-schedule.types';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('studentSchedulesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sampleSchedule: StudentSchedule = {
    id: 'sch-101',
    title: 'Buổi ôn tập Nghị luận xã hội',
    description: 'Chuẩn bị bài tập trước khi vào lớp',
    startAt: '2026-11-10T08:00:00.000Z',
    endAt: '2026-11-10T10:00:00.000Z',
    timezone: 'Asia/Ho_Chi_Minh',
    meetingType: 'ONLINE_MEET',
    meetingUrl: 'https://meet.google.com/example',
    location: 'Phòng học trực tuyến',
    status: 'SCHEDULED',
    teacher: {
      id: 'teacher_id',
      fullName: 'Giáo viên Văn',
      email: 'teacher@example.com',
      phone: '0000000000',
      avatarUrl: null,
    },
    class: {
      id: 'class_id',
      name: 'Lớp Văn 12A',
      classCode: 'VAN12A',
    },
  };

  describe('getSchedules', () => {
    it('sends correct query params to GET /student/schedules', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          total: 1,
          schedules: [sampleSchedule],
          pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
        },
      });

      const result = await studentSchedulesApi.getSchedules({
        from: '2026-11-01T00:00:00.000Z',
        to: '2026-11-30T23:59:59.999Z',
        status: 'SCHEDULED',
        classId: 'class-1',
        page: 1,
        limit: 50,
      });

      expect(apiClient.get).toHaveBeenCalledWith('/student/schedules', {
        params: {
          from: '2026-11-01T00:00:00.000Z',
          to: '2026-11-30T23:59:59.999Z',
          status: 'SCHEDULED',
          classId: 'class-1',
          page: 1,
          limit: 50,
        },
      });
      expect(result.schedules).toHaveLength(1);
      expect(result.schedules[0].id).toBe('sch-101');
      expect(result.pagination?.total).toBe(1);
    });

    it('normalizes direct array response', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: [sampleSchedule],
      });

      const result = await studentSchedulesApi.getSchedules();
      expect(result.schedules).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('normalizes { items: [...] } envelope', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          items: [sampleSchedule],
          total: 1,
        },
      });

      const result = await studentSchedulesApi.getSchedules();
      expect(result.schedules).toHaveLength(1);
      expect(result.schedules[0].title).toBe('Buổi ôn tập Nghị luận xã hội');
    });

    it('normalizes { data: [...] } envelope', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: [sampleSchedule],
          total: 1,
        },
      });

      const result = await studentSchedulesApi.getSchedules();
      expect(result.schedules).toHaveLength(1);
    });
  });

  describe('getAllSchedulesInRange with pagination and deduplication', () => {
    it('fetches multiple pages if totalPages > 1 and combines results', async () => {
      const schedulePage1 = { ...sampleSchedule, id: 'page1-item' };
      const schedulePage2 = { ...sampleSchedule, id: 'page2-item' };

      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({
          data: {
            schedules: [schedulePage1],
            pagination: { total: 2, page: 1, limit: 100, totalPages: 2 },
          },
        })
        .mockResolvedValueOnce({
          data: {
            schedules: [schedulePage2],
            pagination: { total: 2, page: 2, limit: 100, totalPages: 2 },
          },
        });

      const result = await studentSchedulesApi.getAllSchedulesInRange({
        from: '2026-11-01T00:00:00.000Z',
        to: '2026-11-30T23:59:59.999Z',
      });

      expect(apiClient.get).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
      expect(result.map((s) => s.id)).toEqual(['page1-item', 'page2-item']);
    });

    it('deduplicates items appearing from both class and direct assignment', async () => {
      const duplicateSchedule = { ...sampleSchedule, id: 'duplicate-id' };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          schedules: [duplicateSchedule, duplicateSchedule],
          pagination: { total: 2, page: 1, limit: 100, totalPages: 1 },
        },
      });

      const result = await studentSchedulesApi.getAllSchedulesInRange();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('duplicate-id');
    });
  });

  describe('getScheduleById', () => {
    it('fetches schedule details from GET /student/schedules/:id', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: sampleSchedule,
      });

      const result = await studentSchedulesApi.getScheduleById('sch-101');
      expect(apiClient.get).toHaveBeenCalledWith('/student/schedules/sch-101');
      expect(result.id).toBe('sch-101');
      expect(result.meetingType).toBe('ONLINE_MEET');
    });

    it('normalizes { schedule: ... } envelope', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { schedule: sampleSchedule },
      });

      const result = await studentSchedulesApi.getScheduleById('sch-101');
      expect(result.id).toBe('sch-101');
    });

    it('normalizes { data: ... } envelope', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: sampleSchedule },
      });

      const result = await studentSchedulesApi.getScheduleById('sch-101');
      expect(result.id).toBe('sch-101');
    });
  });

  describe('error handling', () => {
    it('propagates API error on network failure or HTTP errors', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network Error'));

      await expect(studentSchedulesApi.getSchedules()).rejects.toThrow('Network Error');
    });

    it('propagates 400/403/404 errors', async () => {
      const error404 = {
        isAxiosError: true,
        response: { status: 404, data: { message: 'Schedule not found' } },
      };
      vi.mocked(apiClient.get).mockRejectedValueOnce(error404);

      await expect(studentSchedulesApi.getScheduleById('invalid-id')).rejects.toEqual(error404);
    });
  });
});
