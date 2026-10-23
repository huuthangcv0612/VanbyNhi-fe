import { describe, it, expect } from 'vitest';
import {
  formatBytes,
  validateAttachmentFile,
  isMimeTypeSupported,
  isPastDue,
  getAssignmentStatusMeta,
  MAX_UPLOAD_SIZE_BYTES,
} from './assignment.utils';

describe('assignment.utils', () => {
  describe('formatBytes', () => {
    it('formats bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024 * 5.5)).toBe('5.5 MB');
    });
  });

  describe('isMimeTypeSupported', () => {
    it('accepts valid mime types', () => {
      expect(isMimeTypeSupported('application/pdf')).toBe(true);
      expect(isMimeTypeSupported('image/png')).toBe(true);
      expect(isMimeTypeSupported('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(true);
    });

    it('rejects unsupported mime types', () => {
      expect(isMimeTypeSupported('video/mp4')).toBe(false);
      expect(isMimeTypeSupported('application/x-msdownload')).toBe(false);
      expect(isMimeTypeSupported('')).toBe(false);
    });
  });

  describe('validateAttachmentFile', () => {
    it('rejects files exceeding 100MB', () => {
      const largeFile = new File(['x'.repeat(100)], 'large.pdf', { type: 'application/pdf' });
      Object.defineProperty(largeFile, 'size', { value: MAX_UPLOAD_SIZE_BYTES + 10 });

      const result = validateAttachmentFile(largeFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('vượt quá giới hạn tối đa 100MB');
    });

    it('rejects unsupported mime types', () => {
      const exeFile = new File(['test'], 'run.exe', { type: 'application/x-msdownload' });
      const result = validateAttachmentFile(exeFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('không được hỗ trợ');
    });

    it('accepts valid PDF within size limit', () => {
      const validFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const result = validateAttachmentFile(validFile);
      expect(result.valid).toBe(true);
    });
  });

  describe('isPastDue', () => {
    it('returns false for null or undefined dueDate', () => {
      expect(isPastDue(null)).toBe(false);
      expect(isPastDue(undefined)).toBe(false);
    });

    it('returns true for past dates', () => {
      const pastDate = new Date(Date.now() - 3600000).toISOString();
      expect(isPastDue(pastDate)).toBe(true);
    });

    it('returns false for future dates', () => {
      const futureDate = new Date(Date.now() + 36000000).toISOString();
      expect(isPastDue(futureDate)).toBe(false);
    });
  });

  describe('getAssignmentStatusMeta', () => {
    it('returns metadata for known statuses', () => {
      expect(getAssignmentStatusMeta('RETURNED').label).toBe('Đã trả bài');
      expect(getAssignmentStatusMeta('GRADED').label).toBe('Đã chấm (Bản nháp)');
      expect(getAssignmentStatusMeta('LATE').label).toBe('Nộp muộn');
      expect(getAssignmentStatusMeta('SUBMITTED').label).toBe('Đã nộp bài');
      expect(getAssignmentStatusMeta('NOT_SUBMITTED').label).toBe('Chưa nộp bài');
    });
  });
});
