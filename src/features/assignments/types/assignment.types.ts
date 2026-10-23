import type { UserRole, PaginatedResponse } from '@/types/common.types';

export type AssignmentStatus =
  | 'NOT_SUBMITTED'
  | 'SUBMITTED'
  | 'LATE'
  | 'GRADED'
  | 'RETURNED'
  | 'RESUBMIT_REQUESTED';

export type ReviewStatus = 'DRAFT' | 'RETURNED';

export type UploadTargetType = 'ASSIGNMENT' | 'SUBMISSION' | 'REVIEW';

export type AttachmentCleanupStatus = 'PENDING' | 'PROCESSING' | 'CLEANED' | 'FAILED';

export interface AttachmentItem {
  id: string;
  storageKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedById: string;
  retentionExpiresAt: string | null;
  isKeepForever: boolean;
  cleanupStatus: AttachmentCleanupStatus;
  cleanedAt: string | null;
  createdAt: string;
}

export interface AssignmentItem {
  id: string;
  classId: string;
  sessionId: string | null;
  title: string;
  description: string | null;
  fileUrls: string[];
  dueDate: string | null;
  maxScore: number;
  allowResubmission: boolean;
  maxAttempts: number | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  class?: {
    id: string;
    name: string;
    classCode: string;
    teacherId?: string;
  };
  createdBy?: {
    id: string;
    fullName: string;
    role?: UserRole;
  };
  session?: {
    id: string;
    title: string;
    startTime: string;
  } | null;
  attachments?: AttachmentItem[];
  _count?: {
    submissions: number;
  };
}

export interface AssignmentDetail extends AssignmentItem {
  class: {
    id: string;
    name: string;
    classCode: string;
    teacherId?: string;
  };
}

export interface SubmissionReviewItem {
  id: string;
  score: number | null;
  feedback: string | null;
  status: ReviewStatus;
  returnedAt: string | null;
  reviewer?: {
    id: string;
    fullName: string;
  };
  attachments?: AttachmentItem[];
}

export interface AssignmentSubmissionItem {
  id: string;
  assignmentId: string;
  studentId: string;
  attemptNumber: number;
  content: string | null;
  fileUrls: string[];
  externalUrl: string | null;
  isLate: boolean;
  submittedAt: string;
  status: AssignmentStatus;
  score: number | null;
  feedback: string | null;
  student?: {
    id: string;
    fullName: string;
    phone?: string;
    avatarUrl?: string | null;
  };
  assignment?: {
    id: string;
    title: string;
    dueDate: string | null;
    maxScore: number;
    classId: string;
    class?: {
      id?: string;
      name: string;
      teacherId?: string;
    };
  };
  attachments?: AttachmentItem[];
  review?: SubmissionReviewItem | null;
}

export interface EligibleStudentItem {
  studentId: string;
  fullName: string;
  phone: string;
  email: string | null;
  avatarUrl: string | null;
  enrollmentStatus: string;
  submissionCount: number;
  latestSubmissionId: string | null;
  attemptNumber: number | null;
  submittedAt: string | null;
  status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'LATE' | 'GRADED' | 'RETURNED';
  statusText: string;
  isLate: boolean;
  score: number | null;
  reviewStatus: ReviewStatus | null;
}

export interface EligibleStudentsResponse {
  assignmentId: string;
  title: string;
  dueDate: string | null;
  maxScore: number;
  totalEligible: number;
  students: EligibleStudentItem[];
}

export interface AssignmentStatsResponse {
  assignmentId: string;
  title: string;
  dueDate: string | null;
  maxScore: number;
  totalEligible: number;
  submittedCount: number;
  notSubmittedCount: number;
  lateCount: number;
  pendingReviewCount: number;
  draftReviewCount: number;
  returnedCount: number;
  averageScore: number | null;
}

// DTOs
export interface CreateAssignmentDto {
  classId: string;
  sessionId?: string;
  title: string;
  description?: string;
  maxScore?: number;
  allowResubmission?: boolean;
  maxAttempts?: number | null;
  fileUrls?: string[];
  attachmentKeys?: string[];
  dueDate?: string | null;
}

export interface UpdateAssignmentDto {
  title?: string;
  description?: string;
  sessionId?: string | null;
  maxScore?: number;
  allowResubmission?: boolean;
  maxAttempts?: number | null;
  fileUrls?: string[];
  attachmentKeys?: string[];
  dueDate?: string | null;
}

export interface QueryAssignmentsParams {
  page?: number;
  limit?: number;
  classId?: string;
  sessionId?: string;
}

export interface QuerySubmissionsParams {
  page?: number;
  limit?: number;
  studentId?: string;
  status?: AssignmentStatus;
  isLate?: boolean;
}

export interface SubmitAssignmentDto {
  content?: string;
  fileUrls?: string[];
  attachmentKeys?: string[];
  externalUrl?: string;
}

export interface ReviewSubmissionDto {
  score?: number;
  feedback?: string;
  status?: ReviewStatus;
  attachmentKeys?: string[];
}

export interface InitAssignmentUploadDto {
  targetType: UploadTargetType;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  targetId?: string;
}

export interface InitAssignmentUploadResponse {
  uploadUrl: string;
  storageKey: string;
  uploadSessionId: string;
  expiresInSeconds: number;
  requiredHeaders?: Record<string, string>;
}

export interface AttachmentDownloadUrlResponse {
  downloadUrl: string;
  expiresInSeconds: number;
  originalName: string;
  mimeType: string;
}

export type AssignmentsListResponse = PaginatedResponse<AssignmentItem>;
