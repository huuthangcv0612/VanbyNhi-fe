import type { AssignmentStatus } from '../types/assignment.types';

export const MAX_UPLOAD_SIZE_BYTES = 104857600; // 100MB

export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/zip',
  'application/x-zip-compressed',
]);

export function isMimeTypeSupported(mimeType: string): boolean {
  if (!mimeType) return false;
  return ALLOWED_MIME_TYPES.has(mimeType.toLowerCase());
}

export function validateAttachmentFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'Vui lòng chọn tệp đính kèm' };
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Tệp dung lượng ${sizeMb}MB vượt quá giới hạn tối đa 100MB cho phép`,
    };
  }

  if (file.type && !isMimeTypeSupported(file.type)) {
    return {
      valid: false,
      error: `Định dạng tệp '${file.type}' không được hỗ trợ. Vui lòng tải lên PDF, Word, Excel, PowerPoint, Text, Ảnh hoặc Zip`,
    };
  }

  return { valid: true };
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function isPastDue(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false;
  return new Date() > new Date(dueDate);
}

export interface StatusMeta {
  label: string;
  badgeClass: string;
}

export function getAssignmentStatusMeta(status: AssignmentStatus | string | null | undefined): StatusMeta {
  switch (status) {
    case 'RETURNED':
      return {
        label: 'Đã trả bài',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };
    case 'GRADED':
      return {
        label: 'Đã chấm (Bản nháp)',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      };
    case 'LATE':
      return {
        label: 'Nộp muộn',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      };
    case 'SUBMITTED':
      return {
        label: 'Đã nộp bài',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
      };
    case 'RESUBMIT_REQUESTED':
      return {
        label: 'Yêu cầu nộp lại',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      };
    case 'NOT_SUBMITTED':
    default:
      return {
        label: 'Chưa nộp bài',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      };
  }
}
