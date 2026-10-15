import { useState, useCallback } from 'react';
import { studentClassesService } from '../services/classes.service';
import { getApiErrorMessage } from '@/lib/api-client';
import { useToast } from '@/hooks/useToast';

export function isValidHttpUrl(urlString?: string | null): boolean {
  if (!urlString) return false;
  try {
    const url = new URL(urlString.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function useStudentMeetJoin() {
  const { showToast } = useToast();
  const [joiningSessionId, setJoiningSessionId] = useState<string | null>(null);
  const [popupBlockedUrl, setPopupBlockedUrl] = useState<string | null>(null);

  const joinMeet = useCallback(
    async (sessionId: string) => {
      if (joiningSessionId) return;

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

        if (result.canJoin && result.meetUrl && isValidHttpUrl(result.meetUrl)) {
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
    [joiningSessionId, showToast],
  );

  return {
    joinMeet,
    isJoining: Boolean(joiningSessionId),
    joiningSessionId,
    popupBlockedUrl,
    clearBlockedUrl: () => setPopupBlockedUrl(null),
  };
}
