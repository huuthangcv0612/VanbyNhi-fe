import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getRoleMeta,
  getClassStatusMeta,
  getMemberStatusMeta,
  getTuitionStatusMeta,
  getAttendanceStatusMeta,
} from './formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('formats numbers to Vietnamese Dong', () => {
      const result = formatCurrency(1500000);
      expect(result).toContain('1.500.000');
    });

    it('handles 0 or empty inputs gracefully', () => {
      expect(formatCurrency(0)).toContain('0');
      expect(formatCurrency(null)).toContain('0');
      expect(formatCurrency(undefined)).toContain('0');
      expect(formatCurrency('abc')).toContain('0');
    });
  });

  describe('formatDate', () => {
    it('formats ISO date string to DD/MM/YYYY', () => {
      const formatted = formatDate('2026-10-09T10:00:00.000Z');
      expect(formatted).toMatch(/\d{2}\/\d{2}\/2026/);
    });

    it('returns hyphen for null or undefined', () => {
      expect(formatDate(null)).toBe('-');
      expect(formatDate(undefined)).toBe('-');
    });
  });

  describe('formatDateTime', () => {
    it('formats date and time properly', () => {
      const formatted = formatDateTime('2026-10-09T10:30:00.000Z');
      expect(formatted).toMatch(/\d{2}\/\d{2}\/2026/);
    });
  });

  describe('getRoleMeta', () => {
    it('returns proper labels for each role', () => {
      expect(getRoleMeta('ADMIN').label).toBe('Quản trị viên');
      expect(getRoleMeta('TEACHER').label).toBe('Giáo viên');
      expect(getRoleMeta('STUDENT').label).toBe('Học sinh');
    });
  });

  describe('getClassStatusMeta', () => {
    it('returns proper metadata for class statuses', () => {
      expect(getClassStatusMeta('ACTIVE').label).toBe('Đang mở');
      expect(getClassStatusMeta('CLOSED').label).toBe('Đã đóng');
      expect(getClassStatusMeta('INACTIVE').label).toBe('Tạm dừng');
      expect(getClassStatusMeta('COMPLETED').label).toBe('Đã kết thúc');
    });
  });

  describe('getMemberStatusMeta', () => {
    it('returns proper metadata for member statuses', () => {
      expect(getMemberStatusMeta('PENDING').label).toBe('Chờ duyệt');
      expect(getMemberStatusMeta('ACTIVE').label).toBe('Đang học');
      expect(getMemberStatusMeta('REJECTED').label).toBe('Đã từ chối');
      expect(getMemberStatusMeta('LEFT').label).toBe('Đã rời lớp');
      expect(getMemberStatusMeta('REMOVED').label).toBe('Đã bị xóa');
    });
  });

  describe('getTuitionStatusMeta', () => {
    it('returns proper metadata for tuition statuses', () => {
      expect(getTuitionStatusMeta('PAID').label).toBe('Đã đóng đủ');
      expect(getTuitionStatusMeta('UNPAID').label).toBe('Chưa đóng');
      expect(getTuitionStatusMeta('OVERDUE').label).toBe('Quá hạn');
    });
  });

  describe('getAttendanceStatusMeta', () => {
    it('returns proper metadata for attendance statuses', () => {
      expect(getAttendanceStatusMeta('PRESENT').label).toBe('Có mặt');
      expect(getAttendanceStatusMeta('ABSENT').label).toBe('Vắng mặt');
      expect(getAttendanceStatusMeta('LATE').label).toBe('Đi muộn');
    });
  });
});
