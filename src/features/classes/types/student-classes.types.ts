import type {
  ClassStatus,
  SessionStatus,
  AttendanceStatus,
  PaginatedResponse,
} from '@/types/common.types';

export interface StudentTeacher {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface StudentNextSession {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: SessionStatus;
  canJoinMeet: boolean;
  meetUrl: string | null;
  opensAt: string;
  closesAt: string;
  isLive: boolean;
}

export interface StudentAttendanceSummary {
  totalCompletedSessions: number;
  attendedCount: number;
  attendanceRate: number;
}

export interface StudentClassItem {
  membershipId: string;
  joinedAt: string;
  effectiveTuition: string | number;
  class: {
    id: string;
    name: string;
    description?: string | null;
    status: ClassStatus;
    defaultMeetUrl?: string | null;
    monthlyTuition: string | number;
    teacher: StudentTeacher;
    nextSession?: StudentNextSession | null;
  };
}

export interface StudentClassDetail {
  id: string;
  name: string;
  description?: string | null;
  status: ClassStatus;
  defaultMeetUrl?: string | null;
  teacher: StudentTeacher;
  joinedAt: string;
  membershipId: string;
  nextSession?: StudentNextSession | null;
  attendanceSummary: StudentAttendanceSummary;
}

export interface StudentSessionAttendance {
  id: string;
  status: AttendanceStatus;
  checkedInAt: string | null;
  note?: string | null;
}

export interface StudentJoinWindow {
  opensAt: string;
  closesAt: string;
  isOpen: boolean;
  reason?: string;
}

export interface StudentClassSessionItem {
  id: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  status: SessionStatus;
  canJoinMeet: boolean;
  meetUrl: string | null;
  joinWindow: StudentJoinWindow;
  myAttendance: StudentSessionAttendance | null;
  hasLessonRecord: boolean;
  lessonRecordSummary?: {
    homeworkSummary?: string | null;
  } | null;
  materialsCount: number;
  assignmentsCount: number;
}

export interface QueryStudentClassSessionsParams {
  page?: number;
  limit?: number;
  status?: SessionStatus;
  from?: string;
  to?: string;
}

export type StudentClassSessionsResponse = PaginatedResponse<StudentClassSessionItem>;

export interface ClassMaterialItem {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  fileUrl?: string | null;
  externalUrl?: string | null;
  originalName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  publishedAt?: string | null;
  createdAt: string;
}

export interface ClassAssignmentItem {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  fileUrls: string[];
}

export interface StudentLessonRecord {
  id: string;
  content: string;
  homeworkSummary?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface StudentSessionDetail {
  id: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  status: SessionStatus;
  class: {
    id: string;
    name: string;
    classCode?: string;
    teacher: StudentTeacher;
  };
  meetAccess: {
    canJoin: boolean;
    reason?: string;
    meetUrl: string | null;
    opensAt: string;
    closesAt: string;
    isLive: boolean;
  };
  myAttendance: StudentSessionAttendance | null;
  lessonRecord: StudentLessonRecord | null;
  materials: ClassMaterialItem[];
  assignments: ClassAssignmentItem[];
}

export interface StudentJoinMeetResponse {
  canJoin: boolean;
  meetUrl: string;
  sessionId: string;
  title: string;
  startTime: string;
  endTime: string;
  status: SessionStatus;
  isLive: boolean;
}

export interface StudentCheckInDto {
  note?: string;
}

export interface StudentCheckInResponse {
  message: string;
  alreadyCheckedIn: boolean;
  attendance: {
    id: string;
    sessionId: string;
    studentId: string;
    status: AttendanceStatus;
    checkedInAt: string;
    note?: string | null;
  };
}
