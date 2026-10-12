import type { ClassStatus, MemberStatus, PaginatedResponse } from '@/types/common.types';
import type { User } from '@/types/auth.types';

export interface ClassItem {
  id: string;
  name: string;
  description: string | null;
  joinCode: string;
  classCode?: string; // Tương thích ngược
  maxStudents?: number | null;
  defaultMeetUrl: string | null;
  monthlyTuition: string | number;
  status: ClassStatus;
  createdById?: string;
  teacherId?: string;
  createdAt: string;
  updatedAt: string;
  teacher?: User;
  activeStudentCount?: number;
  pendingRequestsCount?: number;
  totalSessionsCount?: number;
  _count?: {
    members: number;
    sessions: number;
  };
}

export interface QueryClassesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ClassStatus;
  teacherId?: string;
}

export interface QueryTeacherClassesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ClassStatus;
}

export interface TeacherCreateClassDto {
  name: string;
  description?: string;
  maxStudents?: number;
  defaultMeetUrl?: string;
  monthlyTuition?: number;
}

export interface TeacherUpdateClassDto {
  name?: string;
  description?: string;
  maxStudents?: number | null;
  defaultMeetUrl?: string;
  monthlyTuition?: number;
}

export interface ClassMemberItem {
  id: string;
  classId: string;
  studentId: string;
  status: MemberStatus;
  requestedAt?: string | null;
  approvedAt?: string | null;
  joinedAt?: string | null;
  leftAt?: string | null;
  rejectedAt?: string | null;
  tuitionOverride?: string | number | null;
  student: {
    id: string;
    fullName: string;
    email?: string | null;
    phone: string;
    avatarUrl?: string | null;
    dateOfBirth?: string | null;
  };
}

export interface QueryClassMembersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: MemberStatus;
}

export interface QueryJoinRequestsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface StudentJoinClassDto {
  joinCode: string;
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
    teacher: {
      id: string;
      fullName: string;
      email?: string | null;
      phone: string;
      avatarUrl?: string | null;
    };
  };
}

export interface StudentClassDetail {
  id: string;
  name: string;
  description?: string | null;
  status: ClassStatus;
  defaultMeetUrl?: string | null;
  teacher: {
    id: string;
    fullName: string;
    email?: string | null;
    phone: string;
    avatarUrl?: string | null;
  };
  joinedAt: string;
  membershipId: string;
}

export interface StudentRequestItem {
  id: string;
  classId: string;
  studentId: string;
  status: MemberStatus;
  requestedAt: string;
  class: {
    id: string;
    name: string;
    description?: string | null;
    status: ClassStatus;
    teacher: {
      id: string;
      fullName: string;
      email?: string | null;
      phone: string;
      avatarUrl?: string | null;
    };
  };
}

export interface QueryStudentClassesParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface QueryStudentRequestsParams {
  page?: number;
  limit?: number;
  status?: MemberStatus;
}

// Backward compatibility types
export interface CreateClassPayload {
  name: string;
  description?: string;
  teacherId: string;
  defaultMeetUrl?: string;
  monthlyTuition?: number;
}

export interface UpdateClassPayload {
  name?: string;
  description?: string;
  teacherId?: string;
  defaultMeetUrl?: string;
  monthlyTuition?: number;
}

export interface UpdateClassStatusPayload {
  status: ClassStatus;
}

export type ClassesListResponse = PaginatedResponse<ClassItem>;
export type TeacherClassesResponse = PaginatedResponse<ClassItem>;
export type ClassMembersResponse = PaginatedResponse<ClassMemberItem>;
export type JoinRequestsResponse = PaginatedResponse<ClassMemberItem>;
export type StudentClassesResponse = PaginatedResponse<StudentClassItem>;
export type StudentRequestsResponse = PaginatedResponse<StudentRequestItem>;
