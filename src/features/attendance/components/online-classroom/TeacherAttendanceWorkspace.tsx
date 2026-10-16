import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  CheckCheck,
  Save,
  Lock,
  FileSpreadsheet,
  Edit3,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { attendanceService } from '@/features/attendance/services/attendance.service';
import type {
  AttendanceStatus,
  SessionStudentAttendanceItem,
  SingleAttendanceRecordPayload,
} from '@/features/attendance/types/attendance.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmModal } from '@/features/classes/components/ConfirmModal';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useToast } from '@/hooks/useToast';
import { getApiErrorMessage } from '@/lib/api-client';
import { formatTime, formatDateTime } from '@/utils/formatters';

export interface TeacherAttendanceWorkspaceProps {
  sessionId: string;
}

type FilterStatus = 'ALL' | AttendanceStatus;

export function TeacherAttendanceWorkspace({ sessionId }: TeacherAttendanceWorkspaceProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');

  // Loading id của từng học sinh đang được lưu trạng thái đơn lẻ
  const [recordingStudentId, setRecordingStudentId] = useState<string | null>(null);

  // Modal ghi chú của từng học sinh
  const [noteModalStudent, setNoteModalStudent] = useState<{
    id: string;
    fullName: string;
    status: AttendanceStatus;
    currentNote: string;
  } | null>(null);
  const [studentNoteInput, setStudentNoteInput] = useState('');

  // Modal chốt sổ điểm danh
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [closeNote, setCloseNote] = useState('');

  // State xuất Excel
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // 1. Tải danh sách học sinh & điểm danh
  const {
    data: attendanceData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['session-attendance', sessionId],
    queryFn: () => attendanceService.getSessionAttendance(sessionId),
    enabled: Boolean(sessionId),
  });

  const session = attendanceData?.session;
  const attendanceSession = session?.attendanceSession;
  const isClosed = attendanceSession?.status === 'CLOSED';

  // Invalidate queries sau mutation
  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['session-attendance', sessionId] });
    queryClient.invalidateQueries({ queryKey: ['session-attendance-summary', sessionId] });
    queryClient.invalidateQueries({ queryKey: ['class-attendance-history'] });
    queryClient.invalidateQueries({ queryKey: ['class-attendance-summary'] });
  }, [queryClient, sessionId]);

  // Mutation: Điểm danh đơn lẻ từng học sinh (POST /sessions/:sessionId/attendance/record)
  const singleRecordMutation = useMutation({
    mutationFn: (payload: SingleAttendanceRecordPayload) =>
      attendanceService.saveSingleAttendance(sessionId, payload),
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'Cập nhật điểm danh thành công',
        message: 'Trạng thái học sinh đã được ghi nhận vào hệ thống.',
      });
      setRecordingStudentId(null);
      invalidateQueries();
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Không thể cập nhật điểm danh',
        message: getApiErrorMessage(err),
      });
      setRecordingStudentId(null);
    },
  });

  // Mutation: Đánh dấu tất cả có mặt
  const markAllMutation = useMutation({
    mutationFn: () =>
      attendanceService.markAllPresent(sessionId, { overrideExisting: true }),
    onSuccess: (res) => {
      showToast({
        type: 'success',
        title: 'Đã đánh dấu tất cả có mặt',
        message: res.message || 'Cập nhật trạng thái có mặt cho học sinh thành công',
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

  // Mutation: Lưu nháp (Save draft)
  const saveDraftMutation = useMutation({
    mutationFn: () => {
      const records = (attendanceData?.students || [])
        .filter((item) => item.attendance?.status)
        .map((item) => ({
          studentId: item.student.id,
          status: item.attendance!.status,
          note: item.attendance?.note || undefined,
        }));
      return attendanceService.saveDraftAttendance(sessionId, { records });
    },
    onSuccess: (res) => {
      showToast({
        type: 'info',
        title: 'Đã lưu bản nháp điểm danh',
        message: res.message || 'Bản nháp đã được đồng bộ với hệ thống',
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

  // Mutation: Chốt sổ điểm danh (Close session)
  const closeSessionMutation = useMutation({
    mutationFn: (note?: string) =>
      attendanceService.closeAttendanceSession(sessionId, { note }),
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'Đã chốt sổ điểm danh',
        message: 'Phiên điểm danh buổi học đã hoàn thành và khóa chỉnh sửa trực tiếp.',
      });
      setIsCloseModalOpen(false);
      invalidateQueries();
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Không thể chốt sổ điểm danh',
        message: getApiErrorMessage(err),
      });
    },
  });

  // Xử lý đổi trạng thái của 1 học sinh
  const handleStatusChange = (
    studentId: string,
    newStatus: AttendanceStatus,
    currentNote?: string | null,
  ) => {
    if (isClosed) {
      showToast({
        type: 'warning',
        title: 'Phiên điểm danh đã chốt sổ',
        message: 'Không thể thay đổi điểm danh trực tiếp sau khi phiên đã đóng.',
      });
      return;
    }

    if (recordingStudentId === studentId) return;

    setRecordingStudentId(studentId);
    singleRecordMutation.mutate({
      studentId,
      status: newStatus,
      note: currentNote || undefined,
      checkedInAt: newStatus === 'PRESENT' || newStatus === 'LATE' ? new Date() : undefined,
    });
  };

  // Mở modal sửa ghi chú cho học sinh
  const handleOpenNoteModal = (item: SessionStudentAttendanceItem) => {
    const currentStatus = item.attendance?.status || 'NOT_MARKED';
    setNoteModalStudent({
      id: item.student.id,
      fullName: item.student.fullName,
      status: currentStatus,
      currentNote: item.attendance?.note || '',
    });
    setStudentNoteInput(item.attendance?.note || '');
  };

  // Lưu ghi chú
  const handleSaveStudentNote = () => {
    if (!noteModalStudent) return;
    setRecordingStudentId(noteModalStudent.id);
    singleRecordMutation.mutate({
      studentId: noteModalStudent.id,
      status: noteModalStudent.status,
      note: studentNoteInput.trim() || undefined,
    });
    setNoteModalStudent(null);
  };

  // Xử lý Xuất Excel
  const handleExportExcel = async () => {
    if (isExportingExcel) return;
    setIsExportingExcel(true);
    try {
      await attendanceService.exportSessionAttendanceExcel(sessionId);
      showToast({
        type: 'success',
        title: 'Đã xuất file điểm danh Excel',
        message: 'Tệp danh sách điểm danh đã được tải xuống máy tính của bạn.',
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Không thể xuất file Excel',
        message: getApiErrorMessage(err),
      });
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Danh sách học sinh đã lọc & tìm kiếm
  const studentsList = attendanceData?.students;
  const filteredStudents = useMemo(() => {
    if (!studentsList) return [];
    return studentsList.filter((item) => {
      // Tìm kiếm
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        item.student.fullName.toLowerCase().includes(term) ||
        (item.student.phone && item.student.phone.includes(term)) ||
        (item.student.email && item.student.email.toLowerCase().includes(term));

      if (!matchSearch) return false;

      // Bộ lọc trạng thái
      if (statusFilter === 'ALL') return true;
      const attStatus = item.attendance?.status || 'NOT_MARKED';
      return attStatus === statusFilter;
    });
  }, [studentsList, searchTerm, statusFilter]);

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-9 w-64" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <ErrorState
          title="Không thể tải bảng điểm danh"
          message={getApiErrorMessage(error)}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const allStudents = attendanceData?.students || [];

  return (
    <div className="space-y-4">
      {/* Banner thông báo trạng thái chốt sổ */}
      {isClosed && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-amber-900 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-700">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">
                Phiên điểm danh buổi học đã được chốt sổ
              </p>
              <p className="text-xs text-amber-700">
                {attendanceSession?.closedBy?.fullName ? (
                  <>Bởi <strong>{attendanceSession.closedBy.fullName}</strong> </>
                ) : null}
                {attendanceSession?.closedAt ? (
                  <>lúc {formatDateTime(attendanceSession.closedAt)}</>
                ) : null}
                . Chế độ chỉnh sửa trực tiếp đã được khóa nhằm bảo toàn dữ liệu.
              </p>
            </div>
          </div>
          <Badge className="bg-amber-200/80 text-amber-900 border-amber-300 shrink-0">
            ĐÃ CHỐT SỔ (CLOSED)
          </Badge>
        </div>
      )}

      {/* Toolbar: Tìm kiếm, Bộ lọc & Thao tác hàng loạt */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Ô tìm kiếm */}
          <div className="relative w-full md:w-72">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên, SĐT học sinh..."
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              className="pr-8 text-xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Các nút thao tác hàng loạt */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => markAllMutation.mutate()}
              isLoading={markAllMutation.isPending}
              disabled={isClosed}
              title="Đánh dấu tất cả học sinh có mặt"
              className="text-xs cursor-pointer"
              leftIcon={<CheckCheck className="w-4 h-4 text-emerald-600" />}
            >
              Tất cả có mặt
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => saveDraftMutation.mutate()}
              isLoading={saveDraftMutation.isPending}
              disabled={isClosed}
              title="Lưu bản nháp điểm danh"
              className="text-xs cursor-pointer"
              leftIcon={<Save className="w-4 h-4 text-blue-600" />}
            >
              Lưu nháp
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              isLoading={isExportingExcel}
              title="Xuất bảng điểm danh sang file Excel"
              className="text-xs cursor-pointer text-emerald-800 border-emerald-200 hover:bg-emerald-50"
              leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-700" />}
            >
              Xuất Excel
            </Button>

            {!isClosed && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  setCloseNote('');
                  setIsCloseModalOpen(true);
                }}
                className="text-xs bg-amber-700 hover:bg-amber-800 text-white font-semibold cursor-pointer"
                leftIcon={<Lock className="w-4 h-4" />}
              >
                Chốt điểm danh
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              isLoading={isFetching}
              title="Tải lại danh sách"
              className="p-2 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-slate-500 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Status Filters Pill Row */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">
            Lọc trạng thái:
          </span>

          {(
            [
              { key: 'ALL', label: 'Tất cả', count: allStudents.length },
              {
                key: 'PRESENT',
                label: 'Có mặt',
                count: allStudents.filter((s) => s.attendance?.status === 'PRESENT').length,
              },
              {
                key: 'LATE',
                label: 'Đi muộn',
                count: allStudents.filter((s) => s.attendance?.status === 'LATE').length,
              },
              {
                key: 'EXCUSED_ABSENT',
                label: 'Vắng có phép',
                count: allStudents.filter((s) => s.attendance?.status === 'EXCUSED_ABSENT').length,
              },
              {
                key: 'UNEXCUSED_ABSENT',
                label: 'Vắng không phép',
                count: allStudents.filter((s) => s.attendance?.status === 'UNEXCUSED_ABSENT').length,
              },
              {
                key: 'NOT_MARKED',
                label: 'Chưa điểm danh',
                count: allStudents.filter(
                  (s) => !s.attendance?.status || s.attendance?.status === 'NOT_MARKED',
                ).length,
              },
            ] as const
          ).map((filter) => {
            const isActive = statusFilter === filter.key;
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setStatusFilter(filter.key)}
                className={`px-3 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-amber-900 text-white shadow-2xs font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{filter.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-amber-800 text-amber-100' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {filter.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Attendance Table & List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title={searchTerm ? 'Không tìm thấy học sinh phù hợp' : 'Không có học sinh trong danh sách'}
              description={
                searchTerm
                  ? `Không có học sinh nào khớp với từ khóa "${searchTerm}"`
                  : 'Lớp học này hiện chưa có học sinh nào tham gia buổi học'
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-12 text-center">STT</th>
                  <th className="py-3 px-4 min-w-[200px]">Học sinh</th>
                  <th className="py-3 px-4 min-w-[150px]">Thông tin liên lạc</th>
                  <th className="py-3 px-4 min-w-[130px]">Trạng thái</th>
                  <th className="py-3 px-4 min-w-[260px]">Thao tác điểm danh nhanh</th>
                  <th className="py-3 px-4 min-w-[180px]">Ghi chú & Check-in</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((item, idx) => {
                  const student = item.student;
                  const att = item.attendance;
                  const currentStatus: AttendanceStatus = att?.status || 'NOT_MARKED';
                  const isRowLoading = recordingStudentId === student.id;

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isRowLoading ? 'opacity-60 bg-slate-50' : ''
                      }`}
                    >
                      {/* STT */}
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>

                      {/* Thông tin học sinh */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {student.avatarUrl ? (
                            <img
                              src={student.avatarUrl}
                              alt={student.fullName}
                              className="h-8 w-8 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                              {student.fullName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">
                              {student.fullName}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono truncate">
                              ID: {student.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Liên lạc */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="space-y-0.5">
                          {student.phone ? (
                            <p className="font-mono text-slate-700">{student.phone}</p>
                          ) : (
                            <p className="text-slate-400 italic">Chưa có SĐT</p>
                          )}
                          {student.email && (
                            <p className="text-[11px] text-slate-400 truncate max-w-xs">
                              {student.email}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Badge trạng thái */}
                      <td className="py-3.5 px-4">
                        {currentStatus === 'PRESENT' && (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                            Có mặt
                          </Badge>
                        )}
                        {currentStatus === 'LATE' && (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                            Đi muộn
                          </Badge>
                        )}
                        {currentStatus === 'EXCUSED_ABSENT' && (
                          <Badge className="bg-sky-100 text-sky-800 border-sky-200">
                            Vắng có phép
                          </Badge>
                        )}
                        {currentStatus === 'UNEXCUSED_ABSENT' && (
                          <Badge className="bg-rose-100 text-rose-800 border-rose-200">
                            Vắng không phép
                          </Badge>
                        )}
                        {currentStatus === 'ABSENT' && (
                          <Badge className="bg-rose-100 text-rose-800 border-rose-200">
                            Vắng mặt
                          </Badge>
                        )}
                        {currentStatus === 'NOT_MARKED' && (
                          <Badge className="bg-slate-100 text-slate-600 border-slate-200">
                            Chưa điểm danh
                          </Badge>
                        )}
                      </td>

                      {/* Thao tác nút bấm nhanh */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            disabled={isClosed || isRowLoading}
                            onClick={() => handleStatusChange(student.id, 'PRESENT', att?.note)}
                            title="Đánh dấu Có mặt"
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                              currentStatus === 'PRESENT'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                          >
                            Có mặt
                          </button>

                          <button
                            type="button"
                            disabled={isClosed || isRowLoading}
                            onClick={() => handleStatusChange(student.id, 'LATE', att?.note)}
                            title="Đánh dấu Đi muộn"
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                              currentStatus === 'LATE'
                                ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                          >
                            Đi muộn
                          </button>

                          <button
                            type="button"
                            disabled={isClosed || isRowLoading}
                            onClick={() =>
                              handleStatusChange(student.id, 'EXCUSED_ABSENT', att?.note)
                            }
                            title="Đánh dấu Vắng có phép"
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                              currentStatus === 'EXCUSED_ABSENT'
                                ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                                : 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                          >
                            Có phép
                          </button>

                          <button
                            type="button"
                            disabled={isClosed || isRowLoading}
                            onClick={() =>
                              handleStatusChange(student.id, 'UNEXCUSED_ABSENT', att?.note)
                            }
                            title="Đánh dấu Vắng không phép"
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                              currentStatus === 'UNEXCUSED_ABSENT'
                                ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                          >
                            Không phép
                          </button>
                        </div>
                      </td>

                      {/* Ghi chú & Check-in */}
                      <td className="py-3.5 px-4 text-slate-500">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`truncate max-w-[140px] text-xs ${
                                att?.note ? 'text-slate-800 font-medium' : 'text-slate-400 italic'
                              }`}
                            >
                              {att?.note || 'Chưa có ghi chú'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenNoteModal(item)}
                              disabled={isClosed}
                              title="Thêm / Sửa ghi chú"
                              className="p-1 text-slate-400 hover:text-amber-800 hover:bg-slate-100 rounded transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {att?.checkedInAt && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                              <Clock className="w-3 h-3 text-emerald-600" />
                              <span>Check-in: {formatTime(att.checkedInAt)}</span>
                            </div>
                          )}

                          {att?.markedBy?.fullName && (
                            <p className="text-[10px] text-slate-400 truncate">
                              Người xác nhận: {att.markedBy.fullName}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Sửa ghi chú học sinh */}
      {noteModalStudent && (
        <Modal
          isOpen={Boolean(noteModalStudent)}
          onClose={() => setNoteModalStudent(null)}
          title={`Ghi chú điểm danh: ${noteModalStudent.fullName}`}
          description="Nhập lý do vắng, đi muộn hoặc phản hồi nội bộ của giáo viên cho học sinh này."
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="space-y-1">
              <label
                htmlFor="student-note-textarea"
                className="block text-xs font-semibold text-slate-700"
              >
                Nội dung ghi chú
              </label>
              <textarea
                id="student-note-textarea"
                rows={3}
                value={studentNoteInput}
                onChange={(e) => setStudentNoteInput(e.target.value)}
                placeholder="Ví dụ: Xin phép vào muộn 15 phút do bận lịch kiểm tra..."
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:border-amber-600 focus:outline-hidden focus:ring-1 focus:ring-amber-600"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNoteModalStudent(null)}
              >
                Hủy
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSaveStudentNote}
                isLoading={singleRecordMutation.isPending}
              >
                Lưu ghi chú
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Chốt sổ điểm danh */}
      <ConfirmModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        onConfirm={() => closeSessionMutation.mutate(closeNote.trim() || undefined)}
        title="Chốt sổ điểm danh buổi học"
        description={
          <div className="space-y-3 text-xs text-slate-600">
            <p>
              Bạn chuẩn bị <strong>chốt sổ điểm danh</strong> cho buổi học này.
              Sau khi chốt, phiên điểm danh sẽ chuyển sang trạng thái <strong>CLOSED</strong> và
              không thể sửa trực tiếp trên giao diện để đảm bảo tính minh bạch.
            </p>
            <div className="space-y-1 text-left">
              <label
                htmlFor="close-attendance-note"
                className="block text-[11px] font-semibold text-slate-700"
              >
                Ghi chú chốt sổ (không bắt buộc):
              </label>
              <textarea
                id="close-attendance-note"
                rows={2}
                value={closeNote}
                onChange={(e) => setCloseNote(e.target.value)}
                placeholder="Nhập ghi chú tổng kết buổi điểm danh nếu có..."
                className="w-full text-xs rounded-xl border border-slate-200 p-2 focus:border-amber-600 focus:outline-hidden"
              />
            </div>
          </div>
        }
        confirmLabel="Xác nhận chốt sổ"
        cancelLabel="Kiểm tra lại"
        variant="warning"
        isLoading={closeSessionMutation.isPending}
      />
    </div>
  );
}
