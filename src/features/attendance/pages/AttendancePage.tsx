import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardCheck,
  Calendar,
  Filter,
  Download,
  Settings,
  History,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Lock,
  Check,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { attendanceService } from '../services/attendance.service';
import { teacherClassesService, classesService } from '@/features/classes/services/classes.service';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { getApiErrorMessage } from '@/lib/api-client';
import type {
  AttendanceStatus,
  CorrectionRequestStatus,
  ClassAttendanceHistoryItem,
  MonthlySummaryItem,
  CorrectionRequestItem,
  ClassAttendanceConfig,
} from '../types/attendance.types';
import {
  formatDateTime,
  formatTime,
  formatCurrency,
  getAttendanceStatusMeta,
  getCorrectionRequestStatusMeta,
} from '@/utils/formatters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Pagination } from '@/components/ui/pagination';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Skeleton, SkeletonTableRows } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';

type TabKey = 'overview' | 'history' | 'monthly' | 'requests' | 'export' | 'config';

export function AttendancePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const isTeacher = user?.role === 'TEACHER';

  // State bộ lọc chung
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);

  // Bộ lọc lịch sử
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('ALL');
  const [historyPage, setHistoryPage] = useState<number>(1);
  const historyLimit = 15;

  // Bộ lọc yêu cầu điều chỉnh
  const [requestStatusFilter, setRequestStatusFilter] = useState<string>('ALL');
  const [requestPage, setRequestPage] = useState<number>(1);
  const requestLimit = 10;

  // State Modal duyệt/từ chối yêu cầu
  const [selectedRequest, setSelectedRequest] = useState<CorrectionRequestItem | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reviewNote, setReviewNote] = useState('');

  // State Modal chốt tổng kết tháng
  const [isCloseMonthModalOpen, setIsCloseMonthModalOpen] = useState(false);
  const [closeMonthNote, setCloseMonthNote] = useState('');

  // State xuất Excel
  const [isExportingDetail, setIsExportingDetail] = useState(false);
  const [isExportingSummary, setIsExportingSummary] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  // 1. Query danh sách lớp học
  const { data: classesData, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['attendance-classes-list', user?.role],
    queryFn: async () => {
      if (isTeacher) {
        return teacherClassesService.getMyClasses({ limit: 100 });
      }
      return classesService.findAll({ limit: 100 });
    },
  });

  const classes = classesData?.items || [];
  const activeClassId = selectedClassId || (classes[0]?.id ?? '');

  // 2. Query thống kê tổng hợp lớp (Summary)
  const { data: summaryData } = useQuery({
    queryKey: ['class-attendance-summary', activeClassId, selectedYear, selectedMonth],
    queryFn: () =>
      attendanceService.getClassAttendanceSummary(activeClassId, {
        year: selectedYear,
        month: selectedMonth,
      }),
    enabled: Boolean(activeClassId),
  });

  // 3. Query lịch sử điểm danh (History)
  const {
    data: historyData,
    isLoading: isLoadingHistory,
    isError: isHistoryError,
    error: historyError,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: [
      'class-attendance-history',
      activeClassId,
      selectedYear,
      selectedMonth,
      historyStatusFilter,
      historyPage,
    ],
    queryFn: () =>
      attendanceService.getClassAttendanceHistory(activeClassId, {
        year: selectedYear,
        month: selectedMonth,
        status: historyStatusFilter !== 'ALL' ? (historyStatusFilter as AttendanceStatus) : undefined,
        page: historyPage,
        limit: historyLimit,
      }),
    enabled: Boolean(activeClassId) && activeTab === 'history',
  });

  // 4. Query tổng kết tháng (Monthly Summary)
  const {
    data: monthlyData,
    isLoading: isLoadingMonthly,
    isError: isMonthlyError,
    error: monthlyError,
    refetch: refetchMonthly,
  } = useQuery({
    queryKey: ['class-attendance-monthly', activeClassId, selectedYear, selectedMonth],
    queryFn: () =>
      attendanceService.getMonthlySummary(activeClassId, {
        billingYear: selectedYear,
        billingMonth: selectedMonth,
      }),
    enabled: Boolean(activeClassId) && activeTab === 'monthly',
  });

  // 5. Query yêu cầu điều chỉnh (Correction Requests)
  const {
    data: requestsData,
    isLoading: isLoadingRequests,
    isError: isRequestsError,
    error: requestsError,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: ['attendance-correction-requests', activeClassId, requestStatusFilter, requestPage],
    queryFn: () =>
      attendanceService.getCorrectionRequests({
        classId: activeClassId || undefined,
        status: requestStatusFilter !== 'ALL' ? (requestStatusFilter as CorrectionRequestStatus) : undefined,
        page: requestPage,
        limit: requestLimit,
      }),
    enabled: activeTab === 'requests',
  });

  // 6. Query cấu hình điểm danh (Config)
  const { data: configData, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['class-attendance-config', activeClassId],
    queryFn: () => attendanceService.getClassAttendanceConfig(activeClassId),
    enabled: Boolean(activeClassId) && activeTab === 'config',
  });

  // Form state cho cấu hình
  const [configForm, setConfigForm] = useState<Partial<ClassAttendanceConfig>>({});

  // Cập nhật configForm khi configData thay đổi
  const currentConfig: ClassAttendanceConfig = {
    classId: activeClassId,
    chargePresent: configForm.chargePresent ?? configData?.chargePresent ?? true,
    chargeLate: configForm.chargeLate ?? configData?.chargeLate ?? true,
    chargeExcusedAbsent: configForm.chargeExcusedAbsent ?? configData?.chargeExcusedAbsent ?? false,
    chargeUnexcusedAbsent: configForm.chargeUnexcusedAbsent ?? configData?.chargeUnexcusedAbsent ?? false,
    allowMakeUpSession: configForm.allowMakeUpSession ?? configData?.allowMakeUpSession ?? true,
    retentionDays: configForm.retentionDays ?? configData?.retentionDays ?? 60,
  };

  // Mutation: Lưu cấu hình
  const updateConfigMutation = useMutation({
    mutationFn: () =>
      attendanceService.updateClassAttendanceConfig(activeClassId, {
        chargePresent: currentConfig.chargePresent,
        chargeLate: currentConfig.chargeLate,
        chargeExcusedAbsent: currentConfig.chargeExcusedAbsent,
        chargeUnexcusedAbsent: currentConfig.chargeUnexcusedAbsent,
        allowMakeUpSession: currentConfig.allowMakeUpSession,
        retentionDays: currentConfig.retentionDays,
      }),
    onSuccess: (res) => {
      showToast({
        type: 'success',
        title: 'Lưu cấu hình thành công',
        message: res.message || 'Chính sách điểm danh và tính phí đã được cập nhật',
      });
      queryClient.invalidateQueries({ queryKey: ['class-attendance-config', activeClassId] });
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Không thể cập nhật cấu hình',
        message: getApiErrorMessage(err),
      });
    },
  });

  // Mutation: Duyệt/Từ chối yêu cầu điều chỉnh
  const reviewRequestMutation = useMutation({
    mutationFn: () => {
      if (!selectedRequest) throw new Error('Chưa chọn yêu cầu');
      return attendanceService.reviewCorrectionRequest(selectedRequest.id, {
        status: reviewAction,
        reviewNote: reviewNote.trim() || undefined,
      });
    },
    onSuccess: (res) => {
      showToast({
        type: 'success',
        title: reviewAction === 'APPROVED' ? 'Đã duyệt yêu cầu' : 'Đã từ chối yêu cầu',
        message: res.message || 'Xử lý yêu cầu điều chỉnh thành công',
      });
      setSelectedRequest(null);
      setReviewNote('');
      queryClient.invalidateQueries({ queryKey: ['attendance-correction-requests'] });
      queryClient.invalidateQueries({ queryKey: ['class-attendance-history'] });
      queryClient.invalidateQueries({ queryKey: ['class-attendance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['class-attendance-monthly'] });
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Thao tác thất bại',
        message: getApiErrorMessage(err),
      });
    },
  });

  // Mutation: Chốt tổng kết tháng
  const closeMonthlySummaryMutation = useMutation({
    mutationFn: () =>
      attendanceService.closeMonthlySummary(activeClassId, {
        billingYear: selectedYear,
        billingMonth: selectedMonth,
        note: closeMonthNote.trim() || undefined,
      }),
    onSuccess: (res) => {
      showToast({
        type: 'success',
        title: 'Chốt tổng kết tháng thành công',
        message: res.message || `Đã chốt sổ chuyên cần và học phí cho ${res.count} học sinh`,
      });
      setIsCloseMonthModalOpen(false);
      setCloseMonthNote('');
      queryClient.invalidateQueries({ queryKey: ['class-attendance-monthly', activeClassId] });
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Không thể chốt tổng kết tháng',
        message: getApiErrorMessage(err),
      });
    },
  });

  // Handler: Xuất chi tiết Excel
  const handleExportDetail = async () => {
    if (!activeClassId) return;

    // Kiểm tra giới hạn 90 ngày nếu nhập ngày tự chọn
    if (exportStartDate && exportEndDate) {
      const diffDays = Math.ceil(
        (new Date(exportEndDate).getTime() - new Date(exportStartDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (diffDays > 92) {
        showToast({
          type: 'warning',
          title: 'Khoảng thời gian quá dài',
          message: 'Khoảng thời gian xuất chi tiết tối đa là 90 ngày. Vui lòng thu hẹp khoảng ngày.',
        });
        return;
      }
    }

    setIsExportingDetail(true);
    try {
      await attendanceService.exportDetailExcel(activeClassId, {
        year: !exportStartDate ? selectedYear : undefined,
        month: !exportStartDate ? selectedMonth : undefined,
        startDate: exportStartDate || undefined,
        endDate: exportEndDate || undefined,
      });
      showToast({
        type: 'success',
        title: 'Tải file Excel thành công',
        message: 'Bảng chi tiết điểm danh đã được tải xuống máy tính của bạn',
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Xuất file thất bại',
        message: getApiErrorMessage(err),
      });
    } finally {
      setIsExportingDetail(false);
    }
  };

  // Handler: Xuất tổng hợp tháng Excel
  const handleExportSummary = async () => {
    if (!activeClassId) return;
    setIsExportingSummary(true);
    try {
      await attendanceService.exportSummaryExcel(activeClassId, {
        year: selectedYear,
        month: selectedMonth,
      });
      showToast({
        type: 'success',
        title: 'Tải file Excel thành công',
        message: `Bảng tổng hợp tháng ${selectedMonth}/${selectedYear} đã được tải về`,
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Xuất file thất bại',
        message: getApiErrorMessage(err),
      });
    } finally {
      setIsExportingSummary(false);
    }
  };

  const selectedClass = classes.find((c) => c.id === activeClassId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Điểm danh & Chuyên cần"
        description="Theo dõi điểm danh học sinh, tổng kết tháng, duyệt điều chỉnh và xuất báo cáo chuyên cần"
      />

      {/* Bộ lọc đầu trang: Chọn lớp & Chọn Tháng/Năm */}
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
              setRequestPage(1);
            }}
            disabled={isLoadingClasses || classes.length === 0}
            className="w-full sm:w-64 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-2xs focus:border-amber-500 focus:outline-none cursor-pointer"
          >
            {classes.length === 0 ? (
              <option value="">Chưa có lớp học</option>
            ) : (
              classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}{cls.classCode ? ` (${cls.classCode})` : ''}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Month & Year Selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Tháng:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
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
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs focus:border-amber-500 focus:outline-none cursor-pointer"
            >
              {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map((y) => (
                <option key={y} value={y}>
                  Năm {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-2 sm:space-x-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-amber-600 text-amber-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Tổng quan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-amber-600 text-amber-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Lịch sử điểm danh</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('monthly')}
            className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'monthly'
                ? 'border-amber-600 text-amber-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Tổng hợp tháng</span>
            {monthlyData?.isClosed && (
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-bold">
                Đã chốt
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'requests'
                ? 'border-amber-600 text-amber-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            <span>Yêu cầu điều chỉnh</span>
            {(requestsData?.pagination.total || 0) > 0 && (
              <span className="ml-1 rounded-full bg-amber-500 text-white px-2 py-0.5 text-xs font-bold">
                {requestsData?.pagination.total}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'export'
                ? 'border-amber-600 text-amber-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'config'
                ? 'border-amber-600 text-amber-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Cấu hình tính phí</span>
          </button>
        </nav>
      </div>

      {/* ==================== TAB 1: TỔNG QUAN ==================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng lượt ghi</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {summaryData?.totalRecords ?? 0}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-xs">
              <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Có mặt</p>
              <p className="text-2xl font-bold text-emerald-900 mt-1">
                {summaryData?.summary?.PRESENT ?? 0}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-xs">
              <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Đi muộn</p>
              <p className="text-2xl font-bold text-amber-900 mt-1">
                {summaryData?.summary?.LATE ?? 0}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 shadow-xs">
              <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Vắng có phép</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {summaryData?.summary?.EXCUSED_ABSENT ?? 0}
              </p>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 shadow-xs">
              <p className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Vắng không phép</p>
              <p className="text-2xl font-bold text-rose-900 mt-1">
                {(summaryData?.summary?.UNEXCUSED_ABSENT ?? 0) + (summaryData?.summary?.ABSENT ?? 0)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-300 bg-slate-100/70 p-4 shadow-xs">
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Chưa điểm danh</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                {summaryData?.summary?.NOT_MARKED ?? 0}
              </p>
            </div>
          </div>

          {/* Banner gợi ý */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50/30 to-amber-50/20 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-sm">
                Điểm danh trực tiếp trong phòng học Google Meet
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                Để thực hiện điểm danh cho từng buổi học cụ thể khi đang giảng dạy, bạn có thể truy cập danh sách Buổi học của lớp để mở phòng học tích hợp bảng điểm danh bên cạnh Google Meet.
              </p>
            </div>
            {selectedClass && (
              <Button
                size="sm"
                onClick={() => setActiveTab('history')}
                className="bg-amber-700 hover:bg-amber-800 text-white text-xs shrink-0 cursor-pointer"
              >
                Xem chi tiết lịch sử &rarr;
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: LỊCH SỬ ĐIỂM DANH ==================== */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-amber-700" />
              <span className="text-xs font-bold text-slate-700">Lọc trạng thái:</span>
            </div>

            <select
              value={historyStatusFilter}
              onChange={(e) => {
                setHistoryStatusFilter(e.target.value);
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

          {/* History Table */}
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
                    <TableHead>Học sinh</TableHead>
                    <TableHead>Buổi học</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Giờ check-in</TableHead>
                    <TableHead>Ghi chú</TableHead>
                    <TableHead>Người điểm danh</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingHistory ? (
                    <SkeletonTableRows rows={6} />
                  ) : (historyData?.items || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12">
                        <EmptyState
                          icon={<History className="w-8 h-8 text-slate-400" />}
                          title="Chưa có dữ liệu điểm danh"
                          description="Không tìm thấy bản ghi điểm danh nào trong khoảng thời gian đã chọn."
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    historyData?.items.map((row: ClassAttendanceHistoryItem) => {
                      const statusMeta = getAttendanceStatusMeta(row.status);
                      return (
                        <TableRow key={row.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell>
                            <div>
                              <p className="font-semibold text-xs text-slate-900">
                                {row.student?.fullName || 'Học sinh'}
                              </p>
                              {row.student?.phone && (
                                <p className="text-[11px] text-slate-400 font-mono">
                                  {row.student.phone}
                                </p>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="text-xs font-medium text-slate-800 max-w-xs truncate">
                            {row.session?.title || '-'}
                          </TableCell>

                          <TableCell className="text-xs text-slate-600">
                            {formatDateTime(row.session?.startTime)}
                          </TableCell>

                          <TableCell>
                            <Badge className={statusMeta.badgeClass} size="sm">
                              {statusMeta.label}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-xs text-slate-500 font-mono">
                            {row.checkedInAt ? formatTime(row.checkedInAt) : '-'}
                          </TableCell>

                          <TableCell className="text-xs text-slate-600 max-w-xs truncate">
                            {row.note || '-'}
                          </TableCell>

                          <TableCell className="text-xs text-slate-500">
                            {row.markedBy?.fullName || '-'}
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

      {/* ==================== TAB 3: TỔNG HỢP THÁNG & TÍNH PHÍ ==================== */}
      {activeTab === 'monthly' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="space-y-0.5">
              <h4 className="font-bold text-sm text-slate-900">
                Bảng tổng hợp tháng {selectedMonth}/{selectedYear}
              </h4>
              <p className="text-xs text-slate-500">
                Thống kê số buổi theo trạng thái, số buổi tính phí và học phí snapshot của từng học sinh
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {monthlyData?.isClosed ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                  <Lock className="w-3.5 h-3.5" />
                  Kỳ này đã chốt
                </span>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setIsCloseMonthModalOpen(true)}
                  className="bg-amber-700 hover:bg-amber-800 text-white text-xs cursor-pointer"
                  leftIcon={<Lock className="w-3.5 h-3.5" />}
                >
                  Chốt tổng kết tháng
                </Button>
              )}
            </div>
          </div>

          {isMonthlyError ? (
            <ErrorState
              title="Không thể tải bảng tổng hợp tháng"
              message={getApiErrorMessage(monthlyError)}
              onRetry={() => refetchMonthly()}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Học sinh</TableHead>
                  <TableHead className="text-center">Tổng buổi</TableHead>
                  <TableHead className="text-center">Có mặt</TableHead>
                  <TableHead className="text-center">Đi muộn</TableHead>
                  <TableHead className="text-center">Vắng phép</TableHead>
                  <TableHead className="text-center">Vắng K.phép</TableHead>
                  <TableHead className="text-center">Chưa điểm danh</TableHead>
                  <TableHead className="text-center">Buổi tính phí</TableHead>
                  <TableHead className="text-right">Học phí tháng</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingMonthly ? (
                  <SkeletonTableRows rows={5} />
                ) : (monthlyData?.items || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-12">
                      <EmptyState
                        icon={<Calendar className="w-8 h-8 text-slate-400" />}
                        title="Chưa có dữ liệu tổng hợp tháng"
                        description={`Tháng ${selectedMonth}/${selectedYear} chưa có dữ liệu chốt kỳ hoặc chưa có buổi học nào.`}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  monthlyData?.items.map((m: MonthlySummaryItem) => (
                    <TableRow key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-semibold text-xs text-slate-900">
                        {m.student.fullName}
                      </TableCell>
                      <TableCell className="text-center text-xs font-medium text-slate-700">
                        {m.totalSessions}
                      </TableCell>
                      <TableCell className="text-center text-xs font-bold text-emerald-700">
                        {m.presentCount}
                      </TableCell>
                      <TableCell className="text-center text-xs font-bold text-amber-700">
                        {m.lateCount}
                      </TableCell>
                      <TableCell className="text-center text-xs font-medium text-blue-700">
                        {m.excusedAbsentCount}
                      </TableCell>
                      <TableCell className="text-center text-xs font-bold text-rose-700">
                        {m.unexcusedAbsentCount}
                      </TableCell>
                      <TableCell className="text-center text-xs text-slate-400">
                        {m.notMarkedCount}
                      </TableCell>
                      <TableCell className="text-center text-xs font-bold text-purple-700">
                        {m.chargeableSessions}
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold font-mono text-slate-900">
                        {formatCurrency(m.tuitionAmount)}
                      </TableCell>
                      <TableCell className="text-center">
                        {m.isClosed ? (
                          <Badge className="bg-slate-200 text-slate-700" size="sm">
                            Đã chốt
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800" size="sm">
                            Tạm tính
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* Modal chốt tháng */}
          {isCloseMonthModalOpen && (
            <Modal
              isOpen={isCloseMonthModalOpen}
              onClose={() => setIsCloseMonthModalOpen(false)}
              title={`Chốt tổng kết tháng ${selectedMonth}/${selectedYear}?`}
              maxWidth="md"
            >
              <div className="space-y-4">
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 space-y-2">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Quy tắc nghiệp vụ chốt tháng:
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    Hệ thống sẽ tạo snapshot đóng băng số buổi chuyên cần và học phí cho toàn bộ học sinh trong lớp tại thời điểm này. Snapshot đã chốt sẽ không tự thay đổi khi dữ liệu chi tiết của buổi học sau đó thay đổi.
                  </p>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="font-semibold text-slate-700">Ghi chú chốt kỳ (tùy chọn):</label>
                  <textarea
                    rows={3}
                    placeholder="Ghi chú đợt chốt sổ tháng..."
                    value={closeMonthNote}
                    onChange={(e) => setCloseMonthNote(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCloseMonthModalOpen(false)}
                    disabled={closeMonthlySummaryMutation.isPending}
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => closeMonthlySummaryMutation.mutate()}
                    isLoading={closeMonthlySummaryMutation.isPending}
                    className="bg-amber-700 hover:bg-amber-800 text-white cursor-pointer"
                    leftIcon={<Lock className="w-3.5 h-3.5" />}
                  >
                    Xác nhận chốt tháng
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* ==================== TAB 4: YÊU CẦU ĐIỀU CHỈNH ==================== */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-amber-700" />
              <span className="text-xs font-bold text-slate-700">Lọc theo trạng thái yêu cầu:</span>
            </div>

            <select
              value={requestStatusFilter}
              onChange={(e) => {
                setRequestStatusFilter(e.target.value);
                setRequestPage(1);
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-2xs focus:border-amber-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả yêu cầu</option>
              <option value="PENDING">Chờ xử lý (PENDING)</option>
              <option value="APPROVED">Đã chấp nhận (APPROVED)</option>
              <option value="REJECTED">Đã từ chối (REJECTED)</option>
            </select>
          </div>

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
                    <TableHead>Học sinh</TableHead>
                    <TableHead>Buổi học</TableHead>
                    <TableHead>Thời gian buổi</TableHead>
                    <TableHead>Trạng thái cũ</TableHead>
                    <TableHead>Đề xuất đổi thành</TableHead>
                    <TableHead>Lý do học sinh</TableHead>
                    <TableHead>Trạng thái duyệt</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingRequests ? (
                    <SkeletonTableRows rows={5} />
                  ) : (requestsData?.items || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-12">
                        <EmptyState
                          icon={<CheckCircle className="w-8 h-8 text-slate-400" />}
                          title="Không có yêu cầu điều chỉnh nào"
                          description="Hiện không có yêu cầu điều chỉnh điểm danh nào cần xử lý."
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    requestsData?.items.map((req: CorrectionRequestItem) => {
                      const reqMeta = getCorrectionRequestStatusMeta(req.status);
                      const curMeta = getAttendanceStatusMeta(
                        req.attendance?.status || 'NOT_MARKED',
                      );
                      const targetMeta = getAttendanceStatusMeta(req.requestedStatus);
                      const isPending = req.status === 'PENDING';

                      return (
                        <TableRow key={req.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell>
                            <div>
                              <p className="font-semibold text-xs text-slate-900">
                                {req.student?.fullName || 'Học sinh'}
                              </p>
                              {req.student?.phone && (
                                <p className="text-[11px] text-slate-400 font-mono">
                                  {req.student.phone}
                                </p>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="text-xs font-medium text-slate-800 max-w-xs truncate">
                            {req.attendance?.session?.title || '-'}
                          </TableCell>

                          <TableCell className="text-xs text-slate-600">
                            {formatDateTime(req.attendance?.session?.startTime)}
                          </TableCell>

                          <TableCell>
                            <Badge className={curMeta.badgeClass} size="sm">
                              {curMeta.label}
                            </Badge>
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

                          <TableCell className="text-right">
                            {isPending ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedRequest(req);
                                  setReviewAction('APPROVED');
                                  setReviewNote('');
                                }}
                                className="text-xs cursor-pointer"
                              >
                                Xét duyệt
                              </Button>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                {req.reviewedBy?.fullName ? `Bởi: ${req.reviewedBy.fullName}` : 'Đã xử lý'}
                              </span>
                            )}
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

          {/* Modal Xét duyệt yêu cầu điều chỉnh */}
          {selectedRequest && (
            <Modal
              isOpen={Boolean(selectedRequest)}
              onClose={() => setSelectedRequest(null)}
              title="Xét duyệt yêu cầu điều chỉnh điểm danh"
              maxWidth="md"
            >
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Học sinh:</span>
                    <span className="font-bold text-slate-900">
                      {selectedRequest.student?.fullName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Buổi học:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedRequest.attendance?.session?.title}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                    <span className="text-slate-500">So sánh:</span>
                    <div className="flex items-center gap-2">
                      <span className="line-through text-slate-400">
                        {getAttendanceStatusMeta(selectedRequest.attendance?.status || 'NOT_MARKED').label}
                      </span>
                      <span>&rarr;</span>
                      <Badge className={getAttendanceStatusMeta(selectedRequest.requestedStatus).badgeClass}>
                        {getAttendanceStatusMeta(selectedRequest.requestedStatus).label}
                      </Badge>
                    </div>
                  </div>
                  <div className="pt-1">
                    <span className="text-slate-500 block mb-0.5">Lý do xin sửa:</span>
                    <p className="p-2 bg-white rounded-lg border border-slate-200 text-slate-800 italic">
                      "{selectedRequest.reason}"
                    </p>
                  </div>
                </div>

                {/* Chọn hành động: Duyệt hay Từ chối */}
                <div className="space-y-1.5 text-xs">
                  <label className="font-semibold text-slate-700">Quyết định xử lý:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setReviewAction('APPROVED')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                        reviewAction === 'APPROVED'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Chấp nhận điều chỉnh
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewAction('REJECTED')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                        reviewAction === 'REJECTED'
                          ? 'border-rose-600 bg-rose-50 text-rose-800 ring-1 ring-rose-600'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <XCircle className="w-4 h-4 text-rose-600" />
                      Từ chối yêu cầu
                    </button>
                  </div>
                </div>

                {/* Ghi chú phản hồi */}
                <div className="space-y-1.5 text-xs">
                  <label className="font-semibold text-slate-700">Phản hồi của giáo viên (tùy chọn):</label>
                  <textarea
                    rows={2}
                    placeholder="Nhập lý do duyệt hoặc lý do từ chối gửi cho học sinh..."
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedRequest(null)}
                    disabled={reviewRequestMutation.isPending}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => reviewRequestMutation.mutate()}
                    isLoading={reviewRequestMutation.isPending}
                    className={
                      reviewAction === 'APPROVED'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                        : 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                    }
                  >
                    Xác nhận {reviewAction === 'APPROVED' ? 'duyệt' : 'từ chối'}
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* ==================== TAB 5: XUẤT EXCEL ==================== */}
      {activeTab === 'export' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Xuất chi tiết */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Xuất chi tiết điểm danh (.xlsx)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Bao gồm từng buổi học, giờ check-in, học bù và ghi chú của từng học sinh
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-xs text-slate-600">
                  Xuất theo tháng đang chọn (<strong>Tháng {selectedMonth}/{selectedYear}</strong>) hoặc tự nhập khoảng ngày tùy chỉnh (tối đa 90 ngày):
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-500 mb-1 block">Từ ngày:</label>
                    <input
                      type="date"
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 mb-1 block">Đến ngày:</label>
                    <input
                      type="date"
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button
              size="sm"
              onClick={handleExportDetail}
              isLoading={isExportingDetail}
              disabled={isExportingDetail || !activeClassId}
              className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer w-full mt-4"
              leftIcon={<Download className="w-4 h-4" />}
            >
              Tải file Excel chi tiết
            </Button>
          </div>

          {/* Card 2: Xuất tổng hợp tháng */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Xuất bảng tổng hợp tháng (.xlsx)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Bao gồm sĩ số buổi có mặt, vắng, số buổi tính phí và mức học phí theo học sinh
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2 text-xs text-slate-600 leading-relaxed">
                <p>
                  Báo cáo được trích xuất theo kỳ tính học phí:{' '}
                  <strong className="text-slate-900">
                    Tháng {selectedMonth}/{selectedYear}
                  </strong>{' '}
                  của lớp <strong>{selectedClass?.name || ''}</strong>.
                </p>
                <p className="text-slate-500 text-[11px]">
                  File xuất bao gồm công thức đối soát và các cột tính toán theo đúng nghiệp vụ học phí của hệ thống Văn Cô Như Ý.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={handleExportSummary}
              isLoading={isExportingSummary}
              disabled={isExportingSummary || !activeClassId}
              className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer w-full mt-4"
              leftIcon={<Download className="w-4 h-4" />}
            >
              Tải file Excel tổng hợp tháng
            </Button>
          </div>
        </div>
      )}

      {/* ==================== TAB 6: CẤU HÌNH TÍNH PHÍ & ĐIỂM DANH ==================== */}
      {activeTab === 'config' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 max-w-3xl">
          <div className="space-y-1">
            <h3 className="font-bold text-base text-slate-900">
              Cấu hình quy tắc tính phí & lưu trữ của lớp
            </h3>
            <p className="text-xs text-slate-500">
              Thiết lập trạng thái chuyên cần nào được tính một buổi học phí và quy định học bù
            </p>
          </div>

          {isLoadingConfig ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-3 divide-y divide-slate-100">
                <label className="flex items-center justify-between py-2.5 cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Tính phí khi Có mặt (PRESENT)</p>
                    <p className="text-[11px] text-slate-400">Học sinh có mặt trong buổi học</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={currentConfig.chargePresent}
                    onChange={(e) =>
                      setConfigForm((prev) => ({ ...prev, chargePresent: e.target.checked }))
                    }
                    className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between py-2.5 cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Tính phí khi Đi muộn (LATE)</p>
                    <p className="text-[11px] text-slate-400">Học sinh vào muộn trong buổi học</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={currentConfig.chargeLate}
                    onChange={(e) =>
                      setConfigForm((prev) => ({ ...prev, chargeLate: e.target.checked }))
                    }
                    className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between py-2.5 cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Tính phí khi Vắng có phép (EXCUSED_ABSENT)</p>
                    <p className="text-[11px] text-slate-400">Mặc định không tính phí</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={currentConfig.chargeExcusedAbsent}
                    onChange={(e) =>
                      setConfigForm((prev) => ({ ...prev, chargeExcusedAbsent: e.target.checked }))
                    }
                    className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between py-2.5 cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Tính phí khi Vắng không phép (UNEXCUSED_ABSENT)</p>
                    <p className="text-[11px] text-slate-400">Mặc định không tính phí, tùy chính sách lớp</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={currentConfig.chargeUnexcusedAbsent}
                    onChange={(e) =>
                      setConfigForm((prev) => ({ ...prev, chargeUnexcusedAbsent: e.target.checked }))
                    }
                    className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between py-2.5 cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Cho phép học bù buổi khác (allowMakeUpSession)</p>
                    <p className="text-[11px] text-slate-400">Học sinh được xếp vào buổi bù khi có phép</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={currentConfig.allowMakeUpSession}
                    onChange={(e) =>
                      setConfigForm((prev) => ({ ...prev, allowMakeUpSession: e.target.checked }))
                    }
                    className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                </label>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Thời hạn lưu trữ lịch sử chi tiết (ngày):
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={currentConfig.retentionDays}
                    onChange={(e) =>
                      setConfigForm((prev) => ({ ...prev, retentionDays: Number(e.target.value) }))
                    }
                    className="w-32 text-xs"
                  />
                  <span className="text-xs text-slate-500">Mặc định 60 ngày</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <Button
                  size="sm"
                  onClick={() => updateConfigMutation.mutate()}
                  isLoading={updateConfigMutation.isPending}
                  className="bg-amber-700 hover:bg-amber-800 text-white cursor-pointer"
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  Lưu cấu hình lớp học
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
