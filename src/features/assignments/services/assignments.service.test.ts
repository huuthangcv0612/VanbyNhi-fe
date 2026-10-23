import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api-client';
import { assignmentsService } from './assignments.service';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('assignmentsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('findAll calls GET /assignments with query params', async () => {
    const mockData = { items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 1 } };
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mockData });

    const result = await assignmentsService.findAll({ classId: 'c1', page: 2 });
    expect(apiClient.get).toHaveBeenCalledWith('/assignments', {
      params: { classId: 'c1', page: 2 },
    });
    expect(result).toEqual(mockData);
  });

  it('findOne calls GET /assignments/:id', async () => {
    const mockAssignment = { id: 'a1', title: 'Bài tập 1' };
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mockAssignment });

    const result = await assignmentsService.findOne('a1');
    expect(apiClient.get).toHaveBeenCalledWith('/assignments/a1');
    expect(result).toEqual(mockAssignment);
  });

  it('create calls POST /assignments with properly formatted payload', async () => {
    const mockRes = { message: 'Tạo thành công', assignment: { id: 'a1' } };
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mockRes });

    const result = await assignmentsService.create({
      classId: 'c1',
      title: ' Bài tập nghị luận ',
      maxScore: 10,
      allowResubmission: true,
      maxAttempts: 3,
      dueDate: '2026-11-01T00:00:00.000Z',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/assignments', {
      classId: 'c1',
      title: 'Bài tập nghị luận',
      sessionId: undefined,
      description: undefined,
      maxScore: 10,
      allowResubmission: true,
      maxAttempts: 3,
      fileUrls: undefined,
      attachmentKeys: undefined,
      dueDate: '2026-11-01T00:00:00.000Z',
    });
    expect(result).toEqual(mockRes);
  });

  it('update calls PATCH /assignments/:id', async () => {
    const mockRes = { message: 'Cập nhật thành công', assignment: { id: 'a1' } };
    (apiClient.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mockRes });

    const result = await assignmentsService.update('a1', {
      title: 'Tiêu đề mới',
      maxScore: 9.5,
    });

    expect(apiClient.patch).toHaveBeenCalledWith('/assignments/a1', {
      title: 'Tiêu đề mới',
      maxScore: 9.5,
    });
    expect(result).toEqual(mockRes);
  });

  it('remove calls DELETE /assignments/:id', async () => {
    const mockRes = { message: 'Xóa bài tập thành công' };
    (apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mockRes });

    const result = await assignmentsService.remove('a1');
    expect(apiClient.delete).toHaveBeenCalledWith('/assignments/a1');
    expect(result).toEqual(mockRes);
  });

  it('getStats calls GET /assignments/:id/stats', async () => {
    const mockStats = {
      assignmentId: 'a1',
      totalEligible: 20,
      submittedCount: 15,
      notSubmittedCount: 5,
    };
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mockStats });

    const result = await assignmentsService.getStats('a1');
    expect(apiClient.get).toHaveBeenCalledWith('/assignments/a1/stats');
    expect(result).toEqual(mockStats);
  });

  it('getEligibleStudents calls GET /assignments/:id/eligible-students', async () => {
    const mockEligible = {
      assignmentId: 'a1',
      students: [{ studentId: 's1', status: 'NOT_SUBMITTED' }],
    };
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mockEligible });

    const result = await assignmentsService.getEligibleStudents('a1');
    expect(apiClient.get).toHaveBeenCalledWith('/assignments/a1/eligible-students');
    expect(result).toEqual(mockEligible);
  });

  it('submitAssignment calls POST /assignments/:id/submissions', async () => {
    const mockRes = { message: 'Nộp bài thành công', submission: { id: 'sub1' } };
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mockRes });

    const result = await assignmentsService.submitAssignment('a1', {
      content: 'Bài làm phân tích tác phẩm',
      attachmentKeys: ['key1'],
    });

    expect(apiClient.post).toHaveBeenCalledWith('/assignments/a1/submissions', {
      content: 'Bài làm phân tích tác phẩm',
      attachmentKeys: ['key1'],
      externalUrl: undefined,
      fileUrls: undefined,
    });
    expect(result).toEqual(mockRes);
  });

  it('getSubmissions calls GET /assignments/:id/submissions', async () => {
    const mockSubs = [{ id: 'sub1', attemptNumber: 1 }];
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mockSubs });

    const result = await assignmentsService.getSubmissions('a1', { studentId: 's1' });
    expect(apiClient.get).toHaveBeenCalledWith('/assignments/a1/submissions', {
      params: { studentId: 's1' },
    });
    expect(result).toEqual(mockSubs);
  });

  it('reviewSubmission calls POST /assignments/submissions/:submissionId/review', async () => {
    const mockRes = { message: 'Đã lưu bản nháp', review: { id: 'rev1', status: 'DRAFT' } };
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mockRes });

    const result = await assignmentsService.reviewSubmission('sub1', {
      score: 8.5,
      feedback: 'Lập luận sắc bén',
      status: 'DRAFT',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/assignments/submissions/sub1/review', {
      score: 8.5,
      feedback: 'Lập luận sắc bén',
      status: 'DRAFT',
      attachmentKeys: undefined,
    });
    expect(result).toEqual(mockRes);
  });

  it('returnSubmission calls POST /assignments/submissions/:submissionId/return', async () => {
    const mockRes = { message: 'Trả bài thành công', review: { id: 'rev1', status: 'RETURNED' } };
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mockRes });

    const result = await assignmentsService.returnSubmission('sub1');
    expect(apiClient.post).toHaveBeenCalledWith('/assignments/submissions/sub1/return', {});
    expect(result).toEqual(mockRes);
  });

  it('initUpload calls POST /assignments/upload-url', async () => {
    const mockRes = {
      uploadUrl: 'https://r2.example.com/put',
      storageKey: 'submissions/key1',
      uploadSessionId: 'sess1',
      expiresInSeconds: 300,
    };
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mockRes });

    const result = await assignmentsService.initUpload({
      targetType: 'SUBMISSION',
      originalName: 'bailam.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
    });

    expect(apiClient.post).toHaveBeenCalledWith('/assignments/upload-url', {
      targetType: 'SUBMISSION',
      originalName: 'bailam.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
      targetId: undefined,
    });
    expect(result).toEqual(mockRes);
  });

  it('getAttachmentDownloadUrl calls GET /assignments/attachments/:attachmentId/download-url', async () => {
    const mockRes = {
      downloadUrl: 'https://r2.example.com/get',
      expiresInSeconds: 300,
      originalName: 'debai.pdf',
      mimeType: 'application/pdf',
    };
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mockRes });

    const result = await assignmentsService.getAttachmentDownloadUrl('att1');
    expect(apiClient.get).toHaveBeenCalledWith('/assignments/attachments/att1/download-url');
    expect(result).toEqual(mockRes);
  });

  it('toggleKeepForever calls PATCH /assignments/attachments/:attachmentId/keep', async () => {
    const mockRes = { message: 'Đã đánh dấu lưu giữ vĩnh viễn', isKeepForever: true };
    (apiClient.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mockRes });

    const result = await assignmentsService.toggleKeepForever('att1', true);
    expect(apiClient.patch).toHaveBeenCalledWith('/assignments/attachments/att1/keep', {
      isKeepForever: true,
    });
    expect(result).toEqual(mockRes);
  });
});
