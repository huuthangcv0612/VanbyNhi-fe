import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Filter,
  ExternalLink,
  MessageSquare,
  Send,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { attendanceService } from '../services/attendance.service';
import { studentClassesService } from '@/features/classes/services/classes.service';
import { useToast } from '@/hooks/useToast';
import { getApiErrorMessage } from '@/lib/api-client';
import type {
  AttendanceStatus,
  StudentAttendanceItem,
  CorrectionRequestItem,
} from '../types/attendance.types';
import {
  formatDateTime,
  formatTime,
  getAttendanceStatusMeta,
  getCorrectionRequestStatusMeta,
} from '@/utils/formatters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Pagination } from '@/components/ui/pagination';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { SkeletonTableRows } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';

type StudentTabKey = 'history' | 'my-requests';

export function StudentAttendancePage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<StudentTabKey>('history');

  // Bộ lọc
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Phân trang
  const [historyPage, setHistoryPage] = useState<number>(1);
  const historyLimit = 10;
  const [requestPage, setRequestPage] = useState<number>(1);
  const requestLimit = 10;

  // State Modal báo điểm danh sai (Correction Request)
  const [selectedRecordForCorrection, setSelectedRecordForCorrection] =
    useState<StudentAttendanceItem | null>(null);
  const [requestedStatus, setRequestedStatus] = useState<AttendanceStatus>('PRESENT');
  const [reason, setReason] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 1. Lấy danh sách lớp học của học sinh
  const { data: classesData, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['student-my-classes'],
    queryFn: () => studentClassesService.getMyClasses(),
  });

  const classes = classesData?.items || [];
  const activeClassId = selectedClassId || '';

  // 2. Lấy thống kê tổng hợp của học sinh
  const { data: summaryData } = useQuery({
    queryKey: ['student-attendance-summary', activeClassId, selectedYear, selectedMonth],
    queryFn: () =>
      attendanceService.getMyAttendanceSummary({
        classId: activeClassId || undefined,
        year: selectedYear,
        month: selectedMonth,
      }),
  });

  // 3. Lấy lịch sử điểm danh của học sinh
  const {
    data: historyData,
    isLoading: isLoadingHistory,
    isError: isHistoryError,
    error: historyError,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: [
      'student-attendance-history',
      activeClassId,
      selectedYear,
      selectedMonth,
      statusFilter,
      historyPage,
    ],
    queryFn: () =>
      attendanceService.getMyAttendanceHistory({
        classId: activeClassId || undefined,
        year: selectedYear,
        month: selectedMonth,
        status: statusFilter !== 'ALL' ? (statusFilter as AttendanceStatus) : undefined,
        page: historyPage,
        limit: historyLimit,
      }),
  });

  // 4. Lấy danh sách yêu cầu điều chỉnh của học sinh
  const {
    data: requestsData,
    isLoading: isLoadingRequests,
    isError: isRequestsError,
    error: requestsError,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: ['student-correction-requests', requestPage],
    queryFn: () =>
      attendanceService.getMyCorrectionRequests({
        page: requestPage,
        limit: requestLimit,
      }),
    enabled: activeTab === 'my-requests',
  });

  // Mutation gửi yêu cầu điều chỉnh
  const createCorrectionMutation = useMutation({
    mutationFn: () => {
      if (!selectedRecordForCorrection) throw new Error('Chưa chọn bản ghi');
      return attendanceService.createCorrectionRequest({
        attendanceId: selectedRecordForCorrection.id,
        requestedStatus,
        reason: reason.trim(),
        evidenceUrl: evidenceUrl.trim() || undefined,
      });
    },
    onSuccess: (res) => {
      showToast({
        type: 'success',
        title: 'Gửi yêu cầu thành công',
        message: res.message || 'Yêu cầu điều chỉnh điểm danh đã được gửi tới giáo viên',
      });
      setSelectedRecordForCorrection(null);
      setReason('');
      setEvidenceUrl('');
      setFormErrors({});
      queryClient.invalidateQueries({ queryKey: ['student-attendance-history'] });
      queryClient.invalidateQueries({ queryKey: ['student-attendance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['student-correction-requests'] });
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Không thể gửi yêu cầu',
        message: getApiErrorMessage(err),
      });
    },
  });

  // Validate form trước khi submit
  const handleSubmitCorrection = () => {
    const errors: Record<string, string> = {};
    if (!reason.trim()) {
      errors.reason = 'Vui lòng nhập lý do xin điều chỉnh điểm danh';
    } else if (reason.trim().length > 1000) {
      errors.reason = 'Lý do không được vượt quá 1000 ký tự';
    }

    if (evidenceUrl.trim()) {
      try {
        new URL(evidenceUrl.trim());
      } catch {
        errors.evidenceUrl = 'Đường dẫn minh chứng không hợp lệ (cần bắt đầu bằng http:// hoặc https://)';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    createCorrectionMutation.mutate();
  };

  const summary = summaryData?.summary;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Điểm danh của tôi"
        description="Theo dõi tình hình chuyên cần từng buổi học và gửi yêu cầu điều chỉnh khi có sai sót"
      />

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng số buổi</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {summaryData?.totalSessions ?? 0}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Có mặt</p>
          <p className="text-2xl font-bold text-emerald-900 mt-1">
            {summary?.PRESENT ?? 0}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-xs">
          <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Đi muộn</p>
          <p className="text-2xl font-bold text-amber-900 mt-1">
            {summary?.LATE ?? 0}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 shadow-xs">
          <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Vắng có phép</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">
            {summary?.EXCUSED_ABSENT ?? 0}
          </p>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 shadow-xs">
          <p className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Vắng K.phép</p>
          <p className="text-2xl font-bold text-rose-900 mt-1">
            {(summary?.UNEXCUSED_ABSENT ?? 0) + (summary?.ABSENT ?? 0)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-300 bg-slate-100/70 p-4 shadow-xs">
          <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Chưa điểm danh</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {summary?.NOT_MARKED ?? 0}
          </p>
        </div>
      </div>

      {/* Filter Bar: Lọc theo lớp, tháng, năm */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Class selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
            Lớp học:
          </label>
          <select
            value={activeClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setHistoryPage(1);
            }}
            disabled={isLoadingClasses}
            className="w-full sm:w-64 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-2xs focus:border-amber-500 focus:outline-none cursor-pointer"
          >
            <option value="">Tất cả các lớp đang học</option>
            {classes.map((c) => (
              <option key={c.class.id} value={c.class.id}>
                {c.class.name}
              </option>
            ))}
          </select>
        </div>

        {/* Month & Year Selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Tháng:</label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(Number(e.target.value));
                setHistoryPage(1);
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs focus:border-amber-500 focus:outline-none cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  Tháng {m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Năm:</label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(Number(e.target.value));
                setHistoryPage(1);
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs focus:border-amber-500 focus:outline-none cursor-pointer"
            >
              {[currentDate.getFullYear() - 1, currentDate.getFullYear()].map((y) => (
                <option key={y} value={y}>
                  Năm {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-amber-600 text-amber-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Lịch sử các buổi học</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('my-requests')}
            className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'my-requests'
                ? 'border-amber-600 text-amber-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Yêu cầu điều chỉnh của tôi</span>
            {(requestsData?.pagination.total || 0) > 0 && (
              <span className="ml-1 rounded-full bg-amber-500 text-white px-2 py-0.5 text-xs font-bold">
                {requestsData?.pagination.total}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* ==================== TAB 1: LỊCH SỬ ĐIỂM DANH ==================== */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-amber-700" />
              <span className="text-xs font-bold text-slate-700">Lọc trạng thái:</span>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setHistoryPage(1);
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-2xs focus:border-amber-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PRESENT">Có mặt (PRESENT)</option>
              <option value="LATE">Đi muộn (LATE)</option>
              <option value="EXCUSED_ABSENT">Vắng có phép (EXCUSED_ABSENT)</option>
              <option value="UNEXCUSED_ABSENT">Vắng không phép (UNEXCUSED_ABSENT)</option>
              <option value="NOT_MARKED">Chưa điểm danh (NOT_MARKED)</option>
            </select>
          </div>

          {isHistoryError ? (
            <ErrorState
              title="Không thể tải lịch sử điểm danh"
              message={getApiErrorMessage(historyError)}
              onRetry={() => refetchHistory()}
            />
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Buổi học</TableHead>
                    <TableHead>Lớp học</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Giờ check-in</TableHead>
                    <TableHead>Ghi chú</TableHead>
                    <TableHead className="text-right">Yêu cầu điều chỉnh</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingHistory ? (
                    <SkeletonTableRows rows={5} />
                  ) : (historyData?.items || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12">
                        <EmptyState
                          icon={<Calendar className="w-8 h-8 text-slate-400" />}
                          title="Chưa có dữ liệu điểm danh"
                          description="Không tìm thấy bản ghi điểm danh nào trong khoảng thời gian đã chọn."
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    historyData?.items.map((item: StudentAttendanceItem) => {
                      const statusMeta = getAttendanceStatusMeta(item.status);
                      const pendingReq = item.correctionRequests?.find(
                        (r) => r.status === 'PENDING',
                      );
                      const latestReq = item.correctionRequests?.[0];

                      return (
                        <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="font-semibold text-xs text-slate-900 max-w-xs">
                            {item.session.title}
                          </TableCell>

                          <TableCell className="text-xs text-slate-700">
                            {item.session.class.name}
                          </TableCell>

                          <TableCell className="text-xs text-slate-600">
                            {formatDateTime(item.session.startTime)}
                          </TableCell>

                          <TableCell>
                            <Badge className={statusMeta.badgeClass} size="sm">
                              {statusMeta.label}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-xs text-slate-500 font-mono">
                            {item.checkedInAt ? formatTime(item.checkedInAt) : '-'}
                          </TableCell>

                          <TableCell className="text-xs text-slate-600 max-w-xs truncate">
                            {item.note || '-'}
                          </TableCell>

                          <TableCell className="text-right">
                            {pendingReq ? (
                              <Badge className="bg-amber-100 text-amber-800" size="sm">
                                Đang chờ duyệt
                              </Badge>
                            ) : latestReq?.status === 'APPROVED' ? (
                              <Badge className="bg-emerald-100 text-emerald-800" size="sm">
                                Đã sửa xong
                              </Badge>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRecordForCorrection(item);
                                  setRequestedStatus(
                                    item.status === 'PRESENT' ? 'LATE' : 'PRESENT',
                                  );
                                  setReason('');
                                  setEvidenceUrl('');
                                  setFormErrors({});
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-700 hover:text-amber-800 hover:bg-amber-50 border border-amber-200 transition-colors cursor-pointer"
                              >
                                Báo điểm danh sai
                              </button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              {historyData?.pagination && historyData.pagination.totalPages > 1 && (
                <Pagination
                  currentPage={historyData.pagination.page}
                  totalPages={historyData.pagination.totalPages}
                  totalItems={historyData.pagination.total}
                  onPageChange={(p) => setHistoryPage(p)}
                  disabled={isLoadingHistory}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 2: YÊU CẦU ĐIỀU CHỈNH CỦA TÔI ==================== */}
      {activeTab === 'my-requests' && (
        <div className="space-y-4">
          {isRequestsError ? (
            <ErrorState
              title="Không thể tải danh sách yêu cầu"
              message={getApiErrorMessage(requestsError)}
              onRetry={() => refetchRequests()}
            />
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày gửi</TableHead>
                    <TableHead>Buổi học</TableHead>
                    <TableHead>Lớp</TableHead>
                    <TableHead>Đề xuất đổi thành</TableHead>
                    <TableHead>Lý do</TableHead>
                    <TableHead>Trạng thái duyệt</TableHead>
                    <TableHead>Phản hồi của giáo viên</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingRequests ? (
                    <SkeletonTableRows rows={5} />
                  ) : (requestsData?.items || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12">
                        <EmptyState
                          icon={<MessageSquare className="w-8 h-8 text-slate-400" />}
                          title="Chưa có yêu cầu điều chỉnh nào"
                          description="Nếu phát hiện điểm danh nhầm lẫn, bạn có thể bấm nút 'Báo điểm danh sai' tại tab Lịch sử các buổi học."
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    requestsData?.items.map((req: CorrectionRequestItem) => {
                      const reqMeta = getCorrectionRequestStatusMeta(req.status);
                      const targetMeta = getAttendanceStatusMeta(req.requestedStatus);

                      return (
                        <TableRow key={req.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="text-xs text-slate-500">
                            {formatDateTime(req.createdAt)}
                          </TableCell>

                          <TableCell className="font-semibold text-xs text-slate-900 max-w-xs truncate">
                            {req.attendance?.session?.title || '-'}
                          </TableCell>

                          <TableCell className="text-xs text-slate-700">
                            {req.attendance?.session?.class?.name || '-'}
                          </TableCell>

                          <TableCell>
                            <Badge className={targetMeta.badgeClass} size="sm">
                              {targetMeta.label}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-xs text-slate-700 max-w-xs">
                            <p className="line-clamp-2">{req.reason}</p>
                            {req.evidenceUrl && (
                              <a
                                href={req.evidenceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline pt-0.5"
                              >
                                <span>Xem minh chứng</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </TableCell>

                          <TableCell>
                            <Badge className={reqMeta.badgeClass} size="sm">
                              {reqMeta.label}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-xs text-slate-600 italic max-w-xs">
                            {req.reviewNote || (req.status === 'PENDING' ? 'Chưa phản hồi' : '-')}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              {requestsData?.pagination && requestsData.pagination.totalPages > 1 && (
                <Pagination
                  currentPage={requestsData.pagination.page}
                  totalPages={requestsData.pagination.totalPages}
                  totalItems={requestsData.pagination.total}
                  onPageChange={(p) => setRequestPage(p)}
                  disabled={isLoadingRequests}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal Báo điểm danh sai */}
      {selectedRecordForCorrection && (
        <Modal
          isOpen={Boolean(selectedRecordForCorrection)}
          onClose={() => setSelectedRecordForCorrection(null)}
          title="Báo điểm danh sai & Xin điều chỉnh"
          maxWidth="md"
        >
          <div className="space-y-4">
            {/* Thông tin buổi học */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Buổi học:</span>
                <span className="font-bold text-slate-900">
                  {selectedRecordForCorrection.session.title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Lớp:</span>
                <span className="text-slate-800">
                  {selectedRecordForCorrection.session.class.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thời gian:</span>
                <span className="text-slate-600">
                  {formatDateTime(selectedRecordForCorrection.session.startTime)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                <span className="text-slate-500">Trạng thái ghi nhận hiện tại:</span>
                <Badge className={getAttendanceStatusMeta(selectedRecordForCorrection.status).badgeClass} size="sm">
                  {getAttendanceStatusMeta(selectedRecordForCorrection.status).label}
                </Badge>
              </div>
            </div>

            {/* Chọn trạng thái đề xuất */}
            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-slate-700">
                Trạng thái bạn muốn đề xuất điều chỉnh:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRequestedStatus('PRESENT')}
                  className={`p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                    requestedStatus === 'PRESENT'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Có mặt (PRESENT)
                </button>
                <button
                  type="button"
                  onClick={() => setRequestedStatus('LATE')}
                  className={`p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                    requestedStatus === 'LATE'
                      ? 'border-amber-600 bg-amber-50 text-amber-800 ring-1 ring-amber-600'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Đi muộn (LATE)
                </button>
                <button
                  type="button"
                  onClick={() => setRequestedStatus('EXCUSED_ABSENT')}
                  className={`p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                    requestedStatus === 'EXCUSED_ABSENT'
                      ? 'border-blue-600 bg-blue-50 text-blue-800 ring-1 ring-blue-600'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Vắng có phép
                </button>
              </div>
            </div>

            {/* Nhập lý do */}
            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-slate-700">
                Lý do xin điều chỉnh <span className="text-rose-500">*</span>:
              </label>
              <textarea
                rows={3}
                placeholder="Ví dụ: Em có tham gia đầy đủ buổi học từ đầu giờ đến cuối giờ, nhưng quên bấm xác nhận điểm danh..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
              {formErrors.reason && (
                <p className="text-rose-600 text-[11px] font-medium">{formErrors.reason}</p>
              )}
            </div>

            {/* Link minh chứng */}
            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-slate-700">
                Liên kết ảnh / tài liệu minh chứng (tùy chọn):
              </label>
              <Input
                type="url"
                placeholder="https://drive.google.com/... hoặc ảnh chụp màn hình"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                className="text-xs"
              />
              {formErrors.evidenceUrl && (
                <p className="text-rose-600 text-[11px] font-medium">{formErrors.evidenceUrl}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedRecordForCorrection(null)}
                disabled={createCorrectionMutation.isPending}
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSubmitCorrection}
                isLoading={createCorrectionMutation.isPending}
                className="bg-amber-700 hover:bg-amber-800 text-white cursor-pointer"
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Gửi yêu cầu điều chỉnh
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
