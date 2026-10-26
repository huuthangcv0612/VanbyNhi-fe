import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import axios from 'axios';
import { useDocumentAutosave } from './useDocumentAutosave';
import { teacherDocumentsService } from '../services/documents.service';

vi.mock('../services/documents.service', () => ({
  teacherDocumentsService: {
    updateContent: vi.fn(),
  },
}));

vi.mock('@/lib/storage', () => ({
  storage: {
    getUser: vi.fn().mockReturnValue({ id: 'teacher_123', fullName: 'Cô Nhị' }),
  },
}));

describe('useDocumentAutosave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with default revision and idle status', () => {
    const { result } = renderHook(() =>
      useDocumentAutosave({
        documentId: 'doc_1',
        initialRevision: 1,
        debounceMs: 1000,
      }),
    );

    expect(result.current.saveStatus).toBe('idle');
    expect(result.current.currentRevision).toBe(1);
    expect(result.current.isDirty).toBe(false);
  });

  it('debounces auto-save trigger by configured delay', async () => {
    vi.mocked(teacherDocumentsService.updateContent).mockResolvedValueOnce({
      message: 'Lưu thành công',
      revision: 2,
      updatedAt: '2026-10-26T10:00:00.000Z',
    });

    const { result } = renderHook(() =>
      useDocumentAutosave({
        documentId: 'doc_1',
        initialRevision: 1,
        debounceMs: 1000,
      }),
    );

    act(() => {
      result.current.triggerSave({ type: 'doc', content: [{ type: 'paragraph' }] });
    });

    expect(result.current.isDirty).toBe(true);
    // Before debounce timer expires
    expect(teacherDocumentsService.updateContent).not.toHaveBeenCalled();

    // Fast-forward 500ms (not yet triggered)
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(teacherDocumentsService.updateContent).not.toHaveBeenCalled();

    // Fast-forward past 1000ms
    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    expect(teacherDocumentsService.updateContent).toHaveBeenCalledWith('doc_1', {
      expectedRevision: 1,
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
      versionReason: undefined,
    });

    expect(result.current.saveStatus).toBe('saved');
    expect(result.current.currentRevision).toBe(2);
    expect(result.current.isDirty).toBe(false);
  });

  it('queues and serializes saves when another save is already in-flight', async () => {
    let resolveFirstSave: (val: any) => void;
    const firstPromise = new Promise((resolve) => {
      resolveFirstSave = resolve;
    });

    vi.mocked(teacherDocumentsService.updateContent)
      .mockImplementationOnce(() => firstPromise as any)
      .mockResolvedValueOnce({
        message: 'Lưu lần 2 thành công',
        revision: 3,
        updatedAt: '2026-10-26T10:05:00.000Z',
      });

    const { result } = renderHook(() =>
      useDocumentAutosave({
        documentId: 'doc_1',
        initialRevision: 1,
        debounceMs: 1000,
      }),
    );

    // Trigger update 1
    act(() => {
      result.current.triggerSave({ type: 'doc', content: [{ text: 'Version 1' }] });
    });
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(teacherDocumentsService.updateContent).toHaveBeenCalledTimes(1);

    // Trigger update 2 while update 1 is pending
    act(() => {
      result.current.triggerSave({ type: 'doc', content: [{ text: 'Version 2' }] });
    });
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    // Should NOT have called updateContent twice concurrently
    expect(teacherDocumentsService.updateContent).toHaveBeenCalledTimes(1);

    // Now resolve first save
    await act(async () => {
      resolveFirstSave!({
        message: 'Lưu thành công',
        revision: 2,
        updatedAt: '2026-10-26T10:00:00.000Z',
      });
    });

    // Second save should automatically be processed with expectedRevision = 2
    expect(teacherDocumentsService.updateContent).toHaveBeenCalledTimes(2);
    expect(teacherDocumentsService.updateContent).toHaveBeenLastCalledWith('doc_1', {
      expectedRevision: 2,
      content: { type: 'doc', content: [{ text: 'Version 2' }] },
      versionReason: undefined,
    });
  });

  it('handles 409 REVISION_CONFLICT error without overwriting local content', async () => {
    const conflictAxiosError = new axios.AxiosError(
      'Conflict',
      '409',
      undefined,
      undefined,
      {
        status: 409,
        statusText: 'Conflict',
        data: {
          statusCode: 409,
          error: 'Conflict',
          errorCode: 'REVISION_CONFLICT',
          message: 'Xung đột phiên bản: Tài liệu đã được cập nhật bởi phiên làm việc khác',
          currentRevision: 4,
          expectedRevision: 2,
        },
        headers: {},
        config: {} as any,
      },
    );

    vi.mocked(teacherDocumentsService.updateContent).mockRejectedValueOnce(conflictAxiosError);

    const { result } = renderHook(() =>
      useDocumentAutosave({
        documentId: 'doc_1',
        initialRevision: 2,
        debounceMs: 1000,
      }),
    );

    act(() => {
      result.current.triggerSave({ type: 'doc', content: [{ text: 'My local work' }] });
    });

    await act(async () => {
      vi.advanceTimersByTime(1100);
    });

    expect(result.current.saveStatus).toBe('conflict');
    expect(result.current.conflictData).toEqual({
      serverRevision: 4,
      expectedRevision: 2,
    });
    expect(result.current.errorMessage).toContain('Xung đột phiên bản');
  });

  it('persists backup draft to localStorage and recovers it', () => {
    const { result } = renderHook(() =>
      useDocumentAutosave({
        documentId: 'doc_1',
        initialRevision: 1,
      }),
    );

    act(() => {
      result.current.triggerSave({ type: 'doc', content: [{ text: 'Draft text' }] });
    });

    const draft = result.current.getLocalDraft();
    expect(draft).not.null;
    expect(draft?.content).toEqual({ type: 'doc', content: [{ text: 'Draft text' }] });
    expect(draft?.revision).toBe(1);

    act(() => {
      result.current.dismissLocalDraft();
    });
    expect(result.current.getLocalDraft()).toBeNull();
  });
});
