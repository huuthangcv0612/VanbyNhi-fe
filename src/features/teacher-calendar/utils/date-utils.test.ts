import { describe, it, expect } from 'vitest';
import {
  formatDateKey,
  getStartOfWeek,
  getEndOfWeek,
  getWeekDays,
  getMonthGrid,
  toVietnamIsoString,
  isValidHexColor,
  formatTimeVN,
} from './date-utils';
import { layoutDayEvents } from './calendar-layout';
import type { CalendarEvent } from '../types/teacher-calendar.types';

describe('date-utils', () => {
  it('formats date key accurately', () => {
    const d = new Date('2026-10-12T03:00:00Z'); // 10:00 AM VN
    expect(formatDateKey(d)).toBe('2026-10-12');
  });

  it('calculates start and end of week (Monday to Sunday)', () => {
    // 2026-10-14 is a Wednesday
    const wed = new Date(2026, 9, 14);
    const start = getStartOfWeek(wed);
    const end = getEndOfWeek(wed);

    expect(start.getDate()).toBe(12); // Monday
    expect(end.getDate()).toBe(18); // Sunday
  });

  it('generates 7 week days', () => {
    const ref = new Date(2026, 9, 14);
    const days = getWeekDays(ref);
    expect(days).toHaveLength(7);
    expect(days[0].getDate()).toBe(12);
    expect(days[6].getDate()).toBe(18);
  });

  it('generates month grid with complete weeks', () => {
    // October 2026
    const grid = getMonthGrid(2026, 9);
    expect(grid.length % 7).toBe(0);
    expect(grid.length).toBeGreaterThanOrEqual(35);
  });

  it('builds Vietnam ISO 8601 string with +07:00', () => {
    const iso = toVietnamIsoString('2026-10-12', '08:30');
    expect(iso).toBe('2026-10-12T08:30:00+07:00');
  });

  it('validates HEX color accurately', () => {
    expect(isValidHexColor('#4F46E5')).toBe(true);
    expect(isValidHexColor('#fff')).toBe(true);
    expect(isValidHexColor('4F46E5')).toBe(false);
    expect(isValidHexColor('#gggggg')).toBe(false);
    expect(isValidHexColor('')).toBe(false);
  });

  it('formats time in Vietnam timezone', () => {
    const timeStr = formatTimeVN('2026-10-12T08:30:00+07:00');
    expect(timeStr).toBe('08:30');
  });
});

describe('calendar-layout', () => {
  it('allocates side-by-side columns for overlapping events', () => {
    const targetDate = new Date('2026-10-12T00:00:00+07:00');
    const events: CalendarEvent[] = [
      {
        id: '1',
        title: 'Ca 1',
        startAt: '2026-10-12T08:00:00+07:00',
        endAt: '2026-10-12T10:00:00+07:00',
      },
      {
        id: '2',
        title: 'Ca 2 (Trùng)',
        startAt: '2026-10-12T09:00:00+07:00',
        endAt: '2026-10-12T11:00:00+07:00',
      },
    ];

    const positioned = layoutDayEvents(events, targetDate, 6, 22, 60);
    expect(positioned).toHaveLength(2);
    // Both should be in 2 columns (50% width each)
    expect(positioned[0].widthPercent).toBe(50);
    expect(positioned[1].widthPercent).toBe(50);
    // One at left 0%, other at left 50%
    expect(positioned[0].leftPercent).toBe(0);
    expect(positioned[1].leftPercent).toBe(50);
  });

  it('does not split non-overlapping events into multiple columns', () => {
    const targetDate = new Date('2026-10-12T00:00:00+07:00');
    const events: CalendarEvent[] = [
      {
        id: '1',
        title: 'Ca sáng',
        startAt: '2026-10-12T08:00:00+07:00',
        endAt: '2026-10-12T09:30:00+07:00',
      },
      {
        id: '2',
        title: 'Ca chiều',
        startAt: '2026-10-12T14:00:00+07:00',
        endAt: '2026-10-12T16:00:00+07:00',
      },
    ];

    const positioned = layoutDayEvents(events, targetDate, 6, 22, 60);
    expect(positioned).toHaveLength(2);
    expect(positioned[0].widthPercent).toBe(100);
    expect(positioned[1].widthPercent).toBe(100);
  });
});
