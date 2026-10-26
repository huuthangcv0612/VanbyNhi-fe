import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Search,
  Plus,
  Users,
  CheckCircle2,
  X,
  Filter,
} from 'lucide-react';
import { teacherClassesService } from '../services/classes.service';
import type { ClassItem, TeacherCreateClassDto, TeacherUpdateClassDto } from '../types/class.types';
import type { ClassStatus } from '@/types/common.types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { getApiErrorMessage } from '@/lib/api-client';
import { useToast } from '@/hooks/useToast';
import { ClassFormModal } from '../components/ClassFormModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { TeacherClassCard } from '../components/TeacherClassCard';

export function TeacherClassesListPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const limit = 9;

  // Modal tạo / sửa lớp
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
        search: search.trim() ? search.trim() : undefined,
        status: statusFilter !== 'ALL' ? (statusFilter as ClassStatus) : undefined,
      }),
  });

  // Giữ nguyên thứ tự chính xác từ Backend (đã được sắp xếp theo priority)
  const classes = data?.items || [];
  const pagination = data?.pagination;

  // Thống kê thực tế từ dữ liệu
  const totalClasses = pagination?.total ?? classes.length;
  const activeClassesOnPage = classes.filter((c) => c.status === 'ACTIVE').length;
  const totalActiveStudentsOnPage = classes.reduce(
    (acc, curr) => acc + (curr.activeStudentCount || 0),
    0,
  );

  // Mutation tạo lớp
  const createMutation = useMutation({
    mutationFn: (payload: TeacherCreateClassDto) => teacherClassesService.createClass(payload),
    onSuccess: (res) => {
      const meetStatus = res.class?.meetSpace?.status;
      if (meetStatus === 'READY') {
        showToast({
          type: 'success',
          title: 'Tạo lớp thành công',
          message: `Lớp "${res.class.name}" đã được tạo thành công cùng phòng Google Meet sẵn sàng. Mã tham gia: ${res.class.joinCode}`,
        });
      } else if (meetStatus === 'FAILED') {
        showToast({
          type: 'warning',
          title: 'Lớp học đã được tạo',
          message:
            res.class.meetSpace?.errorMessage ||
            `Lớp "${res.class.name}" đã được tạo nhưng chưa thể tạo phòng Google Meet. Vui lòng bấm thử lại trong trang chi tiết lớp.`,
        });
      } else if (meetStatus === 'PENDING') {
        showToast({
          type: 'info',
          title: 'Lớp học đã được tạo',
          message: `Lớp "${res.class.name}" đã được tạo. Phòng Google Meet đang được khởi tạo.`,
        });
      } else {
        showToast({
          type: 'success',
          title: 'Tạo lớp thành công',
          message: `Lớp "${res.class.name}" đã được tạo với mã tham gia: ${res.class.joinCode}`,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['teacher-classes'] });
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Không thể tạo lớp học',
        message: getApiErrorMessage(err),
      });
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
      queryClient.invalidateQueries({ queryKey: ['teacher-class-detail', res.class.id] });
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Không thể cập nhật lớp học',
        message: getApiErrorMessage(err),
      });
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
      queryClient.invalidateQueries({ queryKey: ['teacher-class-detail', vars.id] });
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

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearch('');
    setPage(1);
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header with responsive action button */}
      <PageHeader
        title="Quản lý Lớp học"
        description="Danh sách các lớp học do bạn giảng dạy — sắp xếp tự động theo lớp đang diễn ra và sắp tới"
        action={
          <Button
            onClick={() => {
              setEditingClass(null);
              setIsFormOpen(true);
            }}
            aria-label="Tạo lớp mới"
            className="shrink-0 bg-amber-700 hover:bg-amber-800 text-white cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1 sm:mr-1.5" />
            <span className="hidden sm:inline">Tạo lớp mới</span>
            <span className="sm:hidden font-medium">Tạo lớp</span>
          </Button>
        }
      />

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng số lớp</p>
              <p className="text-2xl font-bold text-slate-900">{totalClasses}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Đang mở (trang này)</p>
              <p className="text-2xl font-bold text-slate-900">{activeClassesOnPage}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Học sinh (trang này)</p>
              <p className="text-2xl font-bold text-slate-900">{totalActiveStudentsOnPage}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar: Tìm kiếm, Lọc trạng thái */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 sm:max-w-md">
          <Input
            placeholder="Tìm theo tên lớp, mã tham gia hoặc mô tả..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            aria-label="Tìm kiếm lớp học"
          />
          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
              aria-label="Xóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:inline" />
          <label className="text-xs font-medium text-slate-500 whitespace-nowrap sr-only sm:not-sr-only">Trạng thái:</label>
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            aria-label="Lọc theo trạng thái lớp học"
            className="flex-1 sm:flex-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-700 shadow-2xs focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer min-h-[42px] sm:min-h-[38px]"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang mở (ACTIVE)</option>
            <option value="INACTIVE">Tạm dừng (INACTIVE)</option>
            <option value="COMPLETED">Đã kết thúc (COMPLETED)</option>
            <option value="CLOSED">Đã đóng (CLOSED)</option>
          </select>
        </div>
      </div>

      {/* Content: Danh sách lớp học dạng Card */}
      {isError ? (
        <ErrorState
          title="Không thể tải danh sách lớp học"
          message={getApiErrorMessage(error)}
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-6 w-12 rounded-lg" />
              </div>
              <Skeleton className="h-6 w-3/4 rounded-lg" />
              <Skeleton className="h-10 rounded-xl" />
              <div className="space-y-2 pt-2">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-4/5 rounded" />
              </div>
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-10 rounded-xl" />
            </div>
          ))}
        </div>
      ) : classes.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-8 h-8 text-slate-400" />}
          title="Chưa có lớp học nào"
          description={
            search || statusFilter !== 'ALL'
              ? 'Không tìm thấy lớp học nào phù hợp với điều kiện tìm kiếm và lọc hiện tại.'
              : 'Bạn chưa tạo lớp học nào. Hãy bấm "Tạo lớp mới" để bắt đầu mở lớp giảng dạy.'
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
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {classes.map((cls) => (
              <TeacherClassCard
                key={cls.id}
                classItem={cls}
                onEdit={(c) => {
                  setEditingClass(c);
                  setIsFormOpen(true);
                }}
                onToggleStatus={(c) => setStatusModalTarget(c)}
                onCopyCode={handleCopyCode}
                isCopied={copiedCode === cls.joinCode}
              />
            ))}
          </div>

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
              <div className="space-y-2">
                <p>
                  Bạn có chắc chắn muốn đóng lớp{' '}
                  <strong className="text-slate-900">{statusModalTarget.name}</strong>?
                </p>
                <p className="text-xs text-slate-500">
                  Khi đóng, học sinh sẽ không thể gửi yêu cầu tham gia lớp học này nữa. Danh sách học sinh hiện tại vẫn được giữ nguyên.
                </p>
              </div>
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
