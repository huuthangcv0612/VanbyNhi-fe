import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  ExternalLink,
  Users,
  User as UserIcon,
  Play,
  Square,
  Copy,
  Check,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmModal } from '@/features/classes/components/ConfirmModal';
import { TeacherMeetModal } from './TeacherMeetModal';
import { useToast } from '@/hooks/useToast';
import { getApiErrorMessage } from '@/lib/api-client';
import { formatDate, formatTime } from '@/utils/formatters';
import { isValidMeetUrl } from '@/utils/url.utils';
import { teacherClassesService } from '@/features/classes/services/classes.service';
import type { SessionStatus } from '@/types/common.types';

export interface TeacherSessionHeaderProps {
  sessionId: string;
  title: string;
  status: SessionStatus;
  startTime: string;
  endTime: string;
  classInfo: {
    id: string;
    name: string;
    defaultMeetUrl?: string | null;
    teacher?: {
      id: string;
      fullName: string;
    } | null;
  };
  meetUrl?: string | null;
}

export function TeacherSessionHeader({
  sessionId,
  title,
  status,
  startTime,
  endTime,
  classInfo,
  meetUrl,
}: TeacherSessionHeaderProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [isMeetModalOpen, setIsMeetModalOpen] = useState(false);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [isJoiningMeet, setIsJoiningMeet] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Invalidate session queries khi trạng thái thay đổi
  const invalidateSessionData = () => {
    queryClient.invalidateQueries({ queryKey: ['session-attendance', sessionId] });
    queryClient.invalidateQueries({ queryKey: ['session-attendance-summary', sessionId] });
    queryClient.invalidateQueries({ queryKey: ['session-detail', sessionId] });
    queryClient.invalidateQueries({ queryKey: ['teacher-meet-access', sessionId] });
  };

  // Mutation: Bắt đầu buổi học (IN_PROGRESS)
  const startSessionMutation = useMutation({
    mutationFn: () => teacherClassesService.startSession(sessionId),
    onSuccess: () => {
      invalidateSessionData();
    },
  });

  // Xử lý bắt đầu buổi học và mở link Meet trong tab mới an toàn
  const handleStartSession = async () => {
    // 1. Mở trước tab mới đồng bộ theo thao tác click để tránh popup blocker
    let newTab: Window | null = null;
    try {
      newTab = window.open('about:blank', '_blank');
    } catch {
      // Browser prevented popup opening
    }

    try {
      const res = await startSessionMutation.mutateAsync();
      setIsStartModalOpen(false);

      if (res.meetingUri && isValidMeetUrl(res.meetingUri)) {
        if (newTab && !newTab.closed) {
          newTab.location.href = res.meetingUri;
        } else {
          window.open(res.meetingUri, '_blank');
        }
        showToast({
          type: 'success',
          title: 'Buổi học đã bắt đầu (LIVE)',
          message:
            'Đang mở phòng Google Meet trong tab mới. Trang VanbyNhi vẫn được giữ nguyên để bạn điểm danh và dạy học.',
        });
      } else {
        if (newTab && !newTab.closed) {
          newTab.close();
        }
        showToast({
          type: 'info',
          title: 'Buổi học đã bắt đầu (LIVE)',
          message:
            res.message ||
            'Trạng thái buổi học đã chuyển sang Đang diễn ra nhưng chưa có đường dẫn Google Meet.',
        });
      }
    } catch (err) {
      if (newTab && !newTab.closed) {
        newTab.close();
      }
      showToast({
        type: 'error',
        title: 'Không thể bắt đầu buổi học',
        message: getApiErrorMessage(err),
      });
    }
  };

  // Mutation: Kết thúc buổi học (COMPLETED)
  const endSessionMutation = useMutation({
    mutationFn: () => teacherClassesService.endSession(sessionId),
    onSuccess: (res) => {
      showToast({
        type: 'success',
        title: 'Buổi học đã kết thúc',
        message: res.message || 'Trạng thái buổi học đã chuyển sang Đã hoàn thành (COMPLETED)',
      });
      setIsEndModalOpen(false);
      invalidateSessionData();
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Không thể kết thúc buổi học',
        message: getApiErrorMessage(err),
      });
    },
  });

  // Xử lý mở Google Meet trong tab mới với kỹ thuật chống popup blocker
  const handleJoinMeet = async () => {
    if (isJoiningMeet) return;

    // 1. Mở cửa sổ chờ đồng bộ từ thao tác click của người dùng
    let newTab: Window | null = null;
    try {
      newTab = window.open('about:blank', '_blank');
    } catch {
      // Pop-up prevented
    }

    setIsJoiningMeet(true);

    try {
      // 2. Gọi API xác thực link Meet chính thức từ Backend
      const meetAccess = await teacherClassesService.getTeacherMeetAccess(sessionId);

      if (meetAccess.effectiveMeetUrl && isValidMeetUrl(meetAccess.effectiveMeetUrl)) {
        // 3. Link hợp lệ -> điều hướng tab chờ sang Google Meet
        if (newTab && !newTab.closed) {
          newTab.location.href = meetAccess.effectiveMeetUrl;
        } else {
          window.open(meetAccess.effectiveMeetUrl, '_blank');
        }
        showToast({
          type: 'success',
          title: 'Đang mở Google Meet trong tab mới',
          message: 'Trang quản lý VanbyNhi vẫn được giữ nguyên để bạn giảng dạy và điểm danh.',
        });
      } else {
        // 4. Chưa có link hợp lệ -> đóng tab chờ và mở modal cấu hình
        if (newTab && !newTab.closed) {
          newTab.close();
        }
        showToast({
          type: 'warning',
          title: 'Chưa có đường dẫn Google Meet hợp lệ',
          message: 'Vui lòng cung cấp link Google Meet hợp lệ (https://meet.google.com/...) cho buổi học này.',
        });
        setIsMeetModalOpen(true);
      }
    } catch (err) {
      if (newTab && !newTab.closed) {
        newTab.close();
      }
      showToast({
        type: 'error',
        title: 'Không thể lấy thông tin phòng Google Meet',
        message: getApiErrorMessage(err),
      });
    } finally {
      setIsJoiningMeet(false);
    }
  };

  const handleCopyMeetLink = async () => {
    const linkToCopy = meetUrl || classInfo.defaultMeetUrl;
    if (!linkToCopy) {
      showToast({
        type: 'warning',
        title: 'Chưa có liên kết Google Meet để sao chép',
        message: 'Buổi học chưa được gắn đường dẫn Google Meet.',
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(linkToCopy);
      setIsCopied(true);
      showToast({
        type: 'success',
        title: 'Đã sao chép liên kết Google Meet',
        message: 'Đường dẫn phòng học đã được lưu vào clipboard.',
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      showToast({
        type: 'error',
        title: 'Không thể sao chép liên kết',
        message: 'Trình duyệt không cho phép truy cập clipboard.',
      });
    }
  };

  // Ánh xạ trạng thái tiếng Việt
  const getStatusBadge = () => {
    switch (status) {
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-rose-600" />
            Đang diễn ra (LIVE)
          </span>
        );
      case 'SCHEDULED':
        return (
          <Badge className="bg-sky-100 text-sky-800 border-sky-200">
            Chưa bắt đầu
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
            Đã hoàn thành
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-200">
            Đã hủy
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const isLive = status === 'IN_PROGRESS';
  const isScheduled = status === 'SCHEDULED';

  const effectiveLink = meetUrl || classInfo.defaultMeetUrl;

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 flex-wrap">
            <Link
              to="/teacher/classes"
              className="inline-flex items-center gap-1 hover:text-amber-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Danh sách lớp</span>
            </Link>
            <span>/</span>
            <Link
              to={`/teacher/classes/${classInfo.id}`}
              className="hover:text-amber-800 transition-colors font-semibold truncate max-w-xs"
            >
              {classInfo.name}
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-bold truncate max-w-xs">
              {title}
            </span>
          </div>

          {/* Quick link back */}
          <Link
            to={`/teacher/classes/${classInfo.id}`}
            className="text-xs text-amber-700 hover:text-amber-800 font-medium inline-flex items-center gap-1"
          >
            Quản lý lớp học &rarr;
          </Link>
        </div>

        {/* Title, Metadata & Actions Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 tracking-tight">
                {title}
              </h1>
              {getStatusBadge()}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="font-medium">{formatDate(startTime)}</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>
                  {formatTime(startTime)} - {formatTime(endTime)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Lớp: <strong className="text-slate-700">{classInfo.name}</strong></span>
              </div>
              {classInfo.teacher?.fullName && (
                <div className="flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>GV: <strong className="text-slate-700">{classInfo.teacher.fullName}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Join Meet Action */}
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleJoinMeet}
              isLoading={isJoiningMeet}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs cursor-pointer"
              leftIcon={<Video className="w-4 h-4" />}
              rightIcon={<ExternalLink className="w-3.5 h-3.5 opacity-80" />}
            >
              Tham gia Google Meet
            </Button>

            {/* Copy Meet Link */}
            {effectiveLink && (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleCopyMeetLink}
                title="Sao chép link Google Meet"
                className="cursor-pointer"
                leftIcon={
                  isCopied ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-600" />
                  )
                }
              >
                {isCopied ? 'Đã chép link' : 'Chép link'}
              </Button>
            )}

            {/* Config Meet URL Button */}
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsMeetModalOpen(true)}
              title="Cài đặt hoặc sửa link Google Meet"
              className="cursor-pointer"
              leftIcon={<Settings className="w-4 h-4 text-slate-600" />}
            >
              Sửa link Meet
            </Button>

            {/* Start Session Button */}
            {isScheduled && (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => setIsStartModalOpen(true)}
                className="bg-sky-600 hover:bg-sky-700 text-white font-semibold cursor-pointer"
                leftIcon={<Play className="w-4 h-4" />}
              >
                Bắt đầu buổi học
              </Button>
            )}

            {/* End Session Button */}
            {isLive && (
              <Button
                type="button"
                variant="danger"
                size="md"
                onClick={() => setIsEndModalOpen(true)}
                className="font-semibold cursor-pointer"
                leftIcon={<Square className="w-4 h-4" />}
              >
                Kết thúc buổi học
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Modal Cấu hình Meet URL */}
      <TeacherMeetModal
        isOpen={isMeetModalOpen}
        onClose={() => setIsMeetModalOpen(false)}
        sessionId={sessionId}
        currentMeetUrl={effectiveLink}
        onSuccess={invalidateSessionData}
      />

      {/* Modal xác nhận bắt đầu buổi học */}
      <ConfirmModal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
        onConfirm={handleStartSession}
        title="Bắt đầu buổi học trực tuyến"
        description={
          <div className="space-y-2 text-sm text-slate-600">
            <p>
              Bạn chuẩn bị chuyển trạng thái buổi học <strong>"{title}"</strong> sang{' '}
              <strong className="text-rose-600">Đang diễn ra (LIVE)</strong>.
            </p>
            <p className="text-xs text-slate-500">
              Học sinh trong lớp sẽ nhìn thấy trạng thái trực tuyến và có thể kết nối vào phòng học Google Meet.
            </p>
          </div>
        }
        confirmLabel="Bắt đầu ngay"
        variant="primary"
        isLoading={startSessionMutation.isPending}
      />

      {/* Modal xác nhận kết thúc buổi học */}
      <ConfirmModal
        isOpen={isEndModalOpen}
        onClose={() => setIsEndModalOpen(false)}
        onConfirm={() => endSessionMutation.mutate()}
        title="Kết thúc buổi học trực tuyến"
        description={
          <div className="space-y-2 text-sm text-slate-600">
            <p>
              Bạn có chắc chắn muốn kết thúc buổi học <strong>"{title}"</strong>?
            </p>
            <p className="text-xs text-slate-500">
              Sau khi kết thúc, trạng thái buổi học sẽ chuyển sang <strong>Đã hoàn thành</strong>. Hãy nhớ kiểm tra và chốt sổ điểm danh nếu đã hoàn tất.
            </p>
          </div>
        }
        confirmLabel="Kết thúc buổi học"
        variant="danger"
        isLoading={endSessionMutation.isPending}
      />
    </>
  );
}
