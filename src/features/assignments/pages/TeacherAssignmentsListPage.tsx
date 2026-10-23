import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Plus,
  Calendar,
  BookOpen,
  Edit2,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { SkeletonTableRows } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { ConfirmModal } from '@/features/classes/components/ConfirmModal';
import { teacherClassesService } from '@/features/classes/services/classes.service';
import { AssignmentFormModal } from '../components/AssignmentFormModal';
import {
  useAssignmentsList,
  useCreateAssignment,
  useUpdateAssignment,
  useDeleteAssignment,
} from '../hooks/useAssignments';
import type { AssignmentItem, CreateAssignmentDto, UpdateAssignmentDto } from '../types/assignment.types';
import { formatDateTime } from '@/utils/formatters';
import { isPastDue } from '../utils/assignment.utils';
import { getApiErrorMessage } from '@/lib/api-client';
import { useToast } from '@/hooks/useToast';

export function TeacherAssignmentsListPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [page, setPage] = useState(1);
  const limit = 10;
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [deadlineFilter, setDeadlineFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED'>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'CLOSEST_DUE'>('NEWEST');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [assignmentToEdit, setAssignmentToEdit] = useState<AssignmentItem | null>(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState<AssignmentItem | null>(null);

  // Lấy danh sách lớp học của giáo viên để lọc
  const { data: classesData } = useQuery({
    queryKey: ['teacher-classes-filter'],
    queryFn: () => teacherClassesService.getMyClasses({ limit: 100 }),
  });
  const classes = classesData?.items || [];

  // Lấy danh sách bài tập từ backend
  const {
    data: assignmentsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useAssignmentsList({
    page,
    limit,
    classId: selectedClassId || undefined,
  });

  const createMutation = useCreateAssignment();
  const updateMutation = useUpdateAssignment(assignmentToEdit?.id || '');
  const deleteMutation = useDeleteAssignment();

  const pagination = assignmentsData?.pagination;

  // Lọc và sắp xếp phía client theo UI preferences
  const displayedAssignments = useMemo(() => {
    const rawAssignments = assignmentsData?.items || [];
    let list = [...rawAssignments];

    if (deadlineFilter === 'ACTIVE') {
      list = list.filter((a) => !isPastDue(a.dueDate));
    } else if (deadlineFilter === 'EXPIRED') {
      list = list.filter((a) => isPastDue(a.dueDate));
    }

    if (sortBy === 'CLOSEST_DUE') {
      list.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    }

    return list;
  }, [assignmentsData?.items, deadlineFilter, sortBy]);

  const handleCreateSubmit = async (dto: CreateAssignmentDto | UpdateAssignmentDto) => {
    await createMutation.mutateAsync(dto as CreateAssignmentDto);
    showToast({
      type: 'success',
      message: 'Tạo bài tập mới thành công!',
    });
  };

  const handleUpdateSubmit = async (dto: CreateAssignmentDto | UpdateAssignmentDto) => {
    if (!assignmentToEdit) return;
    await updateMutation.mutateAsync(dto as UpdateAssignmentDto);
    showToast({
      type: 'success',
      message: 'Cập nhật bài tập thành công!',
    });
  };

  const handleDeleteConfirm = async () => {
    if (!assignmentToDelete) return;
    try {
      await deleteMutation.mutateAsync(assignmentToDelete.id);
      showToast({
        type: 'success',
        message: 'Đã xóa bài tập thành công',
      });
      setAssignmentToDelete(null);
    } catch (err: unknown) {
      showToast({
        type: 'error',
        message: getApiErrorMessage(err),
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Bài tập & Chấm bài"
        description="Giao bài tập, theo dõi tiến độ nộp bài và thực hiện chấm chữa bài cho học sinh"
        action={
          <Button
            type="button"
            variant="primary"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo bài tập mới</span>
          </Button>
        }
      />

      {/* Bộ lọc và sắp xếp */}
      <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Lọc theo lớp học */}
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 px-3 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              <option value="">-- Tất cả các lớp --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.classCode})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Lọc hạn nộp */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setDeadlineFilter('ALL')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  deadlineFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setDeadlineFilter('ACTIVE')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  deadlineFilter === 'ACTIVE'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Còn hạn
              </button>
              <button
                type="button"
                onClick={() => setDeadlineFilter('EXPIRED')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  deadlineFilter === 'EXPIRED'
                    ? 'bg-white text-rose-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Đã quá hạn
              </button>
            </div>

            {/* Sắp xếp */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'NEWEST' | 'CLOSEST_DUE')}
              className="h-8 px-2.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-700 focus:outline-hidden"
            >
              <option value="NEWEST">Mới tạo nhất</option>
              <option value="CLOSEST_DUE">Hạn nộp gần nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bảng danh sách bài tập */}
      {isError ? (
        <ErrorState
          title="Không thể tải danh sách bài tập"
          message={getApiErrorMessage(error)}
          onRetry={() => refetch()}
        />
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiêu đề bài tập</TableHead>
                  <TableHead>Lớp học</TableHead>
                  <TableHead>Hạn nộp</TableHead>
                  <TableHead>Thang điểm</TableHead>
                  <TableHead>Số bài nộp</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <SkeletonTableRows rows={5} />
                ) : displayedAssignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12">
                      <EmptyState
                        icon={<FileText className="w-8 h-8 text-slate-400" />}
                        title="Chưa có bài tập nào"
                        description={
                          selectedClassId
                            ? 'Lớp học này hiện chưa có bài tập nào được giao.'
                            : 'Bấm nút "Tạo bài tập mới" để giao đề cho học sinh.'
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedAssignments.map((item) => {
                    const expired = isPastDue(item.dueDate);
                    const submissionCount = item._count?.submissions ?? 0;

                    return (
                      <TableRow key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <TableCell>
                          <div className="max-w-md">
                            <button
                              type="button"
                              onClick={() => navigate(`/teacher/assignments/${item.id}`)}
                              className="font-semibold text-sm text-slate-900 hover:text-amber-700 text-left cursor-pointer transition-colors"
                            >
                              {item.title}
                            </button>
                            {item.description && (
                              <p className="text-xs text-slate-500 font-normal truncate mt-0.5">
                                {item.description}
                              </p>
                            )}
                            {item.session && (
                              <p className="text-[11px] text-amber-800 font-medium mt-1">
                                Buổi học: {item.session.title}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="text-xs font-medium text-slate-800">
                            {item.class?.name || 'Mặc định'}
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {item.class?.classCode}
                          </span>
                        </TableCell>

                        <TableCell>
                          {item.dueDate ? (
                            <div className="flex flex-col text-xs">
                              <span
                                className={`flex items-center gap-1 font-medium ${
                                  expired ? 'text-rose-700' : 'text-slate-800'
                                }`}
                              >
                                <Calendar className="w-3.5 h-3.5 shrink-0" />
                                {formatDateTime(item.dueDate)}
                              </span>
                              <span className="text-[11px] mt-0.5">
                                {expired ? (
                                  <span className="text-rose-600 font-medium">Đã hết hạn</span>
                                ) : (
                                  <span className="text-emerald-700">Đang nhận bài</span>
                                )}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 italic">Không giới hạn</span>
                          )}
                        </TableCell>

                        <TableCell className="text-xs">
                          <span className="font-bold font-serif text-slate-900">
                            {item.maxScore} đ
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {item.allowResubmission ? (
                              item.maxAttempts ? (
                                `Tối đa ${item.maxAttempts} lần`
                              ) : (
                                'Cho phép nộp lại'
                              )
                            ) : (
                              'Nộp 1 lần duy nhất'
                            )}
                          </p>
                        </TableCell>

                        <TableCell className="text-xs">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            {submissionCount} bài nộp
                          </span>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              onClick={() => navigate(`/teacher/assignments/${item.id}`)}
                              className="text-xs h-8 px-2.5 cursor-pointer shadow-2xs"
                            >
                              <span>Chấm bài</span>
                              <ChevronRight className="w-3.5 h-3.5 ml-1" />
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setAssignmentToEdit(item)}
                              className="text-xs h-8 w-8 p-0 text-slate-600 hover:text-slate-900 cursor-pointer"
                              title="Chỉnh sửa bài tập"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setAssignmentToDelete(item)}
                              className="text-xs h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                              title="Xóa bài tập"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
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

      {/* Modal Tạo bài tập */}
      <AssignmentFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        defaultClassId={selectedClassId || undefined}
      />

      {/* Modal Chỉnh sửa bài tập */}
      <AssignmentFormModal
        isOpen={Boolean(assignmentToEdit)}
        onClose={() => setAssignmentToEdit(null)}
        onSubmit={handleUpdateSubmit}
        assignmentToEdit={assignmentToEdit}
      />

      {/* Modal xác nhận xóa */}
      <ConfirmModal
        isOpen={Boolean(assignmentToDelete)}
        onClose={() => setAssignmentToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Xóa bài tập"
        description={`Bạn có chắc chắn muốn xóa bài tập "${assignmentToDelete?.title}"? Toàn bộ bài nộp và đánh giá liên quan sẽ bị xóa vĩnh viễn.`}
        confirmLabel="Xóa bài tập"
        cancelLabel="Hủy"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
