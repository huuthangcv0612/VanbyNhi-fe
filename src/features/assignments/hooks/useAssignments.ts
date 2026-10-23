import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentsService } from '../services/assignments.service';
import type {
  QueryAssignmentsParams,
  CreateAssignmentDto,
  UpdateAssignmentDto,
  SubmitAssignmentDto,
  ReviewSubmissionDto,
  QuerySubmissionsParams,
} from '../types/assignment.types';

export const assignmentsKeys = {
  all: ['assignments'] as const,
  lists: () => [...assignmentsKeys.all, 'list'] as const,
  list: (params?: QueryAssignmentsParams) => [...assignmentsKeys.lists(), params] as const,
  details: () => [...assignmentsKeys.all, 'detail'] as const,
  detail: (id: string) => [...assignmentsKeys.details(), id] as const,
  stats: (id: string) => [...assignmentsKeys.all, 'stats', id] as const,
  eligibleStudents: (id: string) => [...assignmentsKeys.all, 'eligible-students', id] as const,
  submissions: (id: string, params?: QuerySubmissionsParams) =>
    [...assignmentsKeys.all, 'submissions', id, params] as const,
  submissionDetail: (submissionId: string) =>
    [...assignmentsKeys.all, 'submission-detail', submissionId] as const,
};

export function useAssignmentsList(params?: QueryAssignmentsParams) {
  return useQuery({
    queryKey: assignmentsKeys.list(params),
    queryFn: () => assignmentsService.findAll(params),
  });
}

export function useAssignmentDetail(id: string) {
  return useQuery({
    queryKey: assignmentsKeys.detail(id),
    queryFn: () => assignmentsService.findOne(id),
    enabled: Boolean(id),
  });
}

export function useAssignmentStats(id: string) {
  return useQuery({
    queryKey: assignmentsKeys.stats(id),
    queryFn: () => assignmentsService.getStats(id),
    enabled: Boolean(id),
  });
}

export function useEligibleStudents(id: string) {
  return useQuery({
    queryKey: assignmentsKeys.eligibleStudents(id),
    queryFn: () => assignmentsService.getEligibleStudents(id),
    enabled: Boolean(id),
  });
}

export function useAssignmentSubmissions(id: string, params?: QuerySubmissionsParams) {
  return useQuery({
    queryKey: assignmentsKeys.submissions(id, params),
    queryFn: () => assignmentsService.getSubmissions(id, params),
    enabled: Boolean(id),
  });
}

export function useSubmissionDetail(submissionId: string) {
  return useQuery({
    queryKey: assignmentsKeys.submissionDetail(submissionId),
    queryFn: () => assignmentsService.getSubmission(submissionId),
    enabled: Boolean(submissionId),
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAssignmentDto) => assignmentsService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.lists() });
    },
  });
}

export function useUpdateAssignment(assignmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateAssignmentDto) => assignmentsService.update(assignmentId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.detail(assignmentId) });
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.stats(assignmentId) });
    },
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assignmentsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.lists() });
    },
  });
}

export function useSubmitAssignment(assignmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: SubmitAssignmentDto) => assignmentsService.submitAssignment(assignmentId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.detail(assignmentId) });
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.submissions(assignmentId) });
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.eligibleStudents(assignmentId) });
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.stats(assignmentId) });
    },
  });
}

export function useReviewSubmission(assignmentId: string, submissionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: ReviewSubmissionDto) => assignmentsService.reviewSubmission(submissionId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.submissionDetail(submissionId) });
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.submissions(assignmentId) });
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.eligibleStudents(assignmentId) });
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.stats(assignmentId) });
    },
  });
}

export function useReturnSubmission(assignmentId: string, submissionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => assignmentsService.returnSubmission(submissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.submissionDetail(submissionId) });
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.submissions(assignmentId) });
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.eligibleStudents(assignmentId) });
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.stats(assignmentId) });
    },
  });
}

export function useToggleAttachmentKeepForever(assignmentId?: string, submissionId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ attachmentId, isKeepForever }: { attachmentId: string; isKeepForever: boolean }) =>
      assignmentsService.toggleKeepForever(attachmentId, isKeepForever),
    onSuccess: () => {
      if (assignmentId) {
        queryClient.invalidateQueries({ queryKey: assignmentsKeys.detail(assignmentId) });
        queryClient.invalidateQueries({ queryKey: assignmentsKeys.submissions(assignmentId) });
      }
      if (submissionId) {
        queryClient.invalidateQueries({ queryKey: assignmentsKeys.submissionDetail(submissionId) });
      }
    },
  });
}
