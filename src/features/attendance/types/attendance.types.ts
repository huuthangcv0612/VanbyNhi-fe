import type {
  AttendanceStatus,
  AttendanceSessionStatus,
  CorrectionRequestStatus,
  MemberStatus,
  SessionStatus,
} from '@/types/common.types';

export type {
  AttendanceStatus,
  AttendanceSessionStatus,
  CorrectionRequestStatus,
};

export interface StudentMinimal {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
}

export interface AttendanceChangeLogItem {
  id: string;
  attendanceId: string;
  oldStatus: AttendanceStatus;
  newStatus: AttendanceStatus;
  changedById: string;
  changedBy?: { fullName: string } | null;
  reason?: string | null;
  changedAt: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
  checkedInAt?: string | null;
  markedById?: string | null;
  markedBy?: { id: string; fullName: string } | null;
  note?: string | null;
  isMakeUp?: boolean;
  originalSessionId?: string | null;
  createdAt: string;
  updatedAt: string;
  changeLogs?: AttendanceChangeLogItem[];
  correctionRequests?: CorrectionRequestItem[];
}

export interface AttendanceSessionInfo {
  id: string;
  sessionId: string;
  classId: string;
  status: AttendanceSessionStatus;
  openedAt?: string | null;
  closedAt?: string | null;
  closedById?: string | null;
  closedBy?: { id: string; fullName: string } | null;
  createdBy?: { id: string; fullName: string } | null;
  notes?: string | null;
}

export interface SessionStudentAttendanceItem {
  student: StudentMinimal;
  enrollmentStatus: MemberStatus;
  attendance: AttendanceRecord | null;
}

export interface SessionAttendanceResponse {
  session: {
    id: string;
    title: string;
    status: SessionStatus;
    startTime: string;
    endTime: string;
    meetUrl?: string | null;
    class: {
      id: string;
      name: string;
      teacherId: string;
      teacher?: {
        id: string;
        fullName: string;
      } | null;
    };
    attendanceSession?: AttendanceSessionInfo | null;
  };
  students: SessionStudentAttendanceItem[];
}

export interface SessionAttendanceSummary {
  sessionId: string;
  totalActiveStudents: number;
  totalMarked: number;
  unmarkedCount: number;
  summary: Record<AttendanceStatus, number>;
}

export interface BatchAttendanceRecordPayload {
  studentId: string;
  status: AttendanceStatus;
  checkedInAt?: string | Date;
  note?: string;
  isMakeUp?: boolean;
  originalSessionId?: string;
}

export interface BatchAttendancePayload {
  records: BatchAttendanceRecordPayload[];
}

export interface MarkAllPresentPayload {
  note?: string;
  overrideExisting?: boolean;
}

export interface CloseAttendanceSessionPayload {
  note?: string;
}

export interface UpdateAttendancePayload {
  status: AttendanceStatus;
  reason?: string;
  checkedInAt?: string | Date | null;
  note?: string;
  isMakeUp?: boolean;
  originalSessionId?: string;
}

export interface QueryAttendanceHistoryParams {
  studentId?: string;
  year?: number;
  month?: number;
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
  page?: number;
  limit?: number;
}

export interface ClassAttendanceHistoryItem extends AttendanceRecord {
  student: {
    id: string;
    fullName: string;
    phone?: string | null;
    avatarUrl?: string | null;
  };
  session: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    status: SessionStatus;
  };
}

export interface ClassAttendanceSummaryResponse {
  classId: string;
  totalRecords: number;
  summary: Record<AttendanceStatus, number>;
}

export interface QueryMonthlySummaryParams {
  billingYear: number;
  billingMonth: number;
}

export interface MonthlySummaryItem {
  id: string;
  classId: string;
  studentId: string;
  student: {
    id: string;
    fullName: string;
    phone?: string | null;
  };
  enrollmentId: string;
  billingYear: number;
  billingMonth: number;
  totalSessions: number;
  presentCount: number;
  lateCount: number;
  excusedAbsentCount: number;
  unexcusedAbsentCount: number;
  notMarkedCount: number;
  chargeableSessions: number;
  tuitionAmount: number;
  isClosed: boolean;
  closedAt?: string | null;
  closedById?: string | null;
  closedBy?: { id: string; fullName: string } | null;
  note?: string | null;
}

export interface MonthlySummaryResponse {
  classId: string;
  billingYear: number;
  billingMonth: number;
  isClosed: boolean;
  items: MonthlySummaryItem[];
}

export interface CloseMonthlySummaryPayload {
  billingYear: number;
  billingMonth: number;
  note?: string;
}

export interface ClassAttendanceConfig {
  id?: string;
  classId: string;
  chargePresent: boolean;
  chargeLate: boolean;
  chargeExcusedAbsent: boolean;
  chargeUnexcusedAbsent: boolean;
  allowMakeUpSession: boolean;
  retentionDays: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateAttendanceConfigPayload {
  chargePresent?: boolean;
  chargeLate?: boolean;
  chargeExcusedAbsent?: boolean;
  chargeUnexcusedAbsent?: boolean;
  allowMakeUpSession?: boolean;
  retentionDays?: number;
}

export interface CorrectionRequestItem {
  id: string;
  attendanceId: string;
  studentId: string;
  student?: {
    id: string;
    fullName: string;
    phone?: string | null;
    avatarUrl?: string | null;
  };
  requestedStatus: AttendanceStatus;
  reason: string;
  evidenceUrl?: string | null;
  status: CorrectionRequestStatus;
  reviewNote?: string | null;
  reviewedById?: string | null;
  reviewedBy?: { id: string; fullName: string } | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  attendance?: AttendanceRecord & {
    session?: {
      id: string;
      title: string;
      startTime: string;
      endTime?: string;
      class?: { id: string; name: string };
    };
  };
}

export interface QueryCorrectionRequestsParams {
  classId?: string;
  studentId?: string;
  status?: CorrectionRequestStatus;
  page?: number;
  limit?: number;
}

export interface ReviewCorrectionRequestPayload {
  status: 'APPROVED' | 'REJECTED';
  reviewNote?: string;
}

export interface QueryStudentAttendanceParams {
  classId?: string;
  year?: number;
  month?: number;
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
  page?: number;
  limit?: number;
}

export interface StudentAttendanceItem extends AttendanceRecord {
  session: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    status: SessionStatus;
    class: { id: string; name: string };
  };
  correctionRequests?: CorrectionRequestItem[];
}

export interface StudentAttendanceSummaryResponse {
  studentId: string;
  totalSessions: number;
  summary: Record<AttendanceStatus, number>;
}

export interface CreateCorrectionRequestPayload {
  attendanceId: string;
  requestedStatus: AttendanceStatus;
  reason: string;
  evidenceUrl?: string;
}

export interface ExportAttendanceParams {
  year?: number;
  month?: number;
  startDate?: string;
  endDate?: string;
}
