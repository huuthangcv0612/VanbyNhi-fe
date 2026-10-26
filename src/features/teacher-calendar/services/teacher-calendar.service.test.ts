import { describe, it, expect, vi, beforeEach } from 'vitest';
import { teacherCalendarService } from './teacher-calendar.service';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('teacherCalendarService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEvents', () => {
    it('normalizes array response directly', async () => {
      const mockEvents = [
        { id: '1', title: 'Ca 1', startAt: '2026-10-12T08:00:00Z', endAt: '2026-10-12T10:00:00Z' },
      ];
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockEvents });

      const result = await teacherCalendarService.getEvents({
        from: '2026-10-12T00:00:00Z',
        to: '2026-10-18T23:59:59Z',
      });

      expect(result).toEqual(mockEvents);
      expect(apiClient.get).toHaveBeenCalledWith('/teacher-calendar/events', {
        params: { from: '2026-10-12T00:00:00Z', to: '2026-10-18T23:59:59Z' },
      });
    });

    it('normalizes { events: [...] } envelope', async () => {
      const mockEvents = [{ id: '2', title: 'Ca 2' }];
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { events: mockEvents, total: 1 } });

      const result = await teacherCalendarService.getEvents({
        from: '2026-10-12T00:00:00Z',
        to: '2026-10-18T23:59:59Z',
      });

      expect(result).toEqual(mockEvents);
    });

    it('normalizes { items: [...] } envelope', async () => {
      const mockEvents = [{ id: '3', title: 'Ca 3' }];
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { items: mockEvents } });

      const result = await teacherCalendarService.getEvents({
        from: '2026-10-12T00:00:00Z',
        to: '2026-10-18T23:59:59Z',
      });

      expect(result).toEqual(mockEvents);
    });
  });

  describe('labels', () => {
    it('normalizes { labels: [...] } envelope', async () => {
      const mockLabels = [{ id: 'l1', name: 'Lớp 12A1', color: '#4F46E5' }];
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { labels: mockLabels } });

      const result = await teacherCalendarService.getLabels();
      expect(result).toEqual(mockLabels);
      expect(apiClient.get).toHaveBeenCalledWith('/teacher-calendar/labels');
    });

    it('creates a new label', async () => {
      const payload = { name: 'Ôn thi THPT', color: '#10B981' };
      const created = { id: 'l2', ...payload };
      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: created });

      const result = await teacherCalendarService.createLabel(payload);
      expect(result).toEqual(created);
      expect(apiClient.post).toHaveBeenCalledWith('/teacher-calendar/labels', payload);
    });
  });

  describe('participants', () => {
    it('adds participant to event', async () => {
      const participant = { id: 'p1', studentId: 's1' };
      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: participant });

      const result = await teacherCalendarService.addParticipant('ev-1', 's1');
      expect(result).toEqual(participant);
      expect(apiClient.post).toHaveBeenCalledWith('/teacher-calendar/events/ev-1/participants', {
        studentId: 's1',
      });
    });

    it('removes participant from event', async () => {
      vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: { message: 'Removed' } });

      const result = await teacherCalendarService.removeParticipant('ev-1', 's1');
      expect(result).toEqual({ message: 'Removed' });
      expect(apiClient.delete).toHaveBeenCalledWith(
        '/teacher-calendar/events/ev-1/participants/s1',
      );
    });
  });

  describe('createEvent and updateEvent with reminderMinutes', () => {
    it('sends reminderMinutes and note when creating an event', async () => {
      const payload = {
        title: 'Ca văn 12',
        startAt: '2026-10-12T08:00:00+07:00',
        endAt: '2026-10-12T10:00:00+07:00',
        reminderMinutes: 30,
        note: 'Chuẩn bị bài thơ Tây Tiến',
        studentIds: ['s1'],
      };
      const created = { id: 'ev-new', ...payload };
      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: created });

      const result = await teacherCalendarService.createEvent(payload);
      expect(result).toEqual(created);
      expect(apiClient.post).toHaveBeenCalledWith('/teacher-calendar/events', {
        title: 'Ca văn 12',
        startAt: '2026-10-12T08:00:00+07:00',
        endAt: '2026-10-12T10:00:00+07:00',
        reminderMinutes: 30,
        note: 'Chuẩn bị bài thơ Tây Tiến',
        studentIds: ['s1'],
      });
    });

    it('sends reminderMinutes null when clearing reminder on update', async () => {
      const payload = {
        title: 'Ca văn 12 (đã cập nhật)',
        reminderMinutes: null,
        note: null,
      };
      const updated = { id: 'ev-1', ...payload };
      vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: updated });

      const result = await teacherCalendarService.updateEvent('ev-1', payload);
      expect(result).toEqual(updated);
      expect(apiClient.patch).toHaveBeenCalledWith('/teacher-calendar/events/ev-1', {
        title: 'Ca văn 12 (đã cập nhật)',
        reminderMinutes: null,
        note: null,
      });
    });

    it('does NOT send recurrence in payload when recurrence is NONE or undefined', async () => {
      const payload = {
        title: 'Ca văn 12',
        startAt: '2026-10-27T15:00:00+07:00',
        endAt: '2026-10-27T16:30:00+07:00',
        recurrence: 'NONE' as const,
      };
      const created = { id: 'ev-1', title: payload.title, startAt: payload.startAt, endAt: payload.endAt };
      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { event: created } });

      await teacherCalendarService.createEvent(payload);

      expect(apiClient.post).toHaveBeenCalledWith('/teacher-calendar/events', {
        title: 'Ca văn 12',
        startAt: '2026-10-27T15:00:00+07:00',
        endAt: '2026-10-27T16:30:00+07:00',
      });
    });

    it('sends recurrence WEEKLY_FOR_MONTH and extracts recurring response properly', async () => {
      const payload = {
        title: 'Ca văn định kỳ tháng 11',
        startAt: '2026-10-27T15:00:00+07:00',
        endAt: '2026-10-27T16:30:00+07:00',
        recurrence: 'WEEKLY_FOR_MONTH' as const,
      };

      const mockEvents = [
        { id: 'ev-1', title: payload.title, startAt: '2026-10-27T15:00:00+07:00', endAt: '2026-10-27T16:30:00+07:00' },
        { id: 'ev-2', title: payload.title, startAt: '2026-11-03T15:00:00+07:00', endAt: '2026-11-03T16:30:00+07:00' },
        { id: 'ev-3', title: payload.title, startAt: '2026-11-10T15:00:00+07:00', endAt: '2026-11-10T16:30:00+07:00' },
        { id: 'ev-4', title: payload.title, startAt: '2026-11-17T15:00:00+07:00', endAt: '2026-11-17T16:30:00+07:00' },
        { id: 'ev-5', title: payload.title, startAt: '2026-11-24T15:00:00+07:00', endAt: '2026-11-24T16:30:00+07:00' },
      ];

      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          message: 'Tạo chuỗi ca dạy lặp lại thành công',
          event: mockEvents[0],
          events: mockEvents,
          totalOccurrences: 5,
          hasConflict: true,
          conflicts: [{ id: 'conflict-1', title: 'Ca trùng', startAt: '2026-11-03T15:30:00+07:00', endAt: '2026-11-03T16:30:00+07:00' }],
        },
      });

      const result = await teacherCalendarService.createEvent(payload);

      expect(apiClient.post).toHaveBeenCalledWith('/teacher-calendar/events', {
        title: 'Ca văn định kỳ tháng 11',
        startAt: '2026-10-27T15:00:00+07:00',
        endAt: '2026-10-27T16:30:00+07:00',
        recurrence: 'WEEKLY_FOR_MONTH',
      });

      expect(result.id).toBe('ev-1');
      expect(result.events).toHaveLength(5);
      expect(result.totalOccurrences).toBe(5);
      expect(result.hasConflict).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts?.[0].title).toBe('Ca trùng');
    });
  });
});
