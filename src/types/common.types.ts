export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export type ClassStatus = 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'CLOSED';

export type MemberStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'LEFT' | 'REMOVED' | 'INACTIVE';

export type SessionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type AttendanceStatus =
  | 'PRESENT'
  | 'LATE'
  | 'EXCUSED_ABSENT'
  | 'UNEXCUSED_ABSENT'
  | 'NOT_MARKED'
  | 'ABSENT';

export type AttendanceSessionStatus = 'OPEN' | 'DRAFT' | 'CLOSED';

export type CorrectionRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type MaterialType = 'DOCUMENT' | 'RECORDING' | 'IMAGE' | 'LINK' | 'OTHER';

export type TuitionStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE';

export type AssignmentStatus = 'SUBMITTED' | 'GRADED' | 'RESUBMIT_REQUESTED';

export type NotificationType = 'TUITION' | 'SESSION' | 'ASSIGNMENT' | 'ATTENDANCE' | 'SYSTEM';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}
