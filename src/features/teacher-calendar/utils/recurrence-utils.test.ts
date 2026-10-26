import { describe, it, expect } from 'vitest';
import {
  isLeapYear,
  getDaysInMonth,
  calculateMonthEndCutoff,
  generateWeeklyMonthlyOccurrences,
  getWeeklyRecurrencePreview,
  getDateTimeParts,
} from './recurrence-utils';
import { toVietnamIsoString } from './date-utils';

describe('recurrence-utils', () => {
  describe('isLeapYear', () => {
    it('correctly identifies leap years and non-leap years', () => {
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2028)).toBe(true);
      expect(isLeapYear(2000)).toBe(true);
      expect(isLeapYear(2026)).toBe(false);
      expect(isLeapYear(2025)).toBe(false);
      expect(isLeapYear(1900)).toBe(false);
      expect(isLeapYear(2100)).toBe(false);
    });
  });

  describe('getDaysInMonth', () => {
    it('returns 31 for months with 31 days', () => {
      [1, 3, 5, 7, 8, 10, 12].forEach((m) => {
        expect(getDaysInMonth(2026, m)).toBe(31);
      });
    });

    it('returns 30 for months with 30 days', () => {
      [4, 6, 9, 11].forEach((m) => {
        expect(getDaysInMonth(2026, m)).toBe(30);
      });
    });

    it('returns 28 for February in non-leap year and 29 in leap year', () => {
      expect(getDaysInMonth(2026, 2)).toBe(28);
      expect(getDaysInMonth(2024, 2)).toBe(29);
      expect(getDaysInMonth(2028, 2)).toBe(29);
    });

    it('throws error for invalid month', () => {
      expect(() => getDaysInMonth(2026, 0)).toThrow('Tháng không hợp lệ: 0');
      expect(() => getDaysInMonth(2026, 13)).toThrow('Tháng không hợp lệ: 13');
    });
  });

  describe('calculateMonthEndCutoff', () => {
    it('adds 1 month properly in standard months', () => {
      const start = new Date(toVietnamIsoString('2026-03-15', '09:00'));
      const cutoff = calculateMonthEndCutoff(start);
      const parts = getDateTimeParts(cutoff);
      expect(parts.year).toBe(2026);
      expect(parts.month).toBe(4);
      expect(parts.day).toBe(15);
      expect(parts.hour).toBe(9);
      expect(parts.minute).toBe(0);
    });

    it('caps day at 28 for Jan 31 in a non-leap year (2026)', () => {
      const start = new Date(toVietnamIsoString('2026-01-31', '10:00'));
      const cutoff = calculateMonthEndCutoff(start);
      const parts = getDateTimeParts(cutoff);
      expect(parts.year).toBe(2026);
      expect(parts.month).toBe(2);
      expect(parts.day).toBe(28);
      expect(parts.hour).toBe(10);
    });

    it('caps day at 29 for Jan 31 in a leap year (2028)', () => {
      const start = new Date(toVietnamIsoString('2028-01-31', '10:00'));
      const cutoff = calculateMonthEndCutoff(start);
      const parts = getDateTimeParts(cutoff);
      expect(parts.year).toBe(2028);
      expect(parts.month).toBe(2);
      expect(parts.day).toBe(29);
      expect(parts.hour).toBe(10);
    });

    it('caps day at 30 for March 31 -> April 30', () => {
      const start = new Date(toVietnamIsoString('2026-03-31', '14:30'));
      const cutoff = calculateMonthEndCutoff(start);
      const parts = getDateTimeParts(cutoff);
      expect(parts.year).toBe(2026);
      expect(parts.month).toBe(4);
      expect(parts.day).toBe(30);
      expect(parts.hour).toBe(14);
      expect(parts.minute).toBe(30);
    });

    it('handles year transition from December to January', () => {
      const start = new Date(toVietnamIsoString('2026-12-25', '16:00'));
      const cutoff = calculateMonthEndCutoff(start);
      const parts = getDateTimeParts(cutoff);
      expect(parts.year).toBe(2027);
      expect(parts.month).toBe(1);
      expect(parts.day).toBe(25);
      expect(parts.hour).toBe(16);
    });
  });

  describe('generateWeeklyMonthlyOccurrences', () => {
    it('creates exactly 5 occurrences for 27/10/2026 up to 24/11/2026 as per user requirement', () => {
      const start = new Date(toVietnamIsoString('2026-10-27', '15:00'));
      const end = new Date(toVietnamIsoString('2026-10-27', '16:30'));

      const occurrences = generateWeeklyMonthlyOccurrences(start, end);

      expect(occurrences).toHaveLength(5);
      expect(occurrences.map((o) => o.dateKey)).toEqual([
        '2026-10-27',
        '2026-11-03',
        '2026-11-10',
        '2026-11-17',
        '2026-11-24',
      ]);

      // All occurrences must preserve time 15:00 - 16:30
      occurrences.forEach((occ) => {
        expect(occ.timeRange).toBe('15:00 – 16:30');
      });

      // Cutoff is 2026-11-27 15:00. The next potential session would be 2026-12-01, which is >= cutoff.
      expect(occurrences[0].dateFormatted).toContain('Thứ Ba');
      expect(occurrences[4].dateFormatted).toContain('Thứ Ba');
    });

    it('includes start date and strictly excludes cutoff date', () => {
      // Starting on 2026-05-01 08:00 -> cutoff is 2026-06-01 08:00
      // 01/05 (Fri), 08/05 (Fri), 15/05 (Fri), 22/05 (Fri), 29/05 (Fri) -> 5 occurrences
      // 05/06 would be > cutoff
      const start = new Date(toVietnamIsoString('2026-05-01', '08:00'));
      const end = new Date(toVietnamIsoString('2026-05-01', '10:00'));
      const occurrences = generateWeeklyMonthlyOccurrences(start, end);
      expect(occurrences).toHaveLength(5);
      expect(occurrences[0].dateKey).toBe('2026-05-01');
      expect(occurrences[4].dateKey).toBe('2026-05-29');
    });

    it('generates 4 occurrences when only 4 weeks fit within the month', () => {
      // 2026-06-03 (Wed) -> cutoff 2026-07-03
      // 03/06, 10/06, 17/06, 24/06 (4 sessions). Next is 01/07 < 03/07 -> that makes 5!
      // Let's test a case with 4 sessions:
      // 2026-02-01 (Sun) in 28-day month -> cutoff 2026-03-01
      // 01/02, 08/02, 15/02, 22/02 -> 4 occurrences. Next is 01/03 which equals cutoff -> excluded!
      const start = new Date(toVietnamIsoString('2026-02-01', '08:00'));
      const end = new Date(toVietnamIsoString('2026-02-01', '10:00'));
      const occurrences = generateWeeklyMonthlyOccurrences(start, end);
      expect(occurrences).toHaveLength(4);
      expect(occurrences.map((o) => o.dateKey)).toEqual([
        '2026-02-01',
        '2026-02-08',
        '2026-02-15',
        '2026-02-22',
      ]);
    });

    it('handles year transition across December to January', () => {
      const start = new Date(toVietnamIsoString('2026-12-15', '14:00'));
      const end = new Date(toVietnamIsoString('2026-12-15', '15:30'));
      const occurrences = generateWeeklyMonthlyOccurrences(start, end);

      // Cutoff: 2027-01-15 14:00
      // 15/12, 22/12, 29/12, 05/01, 12/01 -> 5 occurrences
      expect(occurrences).toHaveLength(5);
      expect(occurrences[0].dateKey).toBe('2026-12-15');
      expect(occurrences[3].dateKey).toBe('2027-01-05');
      expect(occurrences[4].dateKey).toBe('2027-01-12');
    });

    it('throws error when startAt >= endAt or invalid dates', () => {
      const start = new Date(toVietnamIsoString('2026-10-27', '16:00'));
      const end = new Date(toVietnamIsoString('2026-10-27', '15:00'));
      expect(() => generateWeeklyMonthlyOccurrences(start, end)).toThrow(
        'Thời gian bắt đầu (startAt) phải trước thời gian kết thúc (endAt)',
      );

      const invalid = new Date('invalid');
      expect(() => generateWeeklyMonthlyOccurrences(invalid, end)).toThrow(
        'Thời gian bắt đầu hoặc kết thúc không hợp lệ',
      );
    });
  });

  describe('getWeeklyRecurrencePreview', () => {
    it('returns error when date or time strings are missing or invalid', () => {
      expect(getWeeklyRecurrencePreview('', '15:00', '16:30')).toEqual({
        isValid: false,
        errorMessage: 'Vui lòng chọn ngày học bắt đầu.',
        occurrences: [],
      });

      expect(getWeeklyRecurrencePreview('2026-10-27', '', '16:30')).toEqual({
        isValid: false,
        errorMessage: 'Vui lòng nhập giờ bắt đầu.',
        occurrences: [],
      });

      expect(getWeeklyRecurrencePreview('2026-10-27', '15:00', '')).toEqual({
        isValid: false,
        errorMessage: 'Vui lòng nhập giờ kết thúc.',
        occurrences: [],
      });

      expect(getWeeklyRecurrencePreview('2026-10-27', '16:30', '15:00')).toEqual({
        isValid: false,
        errorMessage: 'Giờ kết thúc phải sau giờ bắt đầu.',
        occurrences: [],
      });
    });

    it('returns valid occurrences preview for valid date and times', () => {
      const preview = getWeeklyRecurrencePreview('2026-10-27', '15:00', '16:30');
      expect(preview.isValid).toBe(true);
      expect(preview.occurrences).toHaveLength(5);
      expect(preview.occurrences[0].dateKey).toBe('2026-10-27');
      expect(preview.occurrences[0].occurrenceNumber).toBe(1);
      expect(preview.occurrences[4].occurrenceNumber).toBe(5);
      expect(preview.occurrences[0].timeRange).toBe('15:00 – 16:30');
    });
  });
});
