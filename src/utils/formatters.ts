import type {
  UserRole,
  ClassStatus,
  MemberStatus,
  SessionStatus,
  AttendanceStatus,
  AttendanceSessionStatus,
  CorrectionRequestStatus,
  TuitionStatus,
  AssignmentStatus,
} from '@/types/common.types';

/**
 * Định dạng tiền tệ VND: 1.500.000 ₫
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return '0 ₫';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Định dạng ngày giờ: DD/MM/YYYY HH:mm
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

/**
 * Định dạng giờ: HH:mm
 */
export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

/**
 * Định dạng ngày: DD/MM/YYYY
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Nhãn và màu cho vai trò người dùng (UserRole)
 */
export function getRoleMeta(role: UserRole): { label: string; badgeClass: string } {
  switch (role) {
    case 'ADMIN':
      return {
        label: 'Quản trị viên',
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
      };
    case 'TEACHER':
      return {
        label: 'Giáo viên',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
      };
    case 'STUDENT':
      return {
        label: 'Học sinh',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };
    default:
      return {
        label: role,
        badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
      };
  }
}

/**
 * Nhãn và màu trạng thái lớp học (ClassStatus)
 */
export function getClassStatusMeta(status: ClassStatus): { label: string; badgeClass: string } {
  switch (status) {
    case 'ACTIVE':
      return {
        label: 'Đang mở',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };
    case 'CLOSED':
      return {
        label: 'Đã đóng',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      };
    case 'INACTIVE':
      return {
        label: 'Tạm dừng',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      };
    case 'COMPLETED':
      return {
        label: 'Đã kết thúc',
        badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
      };
    default:
      return {
        label: status,
        badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
      };
  }
}

/**
 * Nhãn và màu trạng thái thành viên (MemberStatus)
 */
export function getMemberStatusMeta(status: MemberStatus): { label: string; badgeClass: string } {
  switch (status) {
    case 'PENDING':
      return {
        label: 'Chờ duyệt',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      };
    case 'ACTIVE':
      return {
        label: 'Đang học',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };
    case 'REJECTED':
      return {
        label: 'Đã từ chối',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      };
    case 'LEFT':
      return {
        label: 'Đã rời lớp',
        badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
      };
    case 'REMOVED':
      return {
        label: 'Đã bị xóa',
        badgeClass: 'bg-slate-200 text-slate-700 border-slate-300',
      };
    case 'INACTIVE':
      return {
        label: 'Tạm ngưng',
        badgeClass: 'bg-gray-100 text-gray-800 border-gray-200',
      };
    default:
      return {
        label: status,
        badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
      };
  }
}

/**
 * Nhãn và màu trạng thái buổi học (SessionStatus)
 */
export function getSessionStatusMeta(status: SessionStatus): { label: string; badgeClass: string } {
  switch (status) {
    case 'SCHEDULED':
      return {
        label: 'Đã lên lịch',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
      };
    case 'IN_PROGRESS':
      return {
        label: 'Đang diễn ra',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      };
    case 'COMPLETED':
      return {
        label: 'Đã hoàn thành',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };
    case 'CANCELLED':
      return {
        label: 'Đã hủy',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      };
  }
}

/**
 * Nhãn và màu trạng thái điểm danh (AttendanceStatus)
 */
export function getAttendanceStatusMeta(status: AttendanceStatus): { label: string; badgeClass: string } {
  switch (status) {
    case 'PRESENT':
      return {
        label: 'Có mặt',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };
    case 'LATE':
      return {
        label: 'Đi muộn',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      };
    case 'EXCUSED_ABSENT':
      return {
        label: 'Vắng có phép',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
      };
    case 'UNEXCUSED_ABSENT':
      return {
        label: 'Vắng không phép',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      };
    case 'NOT_MARKED':
      return {
        label: 'Chưa điểm danh',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      };
    case 'ABSENT':
      return {
        label: 'Vắng mặt',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      };
    default:
      return {
        label: status,
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      };
  }
}

/**
 * Nhãn và màu trạng thái phiên điểm danh (AttendanceSessionStatus)
 */
export function getAttendanceSessionStatusMeta(status: AttendanceSessionStatus): { label: string; badgeClass: string } {
  switch (status) {
    case 'OPEN':
      return {
        label: 'Đang mở',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };
    case 'DRAFT':
      return {
        label: 'Bản nháp',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      };
    case 'CLOSED':
      return {
        label: 'Đã chốt',
        badgeClass: 'bg-slate-200 text-slate-800 border-slate-300',
      };
    default:
      return {
        label: status,
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      };
  }
}

/**
 * Nhãn và màu trạng thái yêu cầu điều chỉnh điểm danh (CorrectionRequestStatus)
 */
export function getCorrectionRequestStatusMeta(status: CorrectionRequestStatus): { label: string; badgeClass: string } {
  switch (status) {
    case 'PENDING':
      return {
        label: 'Chờ xử lý',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      };
    case 'APPROVED':
      return {
        label: 'Đã chấp nhận',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };
    case 'REJECTED':
      return {
        label: 'Đã từ chối',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      };
    default:
      return {
        label: status,
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      };
  }
}

/**
 * Nhãn và màu trạng thái học phí (TuitionStatus)
 */
export function getTuitionStatusMeta(status: TuitionStatus): { label: string; badgeClass: string } {
  switch (status) {
    case 'PAID':
      return {
        label: 'Đã đóng đủ',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };
    case 'PARTIAL':
      return {
        label: 'Đã đóng một phần',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
      };
    case 'UNPAID':
      return {
        label: 'Chưa đóng',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      };
    case 'OVERDUE':
      return {
        label: 'Quá hạn',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      };
  }
}

/**
 * Nhãn và màu trạng thái bài tập (AssignmentStatus)
 */
export function getAssignmentStatusMeta(status: AssignmentStatus): { label: string; badgeClass: string } {
  switch (status) {
    case 'SUBMITTED':
      return {
        label: 'Đã nộp bài',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
      };
    case 'GRADED':
      return {
        label: 'Đã chấm điểm',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };
    case 'RESUBMIT_REQUESTED':
      return {
        label: 'Yêu cầu nộp lại',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      };
  }
}

/**
 * Định dạng kích thước tệp tin (bytes -> B, KB, MB, GB)
 */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || isNaN(bytes) || bytes <= 0) {
    return '0 B';
  }
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const num = bytes / Math.pow(k, i);
  return `${parseFloat(num.toFixed(1))} ${sizes[i] || 'B'}`;
}
