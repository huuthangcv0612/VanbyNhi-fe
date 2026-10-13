import { describe, it, expect } from 'vitest';
import {
  formatDateKey,
  formatTimeVN,
  formatDateVN,
  formatFullDateVN,
  formatMonthTitleVN,
  formatWeekRangeVN,
  formatDayTitleVN,
  getStartOfWeek,
  getEndOfWeek,
  getWeekDays,
  getMonthGrid,
  getMonthQueryRange,
  getWeekQueryRange,
  getDayQueryRange,
  isScheduleIntersecting,
  isScheduleUpcoming,
  hasScheduleEnded,
  isValidHttpUrl,
  layoutDaySchedules,
  getScheduleStatusMeta,
  getMeetingTypeMeta,
} from './schedule-date.utils';
import type { StudentSchedule } from '../types/student-schedule.types';

describe('schedule-date.utils', () => {
  it('formats date key in Asia/Ho_Chi_Minh', () => {
    const d = new Date('2026-10-12T17:00:00Z'); // 00:00 AM VN ngày 13/10
    expect(formatDateKey(d)).toBe('2026-10-13');
  });

  it('guarantees week starts on Monday and ends on Sunday', () => {
    // 2026-10-14 là Thứ Tư
    const wednesday = new Date(2026, 9, 14);
    const start = getStartOfWeek(wednesday);
    const end = getEndOfWeek(wednesday);

    expect(start.getDay()).toBe(1); // Monday
    expect(end.getDay()).toBe(0); // Sunday
    expect(start.getDate()).toBe(12);
    expect(end.getDate()).toBe(18);
  });

  it('generates 7 days of the week starting from Monday', () => {
    const ref = new Date(2026, 9, 15);
    const days = getWeekDays(ref);

    expect(days).toHaveLength(7);
    expect(days[0].getDay()).toBe(1); // Monday
    expect(days[6].getDay()).toBe(0); // Sunday
  });

  it('generates complete month grid with at least 35 days in 7-column layout', () => {
    const grid = getMonthGrid(2026, 9); // Tháng 10/2026
    expect(grid.length % 7).toBe(0);
    expect(grid.length).toBeGreaterThanOrEqual(35);
    expect(grid[0].getDay()).toBe(1); // Always starts on Monday
  });

  it('computes accurate query ranges with +07:00 timezone', () => {
    const ref = new Date(2026, 9, 14);
    const dayRange = getDayQueryRange(ref);
    expect(dayRange.from).toContain('T00:00:00.000+07:00');
    expect(dayRange.to).toContain('T23:59:59.999+07:00');

    const weekRange = getWeekQueryRange(ref);
    expect(weekRange.from).toBe('2026-10-12T00:00:00.000+07:00');
    expect(weekRange.to).toBe('2026-10-18T23:59:59.999+07:00');

    const monthRange = getMonthQueryRange(ref);
    expect(monthRange.from).toContain('+07:00');
    expect(monthRange.to).toContain('+07:00');
  });

  it('formats Vietnamese date and time strings accurately', () => {
    const iso = '2026-10-13T08:30:00+07:00';
    expect(formatTimeVN(iso)).toBe('08:30');
    expect(formatDateVN(iso)).toBe('13/10/2026');
    expect(formatFullDateVN(iso)).toContain('13/10/2026');
    expect(formatMonthTitleVN(new Date(2026, 9, 1))).toBe('Tháng 10, 2026');
    expect(formatDayTitleVN(new Date(2026, 9, 13))).toContain('tháng 10 năm 2026');
    expect(formatWeekRangeVN(new Date(2026, 9, 13))).toContain('2026');
  });

  it('checks schedule intersection according to contract: startAt <= to && endAt >= from', () => {
    const schedule: StudentSchedule = {
      id: 'sch-1',
      title: 'Văn 12',
      startAt: '2026-10-13T08:00:00.000Z',
      endAt: '2026-10-13T10:00:00.000Z',
      timezone: 'Asia/Ho_Chi_Minh',
      meetingType: 'ONLINE_MEET',
      status: 'SCHEDULED',
    };

    // Range overlapping
    expect(
      isScheduleIntersecting(schedule, '2026-10-13T07:00:00.000Z', '2026-10-13T09:00:00.000Z'),
    ).toBe(true);

    // Range strictly before
    expect(
      isScheduleIntersecting(schedule, '2026-10-13T05:00:00.000Z', '2026-10-13T07:59:00.000Z'),
    ).toBe(false);

    // Range strictly after
    expect(
      isScheduleIntersecting(schedule, '2026-10-13T10:01:00.000Z', '2026-10-13T12:00:00.000Z'),
    ).toBe(false);
  });

  it('validates upcoming and ended schedules accurately', () => {
    const schedule: StudentSchedule = {
      id: 'sch-1',
      title: 'Luyện đề',
      startAt: '2026-10-13T08:00:00.000Z',
      endAt: '2026-10-13T10:00:00.000Z',
      timezone: 'Asia/Ho_Chi_Minh',
      meetingType: 'ONLINE_MEET',
      status: 'SCHEDULED',
    };

    const beforeEnd = new Date('2026-10-13T09:30:00.000Z');
    expect(isScheduleUpcoming(schedule, beforeEnd)).toBe(true);
    expect(hasScheduleEnded(schedule, beforeEnd)).toBe(false);

    const afterEnd = new Date('2026-10-13T10:30:00.000Z');
    expect(isScheduleUpcoming(schedule, afterEnd)).toBe(false);
    expect(hasScheduleEnded(schedule, afterEnd)).toBe(true);

    // Cancelled schedule is never upcoming
    const cancelled: StudentSchedule = { ...schedule, status: 'CANCELLED' };
    expect(isScheduleUpcoming(cancelled, beforeEnd)).toBe(false);
  });

  it('validates HTTP and HTTPS URLs', () => {
    expect(isValidHttpUrl('https://meet.google.com/abc-xyz')).toBe(true);
    expect(isValidHttpUrl('http://example.com/room')).toBe(true);
    expect(isValidHttpUrl('invalid-url')).toBe(false);
    expect(isValidHttpUrl('')).toBe(false);
    expect(isValidHttpUrl(null)).toBe(false);
    expect(isValidHttpUrl(undefined)).toBe(false);
    expect(isValidHttpUrl('javascript:alert(1)')).toBe(false);
  });

  it('provides correct status and meeting type metadata', () => {
    expect(getScheduleStatusMeta('SCHEDULED', true).label).toBe('Sắp diễn ra');
    expect(getScheduleStatusMeta('SCHEDULED', false).label).toBe('Đã lên lịch');
    expect(getScheduleStatusMeta('COMPLETED').label).toBe('Đã hoàn thành');
    expect(getScheduleStatusMeta('CANCELLED').label).toBe('Đã hủy');

    expect(getMeetingTypeMeta('ONLINE_MEET').label).toBe('Google Meet');
    expect(getMeetingTypeMeta('ONLINE_WEB').label).toBe('Phòng học trực tuyến');
    expect(getMeetingTypeMeta('IN_PERSON').label).toBe('Học trực tiếp');
  });

  it('correctly layouts overlapping schedules into adjacent columns', () => {
    const targetDate = new Date('2026-10-13T00:00:00+07:00');
    const schedules: StudentSchedule[] = [
      {
        id: 's1',
        title: 'Buổi 1',
        startAt: '2026-10-13T08:00:00+07:00',
        endAt: '2026-10-13T10:00:00+07:00',
        timezone: 'Asia/Ho_Chi_Minh',
        meetingType: 'ONLINE_MEET',
        status: 'SCHEDULED',
      },
      {
        id: 's2',
        title: 'Buổi 2 trùng giờ',
        startAt: '2026-10-13T09:00:00+07:00',
        endAt: '2026-10-13T11:00:00+07:00',
        timezone: 'Asia/Ho_Chi_Minh',
        meetingType: 'ONLINE_MEET',
        status: 'SCHEDULED',
      },
    ];

    const positioned = layoutDaySchedules(schedules, targetDate);
    expect(positioned).toHaveLength(2);
    expect(positioned[0].widthPercent).toBe(50);
    expect(positioned[1].widthPercent).toBe(50);
    expect(positioned[0].leftPercent).toBe(0);
    expect(positioned[1].leftPercent).toBe(50);
  });
});
