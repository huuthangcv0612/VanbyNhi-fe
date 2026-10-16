import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Users,
  UserCheck,
  FileText,
  BookOpen,
} from 'lucide-react';
import { attendanceService } from '@/features/attendance/services/attendance.service';
import { teacherClassesService } from '@/features/classes/services/classes.service';
import { TeacherSessionHeader } from '../components/online-classroom/TeacherSessionHeader';
import { TeacherSessionStatCards } from '../components/online-classroom/TeacherSessionStatCards';
import { TeacherAttendanceWorkspace } from '../components/online-classroom/TeacherAttendanceWorkspace';
import { TeacherMaterialsWorkspace } from '../components/online-classroom/TeacherMaterialsWorkspace';
import { TeacherLessonRecordWorkspace } from '../components/online-classroom/TeacherLessonRecordWorkspace';
import { TeacherClassMembersAndHistoryWorkspace } from '../components/online-classroom/TeacherClassMembersAndHistoryWorkspace';
import { TeacherMeetModal } from '../components/online-classroom/TeacherMeetModal';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { getApiErrorMessage } from '@/lib/api-client';

type ClassroomTab = 'attendance' | 'materials' | 'lesson-record' | 'history';

export function TeacherOnlineClassroomPage() {
  const { sessionId } = useParams<{ sessionId: string }>();

  // State tab hiện tại
  const [activeTab, setActiveTab] = useState<ClassroomTab>('attendance');

  // State modal chỉnh sửa Meet URL
  const [isMeetModalOpen, setIsMeetModalOpen] = useState(false);

  // 1. Lấy dữ liệu buổi học kèm điểm danh
  const {
    data: attendanceData,
    isLoading: isLoadingAttendance,
    isError: isAttendanceError,
    error: attendanceError,
    refetch: refetchAttendance,
  } = useQuery({
    queryKey: ['session-attendance', sessionId],
    queryFn: () => attendanceService.getSessionAttendance(sessionId!),
    enabled: Boolean(sessionId),
  });

  // 2. Lấy dữ liệu chi tiết buổi học (để lấy _count tài liệu, bài tập, v.v.)
  const { data: sessionDetail } = useQuery({
    queryKey: ['session-detail', sessionId],
    queryFn: () => teacherClassesService.getSessionDetail(sessionId!),
    enabled: Boolean(sessionId),
  });

  const session = attendanceData?.session;

  if (isLoadingAttendance) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (isAttendanceError || !session) {
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
          title="Không thể tải thông tin phòng học trực tuyến"
          message={getApiErrorMessage(attendanceError)}
          onRetry={() => refetchAttendance()}
        />
      </div>
    );
  }

  const materialsCount = sessionDetail?._count?.materials ?? 0;
  const effectiveMeetUrl = session.meetUrl || sessionDetail?.class?.defaultMeetUrl || null;

  return (
    <div className="space-y-5">
      {/* 1. Header Buổi học & Điều khiển Google Meet / Trạng thái */}
      <TeacherSessionHeader
        sessionId={session.id}
        title={session.title}
        status={session.status}
        startTime={session.startTime}
        endTime={session.endTime}
        classInfo={{
          id: session.class.id,
          name: session.class.name,
          defaultMeetUrl: sessionDetail?.class?.defaultMeetUrl,
          teacher: session.class.teacher,
        }}
        meetUrl={session.meetUrl}
      />

      {/* 2. Thẻ thống kê số liệu tóm tắt từ Backend */}
      <TeacherSessionStatCards
        sessionId={session.id}
        materialsCount={materialsCount}
      />

      {/* 3. Navigation Tabs Workspace */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-amber-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4 text-amber-500" />
            <span>Bảng điểm danh buổi học</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'attendance'
                  ? 'bg-amber-800 text-amber-100'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {attendanceData?.students?.length || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('materials')}
            className={`py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'materials'
                ? 'bg-amber-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-500" />
            <span>Tài liệu buổi học</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'materials'
                  ? 'bg-amber-800 text-amber-100'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {materialsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lesson-record')}
            className={`py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'lesson-record'
                ? 'bg-amber-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-500" />
            <span>Nhật ký giảng dạy</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-amber-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-amber-500" />
            <span>Học sinh & Lịch sử lớp</span>
          </button>
        </div>
      </div>

      {/* 4. Tab Content Area */}
      <div className="transition-all duration-150">
        {activeTab === 'attendance' && (
          <TeacherAttendanceWorkspace sessionId={session.id} />
        )}

        {activeTab === 'materials' && (
          <TeacherMaterialsWorkspace sessionId={session.id} />
        )}

        {activeTab === 'lesson-record' && (
          <TeacherLessonRecordWorkspace sessionId={session.id} />
        )}

        {activeTab === 'history' && (
          <TeacherClassMembersAndHistoryWorkspace
            classId={session.class.id}
            currentSessionId={session.id}
          />
        )}
      </div>

      {/* Meet Modal fallback */}
      <TeacherMeetModal
        isOpen={isMeetModalOpen}
        onClose={() => setIsMeetModalOpen(false)}
        sessionId={session.id}
        currentMeetUrl={effectiveMeetUrl}
        onSuccess={() => {
          refetchAttendance();
        }}
      />
    </div>
  );
}
