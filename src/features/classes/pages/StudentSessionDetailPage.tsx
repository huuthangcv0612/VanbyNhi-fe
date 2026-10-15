import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  ExternalLink,
  BookOpen,
  FileText,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  Download,
  AlertTriangle,
  User as UserIcon,
} from 'lucide-react';
import { studentClassesService } from '../services/classes.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import {
  getSessionStatusMeta,
  getAttendanceStatusMeta,
  formatDate,
  formatDateTime,
  formatTime,
} from '@/utils/formatters';
import { getApiErrorMessage } from '@/lib/api-client';
import { useStudentMeetJoin } from '../hooks/useStudentMeetJoin';
import { CheckInModal } from '../components/CheckInModal';

function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function StudentSessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);

  const { joinMeet, isJoining, popupBlockedUrl, clearBlockedUrl } = useStudentMeetJoin();

  const {
    data: session,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['student-session-detail', sessionId],
    queryFn: () => studentClassesService.getSessionDetail(sessionId!),
    enabled: Boolean(sessionId),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-44 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !session) {
    return (
      <div className="space-y-6">
        <Link
          to="/student/classes"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách lớp học
        </Link>
        <ErrorState
          title="Không thể tải thông tin buổi học"
          message={getApiErrorMessage(error)}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const statusMeta = getSessionStatusMeta(session.status);
  const isLive = session.status === 'IN_PROGRESS' || session.meetAccess?.isLive;
  const isCancelled = session.status === 'CANCELLED';
  const isCompleted = session.status === 'COMPLETED';

  const attendance = session.myAttendance;
  const hasCheckedIn =
    attendance &&
    (attendance.status === 'PRESENT' || attendance.status === 'LATE');

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="space-y-2 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 flex-wrap">
          <Link
            to="/student/classes"
            className="hover:text-violet-700 transition-colors"
          >
            Lớp học của tôi
          </Link>
          <span>/</span>
          <Link
            to={`/student/classes/${session.class.id}`}
            className="hover:text-violet-700 transition-colors font-semibold"
          >
            {session.class.name}
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-bold truncate max-w-xs">
            {session.title}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold font-serif text-slate-900">
                {session.title}
              </h1>
              {isLive ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-rose-600" />
                  Đang diễn ra (LIVE)
                </span>
              ) : (
                <Badge className={statusMeta.badgeClass}>{statusMeta.label}</Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 pt-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-violet-600" />
                <span>{formatDate(session.startTime)}</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <Clock className="w-4 h-4 text-violet-600" />
                <span>
                  {formatTime(session.startTime)} - {formatTime(session.endTime)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <UserIcon className="w-4 h-4 text-slate-400" />
                <span>Giáo viên: {session.class.teacher?.fullName || '-'}</span>
              </div>
            </div>
          </div>

          <Link
            to={`/student/classes/${session.class.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors self-start sm:self-auto shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Về trang lớp học
          </Link>
        </div>
      </div>

      {/* Popup blocked helper banner */}
      {popupBlockedUrl && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-3 shadow-xs">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            Trình duyệt của bạn đã chặn tab mới. Vui lòng bấm vào liên kết để vào phòng Google Meet.
          </span>
          <a
            href={popupBlockedUrl}
            target="_blank"
            rel="noreferrer"
            onClick={clearBlockedUrl}
            className="font-bold underline text-amber-950 hover:text-amber-800 cursor-pointer"
          >
            Mở Google Meet ngay &rarr;
          </a>
        </div>
      )}

      {/* Top 2 Action Cards: Google Meet & Attendance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Google Meet Room */}
        <div className="rounded-2xl border border-violet-200/90 bg-gradient-to-br from-violet-50/70 via-stone-50/40 to-amber-50/30 p-5 shadow-xs flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Video className="w-5 h-5 text-violet-700" />
                Phòng học trực tuyến Google Meet
              </h3>
              {session.meetAccess?.canJoin && (
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" title="Cửa sổ mở" />
              )}
            </div>

            {session.meetAccess?.canJoin ? (
              <div className="space-y-2">
                <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl font-medium">
                  Buổi học đã mở cửa sổ tham gia. Bấm nút bên dưới để chuyển tiếp tới phòng Google Meet.
                </p>
                <div className="text-[11px] text-slate-500 font-mono">
                  Cửa sổ: {formatDateTime(session.meetAccess.opensAt)} &rarr; {formatDateTime(session.meetAccess.closesAt)}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Chưa thể vào phòng học:
                  </p>
                  <p className="text-slate-600">
                    {session.meetAccess?.reason || 'Cửa sổ tham gia mở trước giờ học 15 phút.'}
                  </p>
                </div>
                {session.meetAccess?.opensAt && (
                  <p className="text-[11px] text-slate-500">
                    Thời gian mở dự kiến: {formatDateTime(session.meetAccess.opensAt)}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-violet-100 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400">
              * Mở Meet không tự ghi nhận điểm danh
            </span>
            <Button
              type="button"
              size="sm"
              onClick={() => joinMeet(session.id)}
              isLoading={isJoining}
              disabled={!session.meetAccess?.canJoin || isJoining || isCancelled || isCompleted}
              className={`text-xs cursor-pointer shadow-xs ${
                session.meetAccess?.canJoin && !isCancelled && !isCompleted
                  ? 'bg-violet-700 hover:bg-violet-800 text-white'
                  : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'
              }`}
              leftIcon={<Video className="w-4 h-4" />}
              rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
            >
              {isLive ? 'Vào lớp ngay' : 'Tham gia Google Meet'}
            </Button>
          </div>
        </div>

        {/* Card 2: Điểm danh (Attendance) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Điểm danh buổi học
              </h3>
              {attendance && (
                <Badge className={getAttendanceStatusMeta(attendance.status).badgeClass} size="sm">
                  {getAttendanceStatusMeta(attendance.status).label}
                </Badge>
              )}
            </div>

            {hasCheckedIn ? (
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Bạn đã hoàn tất điểm danh cho buổi học này!
                </p>
                {attendance?.checkedInAt && (
                  <p className="text-slate-600">
                    Thời gian: {formatDateTime(attendance.checkedInAt)}
                  </p>
                )}
                {attendance?.note && (
                  <p className="text-slate-600 italic">
                    Ghi chú: {attendance.note}
                  </p>
                )}
              </div>
            ) : isCompleted ? (
              <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                Buổi học đã kết thúc. Bạn chưa ghi nhận điểm danh cho buổi này.
              </p>
            ) : isCancelled ? (
              <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">
                Buổi học đã bị hủy, không thể điểm danh.
              </p>
            ) : (
              <div className="space-y-1 text-xs text-slate-600">
                <p>
                  Bạn có thể tự xác nhận tham gia buổi học trong khung giờ học hợp lệ (mở trước giờ học 15 phút).
                </p>
                <p className="text-[11px] text-slate-400">
                  Hệ thống tự động ghi nhận <strong>Có mặt</strong> hoặc <strong>Đi muộn</strong> theo thời điểm bấm xác nhận.
                </p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
            {!hasCheckedIn && !isCancelled && !isCompleted && (
              <Button
                type="button"
                size="sm"
                onClick={() => setIsCheckInOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Xác nhận điểm danh ngay
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Sections: Lesson Record, Materials, Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main 2 Cols: Lesson Record & Assignments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Nội dung bài học (Lesson Record) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-violet-700" />
              Nội dung & Ghi chú bài giảng
            </h3>

            {session.lessonRecord ? (
              <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
                <div className="prose prose-sm max-w-none bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Nội dung đã học
                  </h4>
                  <div className="whitespace-pre-line text-slate-800">
                    {session.lessonRecord.content}
                  </div>
                </div>

                {session.lessonRecord.homeworkSummary && (
                  <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-1">
                      Dặn dò & Bài tập về nhà
                    </h4>
                    <p className="text-xs text-amber-950 whitespace-pre-line font-medium">
                      {session.lessonRecord.homeworkSummary}
                    </p>
                  </div>
                )}

                {session.lessonRecord.notes && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Ghi chú thêm: </span>
                    {session.lessonRecord.notes}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">
                Giáo viên chưa cập nhật nội dung bài giảng cho buổi học này.
              </p>
            )}
          </div>

          {/* Card: Bài tập về nhà (Assignments) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-700" />
              Bài tập được giao ({session.assignments?.length || 0})
            </h3>

            {session.assignments && session.assignments.length > 0 ? (
              <div className="space-y-3">
                {session.assignments.map((asm) => (
                  <div
                    key={asm.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="font-bold text-sm text-slate-900">
                        {asm.title}
                      </h4>
                      {asm.dueDate && (
                        <span className="text-xs text-rose-600 font-semibold bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
                          Hạn nộp: {formatDate(asm.dueDate)}
                        </span>
                      )}
                    </div>

                    {asm.description && (
                      <p className="text-xs text-slate-600 whitespace-pre-line">
                        {asm.description}
                      </p>
                    )}

                    {asm.fileUrls && asm.fileUrls.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-2">
                        {asm.fileUrls.map((fileUrl, idx) => (
                          <a
                            key={idx}
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-violet-700 font-medium hover:bg-violet-50 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Tải tệp đính kèm {idx + 1}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">
                Không có bài tập được giao cho buổi học này.
              </p>
            )}
          </div>
        </div>

        {/* 1 Col: Class Materials */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-indigo-700" />
              Tài liệu học tập ({session.materials?.length || 0})
            </h3>

            {session.materials && session.materials.length > 0 ? (
              <div className="space-y-3">
                {session.materials.map((mat) => {
                  const targetUrl = mat.fileUrl || mat.externalUrl;

                  return (
                    <div
                      key={mat.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-semibold text-xs text-slate-900 truncate">
                            {mat.title}
                          </p>
                          {mat.originalName && (
                            <p className="text-[11px] text-slate-400 truncate font-mono">
                              {mat.originalName}
                            </p>
                          )}
                        </div>
                        <Badge size="sm" className="bg-slate-100 text-slate-600 shrink-0">
                          {mat.type}
                        </Badge>
                      </div>

                      {mat.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-2">
                          {mat.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 border-t border-slate-200/60">
                        <span>{formatFileSize(mat.fileSize)}</span>
                        {targetUrl && (
                          <a
                            href={targetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-violet-700 font-semibold hover:underline"
                          >
                            <span>Xem / Tải về</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">
                Chưa có tài liệu nào được tải lên cho buổi học này.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Check-in Modal */}
      {isCheckInOpen && (
        <CheckInModal
          isOpen={isCheckInOpen}
          onClose={() => setIsCheckInOpen(false)}
          sessionId={session.id}
          sessionTitle={session.title}
        />
      )}
    </div>
  );
}
