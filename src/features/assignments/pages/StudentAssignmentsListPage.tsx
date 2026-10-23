import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Calendar,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { studentClassesService } from '@/features/classes/services/classes.service';
import { useAssignmentsList } from '../hooks/useAssignments';
import { formatDateTime } from '@/utils/formatters';
import { isPastDue } from '../utils/assignment.utils';
import { getApiErrorMessage } from '@/lib/api-client';

export function StudentAssignmentsListPage() {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const limit = 10;
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [deadlineFilter, setDeadlineFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED'>('ALL');

  // Lấy các lớp học sinh đang tham gia
  const { data: classesData } = useQuery({
    queryKey: ['student-classes-list-filter'],
    queryFn: () => studentClassesService.getMyClasses({ limit: 100 }),
  });
  const classes = classesData?.items || [];

  // Lấy danh sách bài tập
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

  const pagination = assignmentsData?.pagination;

  // Lọc hạn nộp
  const displayedAssignments = useMemo(() => {
    const rawAssignments = assignmentsData?.items || [];
    let list = [...rawAssignments];
    if (deadlineFilter === 'ACTIVE') {
      list = list.filter((a) => !isPastDue(a.dueDate));
    } else if (deadlineFilter === 'EXPIRED') {
      list = list.filter((a) => isPastDue(a.dueDate));
    }
    return list;
  }, [assignmentsData?.items, deadlineFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bài tập & Nộp bài"
        description="Danh sách các chuyên đề làm văn, bài tập theo buổi học và theo dõi kết quả chấm bài"
      />

      {/* Bộ lọc */}
      <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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
              <option value="">-- Tất cả lớp học của tôi --</option>
              {classes.map((c) => (
                <option key={c.class.id} value={c.class.id}>
                  {c.class.name}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc hạn nộp */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setDeadlineFilter('ALL')}
              className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
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
              className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                deadlineFilter === 'ACTIVE'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Còn hạn nộp
            </button>
            <button
              type="button"
              onClick={() => setDeadlineFilter('EXPIRED')}
              className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                deadlineFilter === 'EXPIRED'
                  ? 'bg-white text-rose-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đã hết hạn
            </button>
          </div>
        </div>
      </div>

      {/* Danh sách bài tập */}
      {isError ? (
        <ErrorState
          title="Không thể tải danh sách bài tập"
          message={getApiErrorMessage(error)}
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5 animate-pulse bg-slate-100/60 border-slate-200">
              <div className="h-4 w-2/3 bg-slate-200 rounded mb-2" />
              <div className="h-3 w-1/3 bg-slate-200 rounded mb-4" />
              <div className="h-10 bg-slate-200 rounded" />
            </Card>
          ))}
        </div>
      ) : displayedAssignments.length === 0 ? (
        <Card className="p-12 text-center border-slate-200">
          <EmptyState
            icon={<FileText className="w-8 h-8 text-slate-400" />}
            title="Chưa có bài tập nào"
            description="Hiện không có bài tập nào cần làm. Hãy kiểm tra lại sau hoặc liên hệ giáo viên phụ trách."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedAssignments.map((item) => {
            const expired = isPastDue(item.dueDate);

            return (
              <Card
                key={item.id}
                className="p-5 border border-slate-200/90 shadow-2xs hover:border-amber-300 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 inline-block mb-1.5">
                        {item.class?.name || 'Lớp học'}
                      </span>
                      <h3
                        onClick={() => navigate(`/student/assignments/${item.id}`)}
                        className="font-bold text-base text-slate-900 hover:text-amber-700 cursor-pointer font-serif line-clamp-2 transition-colors"
                      >
                        {item.title}
                      </h3>
                    </div>

                    <Badge size="sm" className="bg-slate-100 text-slate-700 font-semibold shrink-0">
                      {item.maxScore} đ
                    </Badge>
                  </div>

                  {item.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  <div className="space-y-1 pt-1 text-xs text-slate-500 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Hạn nộp:{' '}
                        {item.dueDate ? (
                          <strong className={expired ? 'text-rose-700' : 'text-slate-800'}>
                            {formatDateTime(item.dueDate)}
                          </strong>
                        ) : (
                          'Không giới hạn thời gian'
                        )}
                      </span>
                    </div>

                    {expired && (
                      <span className="text-rose-600 font-medium text-[11px] block">
                        Đã hết thời hạn làm bài quy định
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between gap-2 border-t border-slate-100 mt-4">
                  <span className="text-xs text-slate-500">
                    {item.allowResubmission
                      ? item.maxAttempts
                        ? `Tối đa ${item.maxAttempts} lần nộp`
                        : 'Cho phép nộp lại'
                      : 'Nộp 1 lần duy nhất'}
                  </span>

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/student/assignments/${item.id}`)}
                    className="text-xs cursor-pointer shadow-2xs"
                  >
                    <span>Xem đề & Làm bài</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

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
  );
}
