import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Plus,
  Copy,
  Check,
  Users,
  CheckCircle2,
  Lock,
  Unlock,
  ExternalLink,
  Edit2,
} from 'lucide-react';
import { teacherClassesService } from '../services/classes.service';
import type { ClassItem, TeacherCreateClassDto, TeacherUpdateClassDto } from '../types/class.types';
import type { ClassStatus } from '@/types/common.types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { SkeletonTableRows } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { getClassStatusMeta, formatCurrency, formatDate } from '@/utils/formatters';
import { getApiErrorMessage } from '@/lib/api-client';
import { useToast } from '@/hooks/useToast';
import { ClassFormModal } from '../components/ClassFormModal';
import { ConfirmModal } from '../components/ConfirmModal';

export function TeacherClassesListPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const limit = 10;

  // Modal tạo / sửa
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);

  // Modal đổi trạng thái lớp
  const [statusModalTarget, setStatusModalTarget] = useState<ClassItem | null>(null);

  // Copy state
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['teacher-classes', { page, limit, search, statusFilter }],
    queryFn: () =>
      teacherClassesService.getMyClasses({
        page,
        limit,
        search: search || undefined,
        status: statusFilter !== 'ALL' ? (statusFilter as ClassStatus) : undefined,
      }),
  });

  const classes = data?.items || [];
  const pagination = data?.pagination;

  // Thống kê sơ bộ
  const totalClasses = pagination?.total || classes.length;
  const activeClasses = classes.filter((c) => c.status === 'ACTIVE').length;
  const totalActiveStudents = classes.reduce(
    (acc, curr) => acc + (curr.activeStudentCount || 0),
    0,
  );

  // Mutation tạo lớp
  const createMutation = useMutation({
    mutationFn: (payload: TeacherCreateClassDto) => teacherClassesService.createClass(payload),
    onSuccess: (res) => {
      showToast({
        type: 'success',
        title: 'Tạo lớp thành công',
        message: `Lớp "${res.class.name}" đã được tạo với mã tham gia: ${res.class.joinCode}`,
      });
      queryClient.invalidateQueries({ queryKey: ['teacher-classes'] });
    },
  });

  // Mutation sửa lớp
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TeacherUpdateClassDto }) =>
      teacherClassesService.updateClass(id, payload),
    onSuccess: (res) => {
      showToast({
        type: 'success',
        title: 'Cập nhật thành công',
        message: `Đã lưu thay đổi cho lớp "${res.class.name}"`,
      });
      queryClient.invalidateQueries({ queryKey: ['teacher-classes'] });
    },
  });

  // Mutation đổi trạng thái lớp (Đóng / Mở)
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ClassStatus }) =>
      teacherClassesService.updateClassStatus(id, status),
    onSuccess: (_, vars) => {
      showToast({
        type: 'success',
        title: 'Cập nhật trạng thái thành công',
        message: vars.status === 'CLOSED' ? 'Đã đóng lớp học' : 'Đã mở lại lớp học',
      });
      queryClient.invalidateQueries({ queryKey: ['teacher-classes'] });
      setStatusModalTarget(null);
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Không thể cập nhật trạng thái',
        message: getApiErrorMessage(err),
      });
    },
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast({
      type: 'info',
      title: 'Đã sao chép mã',
      message: `Mã tham gia "${code}" đã được sao chép vào bộ nhớ đệm`,
    });
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleFormSubmit = async (payload: TeacherCreateClassDto | TeacherUpdateClassDto) => {
    if (editingClass) {
      await updateMutation.mutateAsync({ id: editingClass.id, payload });
    } else {
      await createMutation.mutateAsync(payload as TeacherCreateClassDto);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Quản lý Lớp học"
          description="Danh sách và quản lý các lớp học do bạn trực tiếp phụ trách giảng dạy"
        />
        <Button
          onClick={() => {
            setEditingClass(null);
            setIsFormOpen(true);
          }}
          className="self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Tạo lớp mới
        </Button>
      </div>

      {/* Thẻ thống kê */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng số lớp</p>
              <p className="text-2xl font-bold text-slate-900">{totalClasses}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Lớp đang mở</p>
              <p className="text-2xl font-bold text-slate-900">{activeClasses}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Học sinh đang học</p>
              <p className="text-2xl font-bold text-slate-900">{totalActiveStudents}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bộ lọc tìm kiếm */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex-1 sm:max-w-md">
          <Input
            placeholder="Tìm theo tên hoặc mã tham gia..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Trạng thái:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-xs focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang mở (ACTIVE)</option>
            <option value="CLOSED">Đã đóng (CLOSED)</option>
            <option value="INACTIVE">Tạm dừng (INACTIVE)</option>
            <option value="COMPLETED">Đã kết thúc (COMPLETED)</option>
          </select>
        </div>
      </div>

      {/* Danh sách lớp học */}
      {isError ? (
        <ErrorState
          title="Không thể tải danh sách lớp học"
          message={getApiErrorMessage(error)}
          onRetry={() => refetch()}
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên lớp học</TableHead>
                <TableHead>Mã tham gia</TableHead>
                <TableHead>Sĩ số</TableHead>
                <TableHead>Học phí / tháng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <SkeletonTableRows rows={5} />
              ) : classes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12">
                    <EmptyState
                      icon={<BookOpen className="w-8 h-8 text-slate-400" />}
                      title="Chưa có lớp học nào"
                      description={
                        search || statusFilter !== 'ALL'
                          ? 'Không tìm thấy lớp học nào phù hợp với bộ lọc hiện tại.'
                          : 'Bạn chưa tạo lớp học nào. Hãy bấm "Tạo lớp mới" để bắt đầu.'
                      }
                      actionLabel={!search && statusFilter === 'ALL' ? 'Tạo lớp ngay' : undefined}
                      onAction={
                        !search && statusFilter === 'ALL'
                          ? () => {
                              setEditingClass(null);
                              setIsFormOpen(true);
                            }
                          : undefined
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                classes.map((cls) => {
                  const statusMeta = getClassStatusMeta(cls.status);
                  const isCopied = copiedCode === cls.joinCode;

                  return (
                    <TableRow key={cls.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell>
                        <div className="max-w-xs">
                          <Link
                            to={`/teacher/classes/${cls.id}`}
                            className="font-semibold text-slate-900 hover:text-amber-700 transition-colors flex items-center gap-1.5 group"
                          >
                            <span>{cls.name}</span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                          </Link>
                          {cls.description && (
                            <p className="text-xs text-slate-500 font-normal truncate mt-0.5" title={cls.description}>
                              {cls.description}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="inline-flex items-center gap-1.5 bg-slate-100/90 hover:bg-slate-200/80 transition-colors px-2.5 py-1 rounded-lg border border-slate-200">
                          <span className="font-mono text-xs font-bold text-slate-800 tracking-wider">
                            {cls.joinCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(cls.joinCode)}
                            title="Sao chép mã tham gia"
                            className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5 rounded transition-colors"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-xs font-medium text-slate-700">
                          <span className="font-bold text-slate-900">
                            {cls.activeStudentCount ?? 0}
                          </span>
                          <span className="text-slate-400"> / </span>
                          <span>{cls.maxStudents !== null && cls.maxStudents !== undefined ? cls.maxStudents : 'Không giới hạn'}</span>
                        </div>
                      </TableCell>

                      <TableCell className="font-medium text-amber-900 text-xs">
                        {formatCurrency(cls.monthlyTuition)}
                      </TableCell>

                      <TableCell>
                        <Badge className={statusMeta.badgeClass}>
                          {statusMeta.label}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs text-slate-500">
                        {formatDate(cls.createdAt)}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/teacher/classes/${cls.id}`}
                            className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-medium transition-colors cursor-pointer"
                            title="Xem chi tiết lớp"
                          >
                            Chi tiết
                          </Link>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingClass(cls);
                              setIsFormOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setStatusModalTarget(cls)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                            title={cls.status === 'CLOSED' ? 'Mở lại lớp học' : 'Đóng lớp học'}
                          >
                            {cls.status === 'CLOSED' ? (
                              <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-amber-600" />
                            )}
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              onPageChange={(p) => setPage(p)}
              disabled={isLoading}
            />
          )}
        </div>
      )}

      {/* Modal Tạo / Sửa lớp */}
      <ClassFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingClass(null);
        }}
        onSubmit={handleFormSubmit}
        classToEdit={editingClass}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Modal xác nhận Đóng / Mở lại lớp */}
      {statusModalTarget && (
        <ConfirmModal
          isOpen={Boolean(statusModalTarget)}
          onClose={() => setStatusModalTarget(null)}
          onConfirm={() => {
            const newStatus: ClassStatus =
              statusModalTarget.status === 'CLOSED' ? 'ACTIVE' : 'CLOSED';
            toggleStatusMutation.mutate({
              id: statusModalTarget.id,
              status: newStatus,
            });
          }}
          title={
            statusModalTarget.status === 'CLOSED'
              ? 'Mở lại lớp học?'
              : 'Đóng lớp học?'
          }
          description={
            statusModalTarget.status === 'CLOSED' ? (
              <p>
                Bạn có chắc chắn muốn mở lại lớp{' '}
                <strong className="text-slate-900">{statusModalTarget.name}</strong>? Khi mở, học sinh mới sẽ có thể gửi yêu cầu tham gia lại bằng mã tham gia.
              </p>
            ) : (
              <p>
                Bạn có chắc chắn muốn đóng lớp{' '}
                <strong className="text-slate-900">{statusModalTarget.name}</strong>? Khi đóng, học sinh sẽ không thể gửi yêu cầu tham gia lớp này nữa.
              </p>
            )
          }
          confirmLabel={
            statusModalTarget.status === 'CLOSED' ? 'Mở lại lớp' : 'Đóng lớp'
          }
          variant={statusModalTarget.status === 'CLOSED' ? 'primary' : 'warning'}
          isLoading={toggleStatusMutation.isPending}
        />
      )}
    </div>
  );
}
