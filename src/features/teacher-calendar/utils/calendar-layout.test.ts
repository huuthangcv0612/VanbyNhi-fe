import { describe, it, expect } from 'vitest';
import {
  CALENDAR_START_HOUR,
  CALENDAR_END_HOUR,
  HOUR_HEIGHT_PX,
  getMinutesFromMidnightVN,
  layoutDayEvents,
} from './calendar-layout';
import type { CalendarEvent } from '../types/teacher-calendar.types';

describe('calendar-layout - 24-hour range (00:00 - 24:00)', () => {
  it('defines CALENDAR_START_HOUR as 0 and CALENDAR_END_HOUR as 24', () => {
    expect(CALENDAR_START_HOUR).toBe(0);
    expect(CALENDAR_END_HOUR).toBe(24);
    expect(CALENDAR_END_HOUR - CALENDAR_START_HOUR).toBe(24);
  });

  describe('getMinutesFromMidnightVN', () => {
    it('returns 0 for midnight (00:00)', () => {
      expect(getMinutesFromMidnightVN('2026-10-27T00:00:00+07:00')).toBe(0);
    });

    it('returns 360 for 06:00', () => {
      expect(getMinutesFromMidnightVN('2026-10-27T06:00:00+07:00')).toBe(360);
    });

    it('returns 720 for 12:00 noon', () => {
      expect(getMinutesFromMidnightVN('2026-10-27T12:00:00+07:00')).toBe(720);
    });

    it('returns 1410 for 23:30', () => {
      expect(getMinutesFromMidnightVN('2026-10-27T23:30:00+07:00')).toBe(1410);
    });
  });

  describe('layoutDayEvents', () => {
    const targetDate = new Date('2026-10-27T00:00:00+07:00');

    it('returns empty array when there are no events', () => {
      expect(layoutDayEvents([], targetDate)).toEqual([]);
    });

    it('ignores events from other days', () => {
      const otherDayEvent: CalendarEvent = {
        id: 'ev-other',
        title: 'Ca ngày khác',
        startAt: '2026-10-28T09:00:00+07:00',
        endAt: '2026-10-28T11:00:00+07:00',
      };
      expect(layoutDayEvents([otherDayEvent], targetDate)).toEqual([]);
    });

    it('positions early morning event starting at 00:00 correctly at the very top (0px)', () => {
      const earlyEvent: CalendarEvent = {
        id: 'ev-midnight',
        title: 'Ca trực đêm / sáng sớm',
        startAt: '2026-10-27T00:00:00+07:00',
        endAt: '2026-10-27T01:30:00+07:00', // 90 minutes
      };

      const positioned = layoutDayEvents([earlyEvent], targetDate);
      expect(positioned).toHaveLength(1);
      expect(positioned[0].topPx).toBe(0); // 00:00 -> top 0px
      expect(positioned[0].heightPx).toBe(96); // 1.5 hours * 64px = 96px
      expect(positioned[0].startMinutes).toBe(0);
      expect(positioned[0].endMinutes).toBe(90);
    });

    it('positions afternoon event accurately according to hour height', () => {
      const afternoonEvent: CalendarEvent = {
        id: 'ev-afternoon',
        title: 'Luyện thi Ngữ Văn 12',
        startAt: '2026-10-27T14:00:00+07:00',
        endAt: '2026-10-27T16:00:00+07:00', // 2 hours
      };

      const positioned = layoutDayEvents([afternoonEvent], targetDate);
      expect(positioned).toHaveLength(1);
      expect(positioned[0].topPx).toBe(14 * HOUR_HEIGHT_PX); // 14 * 64 = 896px
      expect(positioned[0].heightPx).toBe(2 * HOUR_HEIGHT_PX); // 128px
      expect(positioned[0].startMinutes).toBe(14 * 60);
      expect(positioned[0].endMinutes).toBe(16 * 60);
    });

    it('handles late evening event ending at midnight / 24:00 (end of day boundary)', () => {
      const lateEvent: CalendarEvent = {
        id: 'ev-late',
        title: 'Ôn tập đêm khuya',
        startAt: '2026-10-27T22:00:00+07:00',
        endAt: '2026-10-28T00:00:00+07:00', // Ends at midnight of next day
      };

      const positioned = layoutDayEvents([lateEvent], targetDate);
      expect(positioned).toHaveLength(1);
      expect(positioned[0].topPx).toBe(22 * HOUR_HEIGHT_PX); // 22 * 64 = 1408px
      // 22:00 to 24:00 is 2 hours = 128px. Reaches 1536px (total 24h height)
      expect(positioned[0].heightPx).toBe(2 * HOUR_HEIGHT_PX);
      expect(positioned[0].endMinutes).toBe(24 * 60); // 1440
    });

    it('handles overlapping events in 24h grid by dividing columns properly', () => {
      const eventA: CalendarEvent = {
        id: 'ev-a',
        title: 'Lớp 10A',
        startAt: '2026-10-27T08:00:00+07:00',
        endAt: '2026-10-27T10:00:00+07:00',
      };
      const eventB: CalendarEvent = {
        id: 'ev-b',
        title: 'Lớp 11B',
        startAt: '2026-10-27T09:00:00+07:00',
        endAt: '2026-10-27T11:00:00+07:00',
      };

      const positioned = layoutDayEvents([eventA, eventB], targetDate);
      expect(positioned).toHaveLength(2);
      expect(positioned[0].widthPercent).toBe(50);
      expect(positioned[1].widthPercent).toBe(50);
      expect(positioned[0].leftPercent).toBe(0);
      expect(positioned[1].leftPercent).toBe(50);
    });
  });
});
