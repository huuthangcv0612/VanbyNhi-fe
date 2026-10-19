import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStudentMeetJoin, isValidHttpUrl } from './useStudentMeetJoin';
import { studentClassesService } from '../services/classes.service';
import * as toastHook from '@/hooks/useToast';

vi.mock('../services/classes.service', () => ({
  studentClassesService: {
    getMeetJoinUrl: vi.fn(),
    getClassMeet: vi.fn(),
  },
}));

describe('useStudentMeetJoin', () => {
  const mockShowToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(toastHook, 'useToast').mockReturnValue({
      showToast: mockShowToast,
      toasts: [],
      removeToast: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    });
  });

  describe('isValidHttpUrl', () => {
    it('returns true for valid https or http urls', () => {
      expect(isValidHttpUrl('https://meet.google.com/abc-defg-hij')).toBe(true);
      expect(isValidHttpUrl('http://localhost:3000')).toBe(true);
    });

    it('returns false for invalid urls, javascript: schemes, or null/empty', () => {
      expect(isValidHttpUrl(null)).toBe(false);
      expect(isValidHttpUrl(undefined)).toBe(false);
      expect(isValidHttpUrl('')).toBe(false);
      expect(isValidHttpUrl('javascript:alert(1)')).toBe(false);
      expect(isValidHttpUrl('not-a-url')).toBe(false);
    });
  });

  it('successful join: opens newTab and redirects location to meetUrl', async () => {
    const mockWindowLocation = { href: '' };
    const mockNewTab = { location: mockWindowLocation, closed: false, close: vi.fn() } as unknown as Window;
    const windowOpenSpy = vi.spyOn(window, 'open').mockReturnValue(mockNewTab);

    vi.mocked(studentClassesService.getMeetJoinUrl).mockResolvedValueOnce({
      canJoin: true,
      meetUrl: 'https://meet.google.com/abc-defg-hij',
      sessionId: 'sess-1',
      title: 'Buổi 1',
      startTime: '2026-10-15T19:00:00Z',
      endTime: '2026-10-15T21:00:00Z',
      status: 'SCHEDULED',
      isLive: false,
    });

    const { result } = renderHook(() => useStudentMeetJoin());

    await act(async () => {
      await result.current.joinMeet('sess-1');
    });

    expect(windowOpenSpy).toHaveBeenCalledWith('about:blank', '_blank');
    expect(studentClassesService.getMeetJoinUrl).toHaveBeenCalledWith('sess-1');
    expect(mockNewTab.location.href).toBe('https://meet.google.com/abc-defg-hij');
    expect(mockNewTab.close).not.toHaveBeenCalled();
  });

  it('403 Forbidden: closes newTab and displays backend error message in toast', async () => {
    const mockNewTab = { location: { href: '' }, closed: false, close: vi.fn() } as unknown as Window;
    vi.spyOn(window, 'open').mockReturnValue(mockNewTab);

    const forbiddenError = {
      isAxiosError: true,
      response: {
        status: 403,
        data: {
          statusCode: 403,
          message: 'Chưa đến thời gian mở phòng học. Cửa sổ tham gia mở trước giờ học 15 phút.',
          error: 'Forbidden',
        },
      },
    };

    vi.mocked(studentClassesService.getMeetJoinUrl).mockRejectedValueOnce(forbiddenError);

    const { result } = renderHook(() => useStudentMeetJoin());

    await act(async () => {
      await result.current.joinMeet('sess-1');
    });

    expect(mockNewTab.close).toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith({
      type: 'error',
      title: 'Không thể vào phòng học',
      message: 'Chưa đến thời gian mở phòng học. Cửa sổ tham gia mở trước giờ học 15 phút.',
    });
  });

  it('blocked popup: sets popupBlockedUrl and informs student to open manually', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null); // Popup was blocked by browser

    vi.mocked(studentClassesService.getMeetJoinUrl).mockResolvedValueOnce({
      canJoin: true,
      meetUrl: 'https://meet.google.com/abc-defg-hij',
      sessionId: 'sess-1',
      title: 'Buổi 1',
      startTime: '2026-10-15T19:00:00Z',
      endTime: '2026-10-15T21:00:00Z',
      status: 'SCHEDULED',
      isLive: false,
    });

    const { result } = renderHook(() => useStudentMeetJoin());

    await act(async () => {
      await result.current.joinMeet('sess-1');
    });

    expect(result.current.popupBlockedUrl).toBe('https://meet.google.com/abc-defg-hij');
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'info',
        title: 'Cửa sổ mới bị chặn',
      }),
    );
  });

  it('joinClassMeet: opens newTab and redirects location to class meetingUri', async () => {
    const mockWindowLocation = { href: '' };
    const mockNewTab = { location: mockWindowLocation, closed: false, close: vi.fn() } as unknown as Window;
    const windowOpenSpy = vi.spyOn(window, 'open').mockReturnValue(mockNewTab);

    vi.mocked(studentClassesService.getClassMeet).mockResolvedValueOnce({
      classId: 'c1',
      className: 'Lớp 12A',
      meetingUri: 'https://meet.google.com/class-meet-url',
      status: 'READY',
      instructions: 'Vui lòng chờ giáo viên duyệt...',
    });

    const { result } = renderHook(() => useStudentMeetJoin());

    await act(async () => {
      await result.current.joinClassMeet('c1');
    });

    expect(windowOpenSpy).toHaveBeenCalledWith('about:blank', '_blank');
    expect(studentClassesService.getClassMeet).toHaveBeenCalledWith('c1');
    expect(mockNewTab.location.href).toBe('https://meet.google.com/class-meet-url');
    expect(mockNewTab.close).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'info',
        title: 'Lưu ý khi tham gia',
        message: 'Vui lòng chờ giáo viên duyệt...',
      }),
    );
  });
});
