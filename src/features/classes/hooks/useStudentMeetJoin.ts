import { useState, useCallback } from 'react';
import { studentClassesService } from '../services/classes.service';
import { getApiErrorMessage } from '@/lib/api-client';
import { useToast } from '@/hooks/useToast';
import { isValidHttpUrl, isValidMeetUrl } from '@/utils/url.utils';

export { isValidHttpUrl, isValidMeetUrl };

export function useStudentMeetJoin() {
  const { showToast } = useToast();
  const [joiningSessionId, setJoiningSessionId] = useState<string | null>(null);
  const [joiningClassId, setJoiningClassId] = useState<string | null>(null);
  const [popupBlockedUrl, setPopupBlockedUrl] = useState<string | null>(null);

  /**
   * Tham gia Google Meet theo buổi học cụ thể (Session)
   * GET /student/sessions/:sessionId/join-meet
   */
  const joinMeet = useCallback(
    async (sessionId: string) => {
      if (joiningSessionId || joiningClassId) return;

      setPopupBlockedUrl(null);
      setJoiningSessionId(sessionId);

      // Mở trước tab trống để tránh trình duyệt chặn popup sau async API call
      let newTab: Window | null = null;
      try {
        newTab = window.open('about:blank', '_blank');
      } catch {
        // Popup could not be opened synchronously
      }

      try {
        const result = await studentClassesService.getMeetJoinUrl(sessionId);

        if (result.canJoin && result.meetUrl && (isValidMeetUrl(result.meetUrl) || isValidHttpUrl(result.meetUrl))) {
          if (newTab && !newTab.closed) {
            newTab.location.href = result.meetUrl;
          } else {
            // Trường hợp popup bị chặn hoàn toàn
            setPopupBlockedUrl(result.meetUrl);
            showToast({
              type: 'info',
              title: 'Cửa sổ mới bị chặn',
              message: 'Vui lòng bấm vào liên kết hiển thị trên màn hình để mở Google Meet.',
            });
          }
        } else {
          if (newTab && !newTab.closed) {
            newTab.close();
          }
          showToast({
            type: 'warning',
            title: 'Chưa thể tham gia',
            message: 'Chưa đủ điều kiện tham gia phòng Google Meet.',
          });
        }
      } catch (error) {
        if (newTab && !newTab.closed) {
          newTab.close();
        }

        const message = getApiErrorMessage(error);
        showToast({
          type: 'error',
          title: 'Không thể vào phòng học',
          message,
        });
      } finally {
        setJoiningSessionId(null);
      }
    },
    [joiningSessionId, joiningClassId, showToast],
  );

  /**
   * Tham gia Google Meet của lớp học chung
   * GET /student/classes/:classId/meet
   */
  const joinClassMeet = useCallback(
    async (classId: string) => {
      if (joiningSessionId || joiningClassId) return;

      setPopupBlockedUrl(null);
      setJoiningClassId(classId);

      let newTab: Window | null = null;
      try {
        newTab = window.open('about:blank', '_blank');
      } catch {
        // Popup blocked
      }

      try {
        const result = await studentClassesService.getClassMeet(classId);

        if (result.meetingUri && (isValidMeetUrl(result.meetingUri) || isValidHttpUrl(result.meetingUri))) {
          if (newTab && !newTab.closed) {
            newTab.location.href = result.meetingUri;
          } else {
            setPopupBlockedUrl(result.meetingUri);
            showToast({
              type: 'info',
              title: 'Cửa sổ mới bị chặn',
              message: 'Vui lòng bấm vào liên kết hiển thị trên màn hình để mở Google Meet.',
            });
          }

          if (result.instructions) {
            showToast({
              type: 'info',
              title: 'Lưu ý khi tham gia',
              message: result.instructions,
            });
          }
        } else {
          if (newTab && !newTab.closed) {
            newTab.close();
          }
          showToast({
            type: 'warning',
            title: 'Chưa thể tham gia',
            message: 'Lớp học chưa có đường dẫn Google Meet sẵn sàng.',
          });
        }
      } catch (error) {
        if (newTab && !newTab.closed) {
          newTab.close();
        }

        const message = getApiErrorMessage(error);
        showToast({
          type: 'error',
          title: 'Không thể vào phòng học',
          message,
        });
      } finally {
        setJoiningClassId(null);
      }
    },
    [joiningSessionId, joiningClassId, showToast],
  );

  return {
    joinMeet,
    joinClassMeet,
    isJoining: Boolean(joiningSessionId || joiningClassId),
    joiningSessionId,
    joiningClassId,
    popupBlockedUrl,
    clearBlockedUrl: () => setPopupBlockedUrl(null),
  };
}
