import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  Users,
  Clock,
  Calendar,
  Lock,
  Unlock,
  Edit2,
  Video,
  ExternalLink,
  Search,
  UserX,
  CheckCircle,
  XCircle,
  Sparkles,
  FolderOpen,
} from 'lucide-react';
import { teacherClassesService } from '../services/classes.service';
import type {
  ClassItem,
  ClassMemberItem,
  TeacherUpdateClassDto,
} from '../types/class.types';
import type { ClassStatus, MemberStatus } from '@/types/common.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton, SkeletonTableRows } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import {
  getClassStatusMeta,
  getMemberStatusMeta,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatTime,
} from '@/utils/formatters';
import { getApiErrorMessage } from '@/lib/api-client';
import { useToast } from '@/hooks/useToast';
import { ClassFormModal } from '../components/ClassFormModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { TeacherClassSessionsTab } from '../components/TeacherClassSessionsTab';
import { TeacherClassMaterialsTab } from '../components/TeacherClassMaterialsTab';

type ActiveTab = 'members' | 'requests' | 'sessions' | 'materials' | 'overview';

export function TeacherClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<ActiveTab>('members');

  // Modal edit
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Modal confirm regenerate code
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);

  // Modal confirm update status (close / reopen)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Modal confirm remove member
  const [memberToRemove, setMemberToRemove] = useState<ClassMemberItem | null>(null);

  // Row loading states for request actions (approve / reject)
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  // Copy state
  const [copiedCode, setCopiedCode] = useState(false);

  // Member tab state
  const [memberSearch, setMemberSearch] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState<string>('ACTIVE');
  const [memberPage, setMemberPage] = useState(1);
  const memberLimit = 10;

  // Requests tab state
  const [requestSearch, setRequestSearch] = useState('');
  const [requestPage, setRequestPage] = useState(1);
  const requestLimit = 10;

  // Query class detail
  const {
    data: classData,
    isLoading: isClassLoading,
    isError: isClassError,
    error: classError,
    refetch: refetchClass,
  } = useQuery({
    queryKey: ['teacher-class-detail', classId],
    queryFn: () => teacherClassesService.getClassDetail(classId!),
    enabled: Boolean(classId),
  });

  // Query members
  const {
    data: membersData,
    isLoading: isMembersLoading,
    isError: isMembersError,
    error: membersError,
    refetch: refetchMembers,
  } = useQuery({
    queryKey: ['teacher-class-members', classId, { memberPage, memberLimit, memberSearch, memberStatusFilter }],
    queryFn: () =>
      teacherClassesService.getClassMembers(classId!, {
        page: memberPage,
        limit: memberLimit,
        search: memberSearch.trim() ? memberSearch.trim() : undefined,
        status: memberStatusFilter !== 'ALL' ? (memberStatusFilter as MemberStatus) : undefined,
      }),
    enabled: Boolean(classId) && activeTab === 'members',
  });

  // Query join requests
  const {
    data: requestsData,
    isLoading: isRequestsLoading,
    isError: isRequestsError,
    error: requestsError,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: ['teacher-class-requests', classId, { requestPage, requestLimit, requestSearch }],
    queryFn: () =>
      teacherClassesService.getJoinRequests(classId!, {
        page: requestPage,
        limit: requestLimit,
        search: requestSearch.trim() ? requestSearch.trim() : undefined,
      }),
    enabled: Boolean(classId) && activeTab === 'requests',
  });

  // Mutation: Regenerate join code
  const regenerateCodeMutation = useMutation({
    mutationFn: () => teacherClassesService.regenerateJoinCode(classId!),
    onSuccess: (res) => {
      showToast({
        type: 'success',
        title: 'Tạo mã mới thành công',
        message: `Mã tham gia mới của lớp là: ${res.class.joinCode}`,
      });
      queryClient.invalidateQueries({ queryKey: ['teacher-class-detail', classId] });
      queryClient.invalidateQueries({ queryKey: ['teacher-classes'] });
      setIsRegenerateModalOpen(false);
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Không thể tạo mã mới',
        message: getApiErrorMessage(err),
      });
    },
  });

  // Mutation: Update status
  const updateStatusMutation = useMutation({
    mutationFn: (status: ClassStatus) => teacherClassesService.updateClassStatus(classId!, status),
    onSuccess: (_, status) => {
      showToast({
        type: 'success',
        title: 'Cập nhật trạng thái thành công',
        message: status === 'CLOSED' ? 'Đã đóng lớp học' : 'Đã mở lại lớp học',
      });
      queryClient.invalidateQueries({ queryKey: ['teacher-class-detail', classId] });
      queryClient.invalidateQueries({ queryKey: ['teacher-classes'] });
      setIsStatusModalOpen(false);
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Không thể cập nhật trạng thái',
        message: getApiErrorMessage(err),
      });
    },
  });

  // Mutation: Update class info
  const updateClassMutation = useMutation({
    mutationFn: (payload: TeacherUpdateClassDto) =>
      teacherClassesService.updateClass(classId!, payload),
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'Cập nhật thành công',
        message: 'Đã lưu thay đổi thông tin lớp học',
      });
      queryClient.invalidateQueries({ queryKey: ['teacher-class-detail', classId] });
      queryClient.invalidateQueries({ queryKey: ['teacher-classes'] });
      setIsEditOpen(false);
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Không thể cập nhật lớp học',
        message: getApiErrorMessage(err),
      });
    },
  });

  // Mutation: Remove member (chuyển sang REMOVED, không xóa user)
  const removeMemberMutation = useMutation({
    mutationFn: (studentId: string) => teacherClassesService.removeMember(classId!, studentId),
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'Đã xóa học sinh khỏi lớp',
        message: 'Trạng thái thành viên đã được chuyển sang REMOVED',
      });
      queryClient.invalidateQueries({ queryKey: ['teacher-class-members', classId] });
      queryClient.invalidateQueries({ queryKey: ['teacher-class-detail', classId] });
      queryClient.invalidateQueries({ queryKey: ['teacher-classes'] });
      setMemberToRemove(null);
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Không thể xóa học sinh',
        message: getApiErrorMessage(err),
      });
    },
  });

  // Mutation: Approve join request
  const approveRequestMutation = useMutation({
    mutationFn: (membershipId: string) =>
      teacherClassesService.approveJoinRequest(classId!, membershipId),
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'Đã duyệt yêu cầu',
        message: 'Học sinh đã chính thức được kích hoạt trong lớp học',
      });
      queryClient.invalidateQueries({ queryKey: ['teacher-class-requests', classId] });
      queryClient.invalidateQueries({ queryKey: ['teacher-class-members', classId] });
      queryClient.invalidateQueries({ queryKey: ['teacher-class-detail', classId] });
      queryClient.invalidateQueries({ queryKey: ['teacher-classes'] });
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Không thể duyệt yêu cầu',
        message: getApiErrorMessage(err),
      });
    },
    onSettled: () => {
      setProcessingRequestId(null);
    },
  });

  // Mutation: Reject join request
  const rejectRequestMutation = useMutation({
    mutationFn: (membershipId: string) =>
      teacherClassesService.rejectJoinRequest(classId!, membershipId),
    onSuccess: () => {
      showToast({
        type: 'info',
        title: 'Đã từ chối',
        message: 'Yêu cầu tham gia đã bị từ chối',
      });
      queryClient.invalidateQueries({ queryKey: ['teacher-class-requests', classId] });
      queryClient.invalidateQueries({ queryKey: ['teacher-class-detail', classId] });
      queryClient.invalidateQueries({ queryKey: ['teacher-classes'] });
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Không thể từ chối yêu cầu',
        message: getApiErrorMessage(err),
      });
    },
    onSettled: () => {
      setProcessingRequestId(null);
    },
  });

  const handleCopyCode = () => {
    if (!classData?.joinCode) return;
    navigator.clipboard.writeText(classData.joinCode);
    setCopiedCode(true);
    showToast({
      type: 'info',
      title: 'Đã sao chép mã',
      message: `Mã tham gia "${classData.joinCode}" đã được sao chép`,
    });
    setTimeout(() => setCopiedCode(false), 2500);
  };

  if (isClassLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="h-8 w-64 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (isClassError || !classData) {
    return (
      <div className="space-y-6">
        <Link
          to="/teacher/classes"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách lớp
        </Link>
        <ErrorState
          title="Không tìm thấy lớp học"
          message={getApiErrorMessage(classError)}
          onRetry={() => refetchClass()}
        />
      </div>
    );
  }

  const statusMeta = getClassStatusMeta(classData.status);
  const isClosed = classData.status === 'CLOSED';
  const pendingRequestsCount = classData.pendingRequestsCount || 0;
  const nextSession = classData.nextSession;

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <Link
            to="/teacher/classes"
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Tất cả lớp học
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold font-serif text-slate-900">{classData.name}</h1>
            <Badge className={statusMeta.badgeClass}>{statusMeta.label}</Badge>
          </div>
          {classData.description && (
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              {classData.description}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditOpen(true)}
            className="cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1.5" />
            Sửa lớp
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsStatusModalOpen(true)}
            className="cursor-pointer"
          >
            {isClosed ? (
              <>
                <Unlock className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                Mở lại lớp
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                Đóng lớp
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Spotlight Next Session Banner nếu có */}
      {nextSession && (
        <div
          className={`rounded-2xl border p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            nextSession.status === 'IN_PROGRESS'
              ? 'border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50/40 to-amber-50/20 ring-1 ring-amber-200'
              : 'border-blue-200 bg-gradient-to-r from-blue-50/50 via-slate-50/30 to-amber-50/20'
          }`}
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {nextSession.status === 'IN_PROGRESS' ? 'Buổi học đang diễn ra' : 'Buổi học tiếp theo'}
              </span>

              {nextSession.status === 'IN_PROGRESS' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                  ĐANG DIỄN RA (LIVE)
                </span>
              ) : (
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                  Sắp diễn ra
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold font-serif text-slate-900">
              {nextSession.title}
            </h3>

            <div className="flex items-center gap-3 text-xs text-slate-600 font-mono">
              <span className="flex items-center gap-1 font-sans">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                {formatDate(nextSession.startTime)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                {formatTime(nextSession.startTime)} - {formatTime(nextSession.endTime)}
              </span>
            </div>
          </div>

          <div className="shrink-0">
            <Button
              size="sm"
              onClick={() => setActiveTab('sessions')}
              className="bg-amber-700 hover:bg-amber-800 text-white cursor-pointer"
            >
              Xem trong danh sách buổi học &rarr;
            </Button>
          </div>
        </div>
      )}

      {/* Thông tin mã tham gia & Thống kê nhanh */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card Mã tham gia */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-xs">
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
            Mã tham gia lớp
          </p>
          <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-amber-200 mt-2">
            <span className="font-mono text-base font-extrabold text-amber-950 tracking-wider">
              {classData.joinCode}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopyCode}
                title="Sao chép mã"
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                {copiedCode ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsRegenerateModalOpen(true)}
                title="Tạo lại mã tham gia mới"
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-[11px] text-amber-700/90 mt-2 leading-tight">
            Cung cấp mã này cho học sinh để gửi yêu cầu vào lớp.
          </p>
        </div>

        {/* Card Sĩ số học sinh */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sĩ số học sinh</p>
              <p className="text-xl font-bold text-slate-900">
                {classData.activeStudentCount ?? 0}
                <span className="text-sm font-normal text-slate-400">
                  {' '}/ {classData.maxStudents !== null && classData.maxStudents !== undefined ? `${classData.maxStudents} chỗ` : 'Không giới hạn'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Card Yêu cầu chờ duyệt */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Yêu cầu chờ duyệt</p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold text-slate-900">{pendingRequestsCount}</p>
                {pendingRequestsCount > 0 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    Cần duyệt
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card Buổi học */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng số buổi học</p>
              <p className="text-xl font-bold text-slate-900">
                {classData.totalSessionsCount ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'members'
                ? 'border-amber-600 text-amber-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Học sinh</span>
            <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-semibold">
              {classData.activeStudentCount ?? 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'requests'
                ? 'border-amber-600 text-amber-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Yêu cầu tham gia</span>
            {pendingRequestsCount > 0 && (
              <span className="ml-1 rounded-full bg-amber-500 text-white px-2 py-0.5 text-xs font-bold">
                {pendingRequestsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sessions')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'sessions'
                ? 'border-amber-600 text-amber-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Buổi học</span>
            <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-semibold">
              {classData.totalSessionsCount ?? 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('materials')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'materials'
                ? 'border-amber-600 text-amber-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Tài liệu lớp học</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-amber-600 text-amber-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <span>Tổng quan</span>
          </button>
        </nav>
      </div>

      {/* Tab 1: DANH SÁCH HỌC SINH */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex-1 sm:max-w-xs">
              <Input
                placeholder="Tìm học sinh theo tên, email, sđt..."
                value={memberSearch}
                onChange={(e) => {
                  setMemberSearch(e.target.value);
                  setMemberPage(1);
                }}
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Trạng thái:</label>
              <select
                value={memberStatusFilter}
                onChange={(e) => {
                  setMemberStatusFilter(e.target.value);
                  setMemberPage(1);
                }}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-xs focus:border-amber-500 focus:outline-none cursor-pointer"
              >
                <option value="ACTIVE">Đang học (ACTIVE)</option>
                <option value="ALL">Tất cả trạng thái</option>
                <option value="REMOVED">Đã xóa (REMOVED)</option>
                <option value="LEFT">Đã rời lớp (LEFT)</option>
                <option value="INACTIVE">Tạm ngưng (INACTIVE)</option>
              </select>
            </div>
          </div>

          {isMembersError ? (
            <ErrorState
              title="Không thể tải danh sách học sinh"
              message={getApiErrorMessage(membersError)}
              onRetry={() => refetchMembers()}
            />
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Học sinh</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Số điện thoại</TableHead>
                    <TableHead>Ngày tham gia</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isMembersLoading ? (
                    <SkeletonTableRows rows={5} />
                  ) : (membersData?.items || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12">
                        <EmptyState
                          icon={<Users className="w-8 h-8 text-slate-400" />}
                          title="Chưa có học sinh nào"
                          description={
                            memberSearch
                              ? 'Không tìm thấy học sinh phù hợp với từ khóa tìm kiếm.'
                              : 'Lớp học hiện chưa có học sinh nào. Hãy chia sẻ mã tham gia cho học sinh.'
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    membersData?.items.map((m) => {
                      const memberMeta = getMemberStatusMeta(m.status);
                      const isActiveMember = m.status === 'ACTIVE';

                      return (
                        <TableRow key={m.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-800 font-bold text-xs shrink-0">
                                {m.student.fullName?.charAt(0)?.toUpperCase() || 'H'}
                              </div>
                              <span className="font-semibold text-slate-900 text-sm">
                                {m.student.fullName}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="text-xs text-slate-600">
                            {m.student.email || '-'}
                          </TableCell>

                          <TableCell className="text-xs text-slate-600 font-mono">
                            {m.student.phone || '-'}
                          </TableCell>

                          <TableCell className="text-xs text-slate-500">
                            {formatDate(m.joinedAt || m.requestedAt)}
                          </TableCell>

                          <TableCell>
                            <Badge className={memberMeta.badgeClass}>
                              {memberMeta.label}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right">
                            {isActiveMember && (
                              <button
                                type="button"
                                onClick={() => setMemberToRemove(m)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <UserX className="w-3.5 h-3.5" />
                                Xóa khỏi lớp
                              </button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              {membersData?.pagination && membersData.pagination.totalPages > 1 && (
                <Pagination
                  currentPage={membersData.pagination.page}
                  totalPages={membersData.pagination.totalPages}
                  totalItems={membersData.pagination.total}
                  onPageChange={(p) => setMemberPage(p)}
                  disabled={isMembersLoading}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: YÊU CẦU THAM GIA */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex-1 sm:max-w-xs">
              <Input
                placeholder="Tìm yêu cầu theo tên, email, sđt..."
                value={requestSearch}
                onChange={(e) => {
                  setRequestSearch(e.target.value);
                  setRequestPage(1);
                }}
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>
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
                    <TableHead>Học sinh gửi yêu cầu</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Số điện thoại</TableHead>
                    <TableHead>Thời gian gửi</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isRequestsLoading ? (
                    <SkeletonTableRows rows={4} />
                  ) : (requestsData?.items || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12">
                        <EmptyState
                          icon={<Clock className="w-8 h-8 text-slate-400" />}
                          title="Không có yêu cầu nào đang chờ duyệt"
                          description={
                            requestSearch
                              ? 'Không tìm thấy yêu cầu nào phù hợp với từ khóa tìm kiếm.'
                              : 'Khi học sinh nhập mã tham gia lớp, yêu cầu gia nhập sẽ hiển thị tại đây để bạn xem xét.'
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    requestsData?.items.map((req) => {
                      const isProcessing = processingRequestId === req.id;

                      return (
                        <TableRow key={req.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-800 font-bold text-xs shrink-0">
                                {req.student.fullName?.charAt(0)?.toUpperCase() || 'H'}
                              </div>
                              <span className="font-semibold text-slate-900 text-sm">
                                {req.student.fullName}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="text-xs text-slate-600">
                            {req.student.email || '-'}
                          </TableCell>

                          <TableCell className="text-xs text-slate-600 font-mono">
                            {req.student.phone || '-'}
                          </TableCell>

                          <TableCell className="text-xs text-slate-500">
                            {formatDateTime(req.requestedAt)}
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isProcessing}
                                onClick={() => {
                                  setProcessingRequestId(req.id);
                                  rejectRequestMutation.mutate(req.id);
                                }}
                                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5 mr-1" />
                                Từ chối
                              </Button>

                              <Button
                                size="sm"
                                isLoading={isProcessing && approveRequestMutation.isPending}
                                disabled={isProcessing}
                                onClick={() => {
                                  setProcessingRequestId(req.id);
                                  approveRequestMutation.mutate(req.id);
                                }}
                                className="bg-amber-700 hover:bg-amber-800 text-white cursor-pointer"
                              >
                                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                Duyệt
                              </Button>
                            </div>
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
                  disabled={isRequestsLoading}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: BUỔI HỌC CỦA LỚP */}
      {activeTab === 'sessions' && (
        <TeacherClassSessionsTab classId={classId!} />
      )}

      {/* Tab 4: TÀI LIỆU LỚP HỌC */}
      {activeTab === 'materials' && (
        <TeacherClassMaterialsTab
          classId={classId!}
          classNameTitle={classData?.name}
        />
      )}

      {/* Tab 5: TỔNG QUAN LỚP HỌC */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Thông tin chi tiết</h3>
            <div className="divide-y divide-slate-100 text-sm">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Tên lớp:</span>
                <span className="font-semibold text-slate-900">{classData.name}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Mã lớp hệ thống:</span>
                <span className="font-mono text-slate-700">{classData.classCode || classData.id}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Mã tham gia học sinh:</span>
                <span className="font-mono font-bold text-amber-900">{classData.joinCode}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Trạng thái:</span>
                <Badge className={statusMeta.badgeClass}>{statusMeta.label}</Badge>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Học phí tháng:</span>
                <span className="font-bold text-amber-900">{formatCurrency(classData.monthlyTuition)}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Sĩ số tối đa:</span>
                <span className="font-medium text-slate-900">
                  {classData.maxStudents !== null && classData.maxStudents !== undefined
                    ? `${classData.maxStudents} học sinh`
                    : 'Không giới hạn'}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Ngày tạo lớp:</span>
                <span className="text-slate-700">{formatDateTime(classData.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Phòng học trực tuyến</h3>
            {classData.defaultMeetUrl ? (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 truncate">
                    <Video className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="text-sm font-mono text-slate-800 truncate">
                      {classData.defaultMeetUrl}
                    </span>
                  </div>
                  <a
                    href={classData.defaultMeetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shrink-0 cursor-pointer"
                  >
                    <span>Vào phòng</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-xs text-slate-500">
                  Link Google Meet mặc định của lớp học được dùng cho các buổi học không thiết lập link riêng.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
                <p className="text-sm text-slate-500">Chưa thiết lập link Google Meet mặc định</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditOpen(true)}
                  className="cursor-pointer"
                >
                  Thêm link Meet
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Sửa lớp */}
      <ClassFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={async (payload) => {
          await updateClassMutation.mutateAsync(payload);
        }}
        classToEdit={classData as ClassItem}
        isLoading={updateClassMutation.isPending}
      />

      {/* Modal Tạo lại mã tham gia */}
      <ConfirmModal
        isOpen={isRegenerateModalOpen}
        onClose={() => setIsRegenerateModalOpen(false)}
        onConfirm={() => regenerateCodeMutation.mutate()}
        title="Tạo lại mã tham gia mới?"
        description={
          <div className="space-y-2">
            <p>
              Bạn có chắc chắn muốn tạo mã tham gia mới cho lớp{' '}
              <strong className="text-slate-900">{classData.name}</strong>?
            </p>
            <p className="text-rose-600 font-semibold text-xs">
              ⚠️ Cảnh báo: Mã tham gia hiện tại ({classData.joinCode}) sẽ bị vô hiệu hóa ngay lập tức. Học sinh chưa vào lớp sẽ cần mã mới để gửi yêu cầu.
            </p>
          </div>
        }
        confirmLabel="Tạo mã mới"
        variant="warning"
        isLoading={regenerateCodeMutation.isPending}
      />

      {/* Modal Đóng / Mở lại lớp */}
      <ConfirmModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onConfirm={() => {
          const nextStatus: ClassStatus = isClosed ? 'ACTIVE' : 'CLOSED';
          updateStatusMutation.mutate(nextStatus);
        }}
        title={isClosed ? 'Mở lại lớp học?' : 'Đóng lớp học?'}
        description={
          isClosed ? (
            <p>
              Khi mở lại lớp học, học sinh mới sẽ có thể gửi yêu cầu tham gia lớp bằng mã tham gia.
            </p>
          ) : (
            <div className="space-y-2">
              <p>
                Khi đóng lớp học, học sinh sẽ không thể gửi yêu cầu tham gia nữa và bạn cũng không thể duyệt thêm học sinh mới.
              </p>
              <p className="text-xs text-slate-500">
                Các học sinh đang hoạt động trong lớp vẫn giữ nguyên danh sách.
              </p>
            </div>
          )
        }
        confirmLabel={isClosed ? 'Mở lại lớp' : 'Đóng lớp'}
        variant={isClosed ? 'primary' : 'warning'}
        isLoading={updateStatusMutation.isPending}
      />

      {/* Modal Xóa học sinh khỏi lớp */}
      {memberToRemove && (
        <ConfirmModal
          isOpen={Boolean(memberToRemove)}
          onClose={() => setMemberToRemove(null)}
          onConfirm={() => removeMemberMutation.mutate(memberToRemove.student.id)}
          title="Xóa học sinh khỏi lớp học?"
          description={
            <div className="space-y-2">
              <p>
                Bạn có chắc chắn muốn xóa học sinh{' '}
                <strong className="text-slate-900">{memberToRemove.student.fullName}</strong> khỏi lớp học này?
              </p>
              <p className="text-xs text-slate-500">
                Thao tác này sẽ chuyển trạng thái của học sinh thành <strong>REMOVED</strong>. Tài khoản của học sinh không bị xóa khỏi hệ thống và lịch sử học tập được bảo tồn.
              </p>
            </div>
          }
          confirmLabel="Xóa học sinh"
          variant="danger"
          isLoading={removeMemberMutation.isPending}
        />
      )}
    </div>
  );
}
