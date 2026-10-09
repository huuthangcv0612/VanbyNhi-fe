import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Calendar } from 'lucide-react';
import { assignmentsService } from '../services/assignments.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { SkeletonTableRows } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { formatDate } from '@/utils/formatters';
import { getApiErrorMessage } from '@/lib/api-client';

export function AssignmentsPage() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['assignments', { page, limit }],
    queryFn: () => assignmentsService.findAll({ page, limit }),
  });

  const assignments = data?.items || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Bài tập Văn"
        description="Danh sách đề bài tập, chuyên đề làm văn và hạn nộp bài"
      />

      {isError ? (
        <ErrorState
          title="Không thể tải danh sách bài tập"
          message={getApiErrorMessage(error)}
          onRetry={() => refetch()}
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tiêu đề bài tập</TableHead>
                <TableHead>Lớp học</TableHead>
                <TableHead>Hạn nộp</TableHead>
                <TableHead>Ngày tạo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <SkeletonTableRows rows={5} />
              ) : assignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8">
                    <EmptyState
                      icon={<FileText className="w-6 h-6 text-slate-400" />}
                      title="Chưa có bài tập nào"
                      description="Hiện chưa có bài tập nào được tạo trên hệ thống."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                assignments.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-semibold text-slate-900">
                      {item.title}
                      {item.description && (
                        <p className="text-xs text-slate-500 font-normal truncate max-w-sm">
                          {item.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-700">
                      {item.class?.name || 'Mặc định'}
                    </TableCell>
                    <TableCell className="text-xs text-amber-800 flex items-center gap-1.5 pt-3.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{item.dueDate ? formatDate(item.dueDate) : 'Không giới hạn'}</span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {formatDate(item.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {pagination && (
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
    </div>
  );
}
