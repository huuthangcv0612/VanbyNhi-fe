import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  ExternalLink,
  Users,
  PanelRightClose,
  PanelRightOpen,
  User as UserIcon,
  Sparkles,
} from 'lucide-react';
import { attendanceService } from '../services/attendance.service';
import { OnlineMeetAttendancePanel } from '../components/OnlineMeetAttendancePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import {
  getSessionStatusMeta,
  formatDate,
  formatTime,
} from '@/utils/formatters';
import { getApiErrorMessage } from '@/lib/api-client';

export function TeacherOnlineClassroomPage() {
  const { sessionId } = useParams<{ sessionId: string }>();

  // State thu gọn / mở rộng bảng điểm danh trên desktop
  const [isAttendanceCollapsed, setIsAttendanceCollapsed] = useState(false);

  // State tab trên mobile / tablet: 'meet' | 'attendance'
  const [mobileTab, setMobileTab] = useState<'meet' | 'attendance'>('meet');

  // Lấy dữ liệu buổi học kèm điểm danh
  const {
    data: attendanceData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['session-attendance', sessionId],
    queryFn: () => attendanceService.getSessionAttendance(sessionId!),
    enabled: Boolean(sessionId),
  });

  const session = attendanceData?.session;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          <Skeleton className="lg:col-span-2 h-full rounded-2xl" />
          <Skeleton className="h-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !session) {
    return (
      <div className="space-y-6">
        <Link
          to="/teacher/sessions"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách buổi học
        </Link>
        <ErrorState
          title="Không thể tải thông tin phòng học"
          message={getApiErrorMessage(error)}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const statusMeta = getSessionStatusMeta(session.status);
  const isLive = session.status === 'IN_PROGRESS';
  const meetUrl = session.meetUrl;

  return (
    <div className="space-y-4">
      {/* Header buổi học */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 flex-wrap">
              <Link
                to="/teacher/classes"
                className="hover:text-amber-800 transition-colors"
              >
                Lớp học
              </Link>
              <span>/</span>
              <Link
                to={`/teacher/classes/${session.class.id}`}
                className="hover:text-amber-800 transition-colors font-semibold truncate max-w-xs"
              >
                {session.class.name}
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-bold truncate max-w-xs">
                {session.title}
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap pt-1">
              <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 truncate">
                {session.title}
              </h1>
              {isLive ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-rose-600" />
                  Đang diễn ra (LIVE)
                </span>
              ) : (
                <Badge className={statusMeta.badgeClass}>{statusMeta.label}</Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 pt-1">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>{formatDate(session.startTime)}</span>
              </div>
              <div className="flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  {formatTime(session.startTime)} - {formatTime(session.endTime)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Lớp: {session.class.name}</span>
              </div>
              {session.class.teacher?.fullName && (
                <div className="flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>GV: {session.class.teacher.fullName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Meet Action & Toggle Attendance */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {meetUrl ? (
              <a
                href={meetUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Video className="w-4 h-4" />
                <span>Mở Google Meet phòng học</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <span className="text-xs text-slate-400 italic bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                Chưa gắn liên kết Google Meet
              </span>
            )}

            {/* Nút thu gọn / mở bảng điểm danh trên desktop */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAttendanceCollapsed(!isAttendanceCollapsed)}
              className="hidden lg:inline-flex text-xs cursor-pointer"
              leftIcon={
                isAttendanceCollapsed ? (
                  <PanelRightOpen className="w-4 h-4 text-amber-700" />
                ) : (
                  <PanelRightClose className="w-4 h-4 text-slate-600" />
                )
              }
            >
              {isAttendanceCollapsed ? 'Mở điểm danh' : 'Ẩn điểm danh'}
            </Button>
          </div>
        </div>

        {/* Mobile / Tablet Tab switchers */}
        <div className="lg:hidden flex border-t border-slate-200 pt-3">
          <button
            type="button"
            onClick={() => setMobileTab('meet')}
            className={`flex-1 py-2 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer ${
              mobileTab === 'meet'
                ? 'border-amber-600 text-amber-900 bg-amber-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Phòng học Google Meet
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('attendance')}
            className={`flex-1 py-2 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer ${
              mobileTab === 'attendance'
                ? 'border-amber-600 text-amber-900 bg-amber-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Bảng điểm danh ({attendanceData?.students?.length || 0})
          </button>
        </div>
      </div>

      {/* Main Container: Desktop chia 65-70% Meet và 30-35% Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Area: Google Meet (65-70% width on Desktop = col-span-8 hoặc col-span-12 nếu collapse) */}
        <div
          className={`${
            isAttendanceCollapsed ? 'lg:col-span-12' : 'lg:col-span-8'
          } ${mobileTab === 'meet' ? 'block' : 'hidden lg:block'} space-y-4`}
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between min-h-[500px]">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      Khu vực phòng học trực tuyến
                    </h3>
                    <p className="text-xs text-slate-500">
                      Kết nối trực tiếp qua Google Meet chính thức của lớp học
                    </p>
                  </div>
                </div>

                {meetUrl && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Sẵn sàng kết nối
                  </span>
                )}
              </div>

              {/* Instructions banner */}
              <div className="bg-gradient-to-r from-violet-50/70 via-stone-50/40 to-amber-50/30 p-5 rounded-2xl border border-violet-100 space-y-3">
                <div className="flex items-center gap-2 text-violet-900 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Hướng dẫn trong giờ dạy & Điểm danh:</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-2 list-disc pl-5 leading-relaxed">
                  <li>
                    Bấm <strong>"Mở Google Meet trong tab mới"</strong> để bắt đầu giảng dạy qua camera và micro của Google Meet.
                  </li>
                  <li>
                    Bảng điểm danh bên phải cho phép bạn đánh dấu hiện diện của học sinh song song trong suốt buổi học.
                  </li>
                  <li>
                    Bạn có thể sử dụng nút <strong>"Tất cả có mặt"</strong> để đánh dấu nhanh, sau đó chỉnh sửa từng học sinh vắng hoặc vào muộn.
                  </li>
                  <li>
                    Kết thúc buổi học, hãy bấm <strong>"Chốt điểm danh"</strong> để hoàn tất số liệu chuyên cần và tính phí.
                  </li>
                </ul>
              </div>

              {/* Link card */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Đường dẫn phòng Meet:
                  </span>
                  {meetUrl && (
                    <span className="font-mono text-xs text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 truncate max-w-sm">
                      {meetUrl}
                    </span>
                  )}
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    * Mở tab Meet không tự động ghi nhận điểm danh học sinh.
                  </span>
                  {meetUrl ? (
                    <a
                      href={meetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-violet-700 hover:bg-violet-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      <Video className="w-4 h-4" />
                      <span>Mở Google Meet trong tab mới &rarr;</span>
                    </a>
                  ) : (
                    <p className="text-xs text-amber-700 font-medium">
                      Vui lòng cập nhật link Google Meet trong cấu hình buổi học.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                Sĩ số lớp: {attendanceData?.students?.length || 0} học sinh
              </span>
              <span>Hệ thống quản lý lớp học Văn Cô Như Ý</span>
            </div>
          </div>
        </div>

        {/* Right Area: Attendance Panel (30-35% width on Desktop = col-span-4) */}
        {!isAttendanceCollapsed && (
          <div
            className={`lg:col-span-4 ${
              mobileTab === 'attendance' ? 'block' : 'hidden lg:block'
            } h-[750px] sticky top-4`}
          >
            <OnlineMeetAttendancePanel
              sessionId={session.id}
              isCollapsed={isAttendanceCollapsed}
              onToggleCollapse={() => setIsAttendanceCollapsed(!isAttendanceCollapsed)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
