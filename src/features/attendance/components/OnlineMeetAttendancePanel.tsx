import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle,
  Save,
  Lock,
  Search,
  CheckCheck,
  AlertTriangle,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import { attendanceService } from '../services/attendance.service';
import type {
  AttendanceStatus,
  BatchAttendancePayload,
  SessionStudentAttendanceItem,
} from '../types/attendance.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/useToast';
import { getApiErrorMessage } from '@/lib/api-client';
import {
  getAttendanceStatusMeta,
  getAttendanceSessionStatusMeta,
} from '@/utils/formatters';

interface StudentOverride {
  status?: AttendanceStatus;
  note?: string;
}

export interface OnlineMeetAttendancePanelProps {
  sessionId: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function OnlineMeetAttendancePanel({
  sessionId,
  isCollapsed = false,
  onToggleCollapse,
}: OnlineMeetAttendancePanelProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [overrides, setOverrides] = useState<Record<string, StudentOverride>>({});
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [closeNote, setCloseNote] = useState('');

  // 1. Lấy dữ liệu điểm danh buổi học
  const {
    data: attendanceData,
    isLoading: isLoadingAttendance,
    isError: isAttendanceError,
    error: attendanceError,
    refetch: refetchAttendance,
  } = useQuery({
    queryKey: ['session-attendance', sessionId],
    queryFn: () => attendanceService.getSessionAttendance(sessionId),
    enabled: Boolean(sessionId),
  });

  // 2. Lấy thống kê tóm tắt
  const { refetch: refetchSummary } = useQuery({
    queryKey: ['session-attendance-summary', sessionId],
    queryFn: () => attendanceService.getSessionSummary(sessionId),
    enabled: Boolean(sessionId),
  });

  const sessionInfo = attendanceData?.session;
  const attendanceSession = sessionInfo?.attendanceSession;
  const isClosed = attendanceSession?.status === 'CLOSED';

  const students = attendanceData?.students;

  // Danh sách học sinh kết hợp dữ liệu server và local overrides
  const studentsList = useMemo(() => {
    if (!students) return [];
    return students.map((item: SessionStudentAttendanceItem) => {
      const override = overrides[item.student.id];
      const serverStatus: AttendanceStatus = item.attendance?.status || 'NOT_MARKED';
      const serverNote = item.attendance?.note || '';

      const currentStatus = override?.status ?? serverStatus;
      const currentNote = override?.note ?? serverNote;
      const isModified = currentStatus !== serverStatus || currentNote !== serverNote;

      return {
        studentId: item.student.id,
        fullName: item.student.fullName,
        phone: item.student.phone,
        status: currentStatus,
        note: currentNote,
        serverStatus,
        serverNote,
        isModified,
        attendanceId: item.attendance?.id,
        checkedInAt: item.attendance?.checkedInAt,
      };
    });
  }, [students, overrides]);

  // Kiểm tra có thay đổi chưa lưu hay không
  const isDirty = useMemo(() => {
    return studentsList.some((s) => s.isModified);
  }, [studentsList]);

  // Cảnh báo người dùng khi có thay đổi chưa lưu và rời trang
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  // Invalidate cache sau khi có thay đổi thành công
  const invalidateQueries = useCallback(() => {
    setOverrides({});
    queryClient.invalidateQueries({ queryKey: ['session-attendance', sessionId] });
    queryClient.invalidateQueries({ queryKey: ['session-attendance-summary', sessionId] });
    queryClient.invalidateQueries({ queryKey: ['class-attendance-history'] });
    queryClient.invalidateQueries({ queryKey: ['class-attendance-summary'] });
  }, [queryClient, sessionId]);

  // Mutation: Lưu điểm danh (Batch save)
  const saveAttendanceMutation = useMutation({
    mutationFn: (payload: BatchAttendancePayload) =>
      attendanceService.batchSaveAttendance(sessionId, payload),
    onSuccess: (res) => {
      showToast({
        type: 'success',
        title: 'Lưu điểm danh thành công',
        message: res.message || `Đã lưu điểm danh cho ${res.count} học sinh`,
      });
      invalidateQueries();
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Không thể lưu điểm danh',
        message: getApiErrorMessage(err),
      });
    },
  });

  // Mutation: Lưu nháp (Save draft)
  const saveDraftMutation = useMutation({
    mutationFn: (payload: BatchAttendancePayload) =>
      attendanceService.saveDraftAttendance(sessionId, payload),
    onSuccess: (res) => {
      showToast({
        type: 'info',
        title: 'Đã lưu bản nháp',
        message: res.message || 'Bản nháp điểm danh đã được cập nhật',
      });
      invalidateQueries();
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Không thể lưu bản nháp',
        message: getApiErrorMessage(err),
      });
    },
  });

  // Mutation: Đánh dấu tất cả có mặt
  const markAllMutation = useMutation({
    mutationFn: () => attendanceService.markAllPresent(sessionId, { overrideExisting: true }),
    onSuccess: (res) => {
      showToast({
        type: 'success',
        title: 'Đã đánh dấu tất cả có mặt',
        message: res.message || `Đã cập nhật trạng thái có mặt cho học sinh`,
      });
      invalidateQueries();
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Thao tác không thành công',
        message: getApiErrorMessage(err),
      });
    },
  });

  // Mutation: Chốt điểm danh (Close session)
  const closeSessionMutation = useMutation({
    mutationFn: (note?: string) =>
      attendanceService.closeAttendanceSession(sessionId, { note }),
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'Đã chốt điểm danh buổi học',
        message: 'Phiên điểm danh đã được khóa thành công. Mọi điều chỉnh tiếp theo phải qua quy trình xét duyệt.',
      });
      setIsCloseModalOpen(false);
      invalidateQueries();
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Không thể chốt điểm danh',
        message: getApiErrorMessage(err),
      });
    },
  });

  // Thay đổi trạng thái một học sinh trong local state
  const handleStatusChange = (studentId: string, newStatus: AttendanceStatus) => {
    if (isClosed) return;
    setOverrides((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: newStatus,
      },
    }));
  };

  // Thay đổi ghi chú một học sinh
  const handleNoteChange = (studentId: string, note: string) => {
    if (isClosed) return;
    setOverrides((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note,
      },
    }));
  };

  // Nút Lưu điểm danh
  const handleSave = () => {
    const records = studentsList.map((item) => ({
      studentId: item.studentId,
      status: item.status,
      note: item.note.trim() ? item.note.trim() : undefined,
    }));

    if (records.length === 0) {
      showToast({
        type: 'warning',
        title: 'Không có dữ liệu',
        message: 'Danh sách học sinh trống',
      });
      return;
    }

    saveAttendanceMutation.mutate({ records });
  };

  // Nút Lưu nháp
  const handleSaveDraft = () => {
    const records = studentsList.map((item) => ({
      studentId: item.studentId,
      status: item.status,
      note: item.note.trim() ? item.note.trim() : undefined,
    }));

    saveDraftMutation.mutate({ records });
  };

  // Nút Đánh dấu tất cả có mặt trên giao diện (sau đó người dùng có thể chỉnh sửa tiếp)
  const handleMarkAllLocal = () => {
    if (isClosed) return;
    const nextOverrides: Record<string, StudentOverride> = {};
    studentsList.forEach((s) => {
      nextOverrides[s.studentId] = {
        ...overrides[s.studentId],
        status: 'PRESENT',
      };
    });
    setOverrides(nextOverrides);
    showToast({
      type: 'info',
      title: 'Đã đánh dấu tất cả có mặt trên bảng',
      message: 'Bạn có thể chỉnh sửa từng học sinh trước khi bấm "Lưu điểm danh"',
    });
  };

  // Reset các thay đổi về dữ liệu server
  const handleReset = () => {
    setOverrides({});
  };

  // Danh sách học sinh sau khi tìm kiếm
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return studentsList;
    const term = searchTerm.toLowerCase().trim();
    return studentsList.filter(
      (s) =>
        s.fullName.toLowerCase().includes(term) ||
        (s.phone && s.phone.includes(term)),
    );
  }, [studentsList, searchTerm]);

  // Thống kê nhanh từ studentsList
  const currentStats = useMemo(() => {
    let present = 0;
    let late = 0;
    let excused = 0;
    let unexcused = 0;
    let notMarked = 0;

    studentsList.forEach((item) => {
      if (item.status === 'PRESENT') present++;
      else if (item.status === 'LATE') late++;
      else if (item.status === 'EXCUSED_ABSENT') excused++;
      else if (item.status === 'UNEXCUSED_ABSENT' || item.status === 'ABSENT') unexcused++;
      else notMarked++;
    });

    const total = studentsList.length;
    const marked = total - notMarked;

    return { total, marked, notMarked, present, late, excused, unexcused };
  }, [studentsList]);

  const isSubmitting =
    saveAttendanceMutation.isPending ||
    saveDraftMutation.isPending ||
    markAllMutation.isPending ||
    closeSessionMutation.isPending;

  if (isLoadingAttendance) {
    return (
      <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="space-y-3 flex-1 overflow-hidden">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isAttendanceError) {
    return (
      <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
        <h4 className="font-bold text-slate-800">Không thể tải dữ liệu điểm danh</h4>
        <p className="text-xs text-slate-500">{getApiErrorMessage(attendanceError)}</p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            refetchAttendance();
            refetchSummary();
          }}
          className="mx-auto"
        >
          Thử lại
        </Button>
      </div>
    );
  }

  const sessionStatusMeta = getAttendanceSessionStatusMeta(
    attendanceSession?.status || 'OPEN',
  );

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-700" />
            <h3 className="font-bold text-base text-slate-900 font-serif">
              Bảng điểm danh buổi học
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={sessionStatusMeta.badgeClass} size="sm">
              {sessionStatusMeta.label}
            </Badge>
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className="text-xs px-2 py-1 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                {isCollapsed ? 'Mở rộng' : 'Thu gọn'}
              </Button>
            )}
          </div>
        </div>

        {/* Cảnh báo nếu phiên đã chốt */}
        {isClosed && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-start gap-2 shadow-2xs">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Phiên điểm danh đã được chốt (CLOSED)</p>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                Đã khóa sửa trực tiếp. Học sinh cần điều chỉnh điểm danh sẽ gửi Yêu cầu điều chỉnh để giáo viên xét duyệt.
              </p>
            </div>
          </div>
        )}

        {/* Thông báo chưa lưu */}
        {!isClosed && isDirty && (
          <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs flex items-center justify-between">
            <span className="font-medium flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping" />
              Có thay đổi chưa lưu
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 underline cursor-pointer"
            >
              Hoàn tác
            </button>
          </div>
        )}

        {/* Thống kê nhanh */}
        <div className="grid grid-cols-4 gap-2 pt-1 text-center">
          <div className="bg-white p-2 rounded-xl border border-slate-200">
            <p className="text-[10px] uppercase font-bold text-slate-400">Sĩ số</p>
            <p className="text-base font-extrabold text-slate-900">{currentStats.total}</p>
          </div>
          <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200">
            <p className="text-[10px] uppercase font-bold text-emerald-700">Có mặt</p>
            <p className="text-base font-extrabold text-emerald-800">{currentStats.present}</p>
          </div>
          <div className="bg-amber-50 p-2 rounded-xl border border-amber-200">
            <p className="text-[10px] uppercase font-bold text-amber-700">Đi muộn</p>
            <p className="text-base font-extrabold text-amber-800">{currentStats.late}</p>
          </div>
          <div className="bg-rose-50 p-2 rounded-xl border border-rose-200">
            <p className="text-[10px] uppercase font-bold text-rose-700">Vắng</p>
            <p className="text-base font-extrabold text-rose-800">
              {currentStats.excused + currentStats.unexcused}
            </p>
          </div>
        </div>

        {/* Search & Bulk action */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              placeholder="Tìm theo tên hoặc số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-3.5 h-3.5 text-slate-400" />}
              className="text-xs py-1.5"
            />
          </div>

          {!isClosed && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleMarkAllLocal}
              disabled={isSubmitting || currentStats.total === 0}
              className="text-xs whitespace-nowrap cursor-pointer shrink-0"
              leftIcon={<CheckCheck className="w-3.5 h-3.5 text-emerald-600" />}
              title="Đánh dấu tất cả có mặt trên bảng (vẫn sửa được từng bạn)"
            >
              Tất cả có mặt
            </Button>
          )}
        </div>
      </div>

      {/* Danh sách học sinh (Scrollable list) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
        {filteredStudents.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            {searchTerm
              ? 'Không tìm thấy học sinh nào phù hợp.'
              : 'Lớp học hiện tại chưa có học sinh nào.'}
          </div>
        ) : (
          filteredStudents.map((item, idx) => {
            const statusMeta = getAttendanceStatusMeta(item.status);

            return (
              <div
                key={item.studentId}
                className={`pt-3 first:pt-0 space-y-2 rounded-xl p-2 transition-colors ${
                  item.status === 'PRESENT'
                    ? 'bg-emerald-50/30'
                    : item.status === 'LATE'
                    ? 'bg-amber-50/30'
                    : item.status === 'EXCUSED_ABSENT'
                    ? 'bg-blue-50/30'
                    : item.status === 'UNEXCUSED_ABSENT' || item.status === 'ABSENT'
                    ? 'bg-rose-50/30'
                    : 'bg-white'
                }`}
              >
                {/* Thông tin học sinh */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-800 font-bold text-xs shrink-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-slate-900 truncate">
                        {item.fullName}
                      </p>
                      {item.phone && (
                        <p className="text-[11px] text-slate-500 font-mono">
                          {item.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <Badge size="sm" className={statusMeta.badgeClass}>
                    {statusMeta.label}
                  </Badge>
                </div>

                {/* Chọn trạng thái (Button Radio Group) */}
                <div className="grid grid-cols-5 gap-1 pt-1">
                  <button
                    type="button"
                    disabled={isClosed || isSubmitting}
                    onClick={() => handleStatusChange(item.studentId, 'PRESENT')}
                    className={`px-1.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                      item.status === 'PRESENT'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Có mặt
                  </button>

                  <button
                    type="button"
                    disabled={isClosed || isSubmitting}
                    onClick={() => handleStatusChange(item.studentId, 'LATE')}
                    className={`px-1.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                      item.status === 'LATE'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Muộn
                  </button>

                  <button
                    type="button"
                    disabled={isClosed || isSubmitting}
                    onClick={() => handleStatusChange(item.studentId, 'EXCUSED_ABSENT')}
                    className={`px-1.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                      item.status === 'EXCUSED_ABSENT'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-blue-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Có phép
                  </button>

                  <button
                    type="button"
                    disabled={isClosed || isSubmitting}
                    onClick={() => handleStatusChange(item.studentId, 'UNEXCUSED_ABSENT')}
                    className={`px-1.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                      item.status === 'UNEXCUSED_ABSENT' || item.status === 'ABSENT'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-rose-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    K.phép
                  </button>

                  <button
                    type="button"
                    disabled={isClosed || isSubmitting}
                    onClick={() => handleStatusChange(item.studentId, 'NOT_MARKED')}
                    className={`px-1.5 py-1 text-[11px] font-medium rounded-lg border transition-all cursor-pointer ${
                      item.status === 'NOT_MARKED'
                        ? 'bg-slate-700 text-white border-slate-800 shadow-2xs'
                        : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Chưa
                  </button>
                </div>

                {/* Nhập ghi chú */}
                <div className="pt-1">
                  <input
                    type="text"
                    disabled={isClosed || isSubmitting}
                    placeholder="Ghi chú (vào muộn 15p, xin nghỉ phép...)"
                    value={item.note}
                    onChange={(e) => handleNoteChange(item.studentId, e.target.value)}
                    className="w-full text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 bg-white placeholder-slate-400 text-slate-800 focus:outline-none focus:border-amber-500 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2 flex-wrap">
        {!isClosed ? (
          <>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                disabled={isSubmitting || currentStats.total === 0}
                className="text-xs cursor-pointer"
                leftIcon={<Save className="w-3.5 h-3.5" />}
              >
                Lưu nháp
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={isSubmitting || currentStats.total === 0}
                className="text-xs bg-amber-700 hover:bg-amber-800 text-white cursor-pointer"
                leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
              >
                Lưu điểm danh
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCloseModalOpen(true)}
              disabled={isSubmitting || currentStats.total === 0}
              className="text-xs border-rose-300 text-rose-700 hover:bg-rose-50 cursor-pointer shrink-0"
              leftIcon={<Lock className="w-3.5 h-3.5 text-rose-600" />}
            >
              Chốt điểm danh
            </Button>
          </>
        ) : (
          <div className="w-full flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              Phiên điểm danh đã kết thúc & chốt
            </span>
            <span className="text-[11px] text-slate-400">
              Đã chốt lúc: {attendanceSession?.closedAt ? new Date(attendanceSession.closedAt).toLocaleTimeString('vi-VN') : '-'}
            </span>
          </div>
        )}
      </div>

      {/* Modal xác nhận chốt điểm danh */}
      {isCloseModalOpen && (
        <Modal
          isOpen={isCloseModalOpen}
          onClose={() => setIsCloseModalOpen(false)}
          title="Chốt điểm danh buổi học?"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-2">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Lưu ý quan trọng khi chốt điểm danh:
              </p>
              <p className="text-slate-700 leading-relaxed">
                Sau khi chốt điểm danh (<strong>CLOSED</strong>), bạn sẽ không thể chỉnh sửa trực tiếp trên bảng điểm danh này nữa. Mọi sửa đổi sau đó phải thông qua quy trình xét duyệt Yêu cầu điều chỉnh từ học sinh.
              </p>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-slate-700">
                Ghi chú chốt phiên (tùy chọn):
              </label>
              <textarea
                rows={3}
                placeholder="Ví dụ: Chốt sau giờ học 15 phút, vắng 2 học sinh có phép..."
                value={closeNote}
                onChange={(e) => setCloseNote(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCloseModalOpen(false)}
                disabled={closeSessionMutation.isPending}
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => closeSessionMutation.mutate(closeNote.trim() || undefined)}
                isLoading={closeSessionMutation.isPending}
                className="bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                leftIcon={<Lock className="w-3.5 h-3.5" />}
              >
                Xác nhận chốt
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
