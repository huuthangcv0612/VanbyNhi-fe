import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Search } from 'lucide-react';
import { classesService } from '../services/classes.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { SkeletonTableRows } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { getClassStatusMeta, formatCurrency, formatDate } from '@/utils/formatters';
import { getApiErrorMessage } from '@/lib/api-client';

export function ClassesListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const limit = 10;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['classes', { page, limit, search }],
    queryFn: () => classesService.findAll({ page, limit, search: search || undefined }),
  });

  const classes = data?.items || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Lớp học Văn"
        description="Danh sách các lớp học văn học Việt Nam được mở tại VanbyNhi"
      />

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:max-w-xs">
          <Input
            placeholder="Tìm theo tên lớp học..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Data display */}
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
                <TableHead>Tên lớp</TableHead>
                <TableHead>Mã lớp</TableHead>
                <TableHead>Học phí / tháng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <SkeletonTableRows rows={5} />
              ) : classes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8">
                    <EmptyState
                      icon={<BookOpen className="w-6 h-6 text-slate-400" />}
                      title="Chưa có lớp học nào"
                      description="Hiện chưa có lớp học nào được tạo trên hệ thống."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                classes.map((cls) => {
                  const statusMeta = getClassStatusMeta(cls.status);
                  return (
                    <TableRow key={cls.id}>
                      <TableCell className="font-semibold text-slate-900">
                        {cls.name}
                        {cls.description && (
                          <p className="text-xs text-slate-500 font-normal truncate max-w-xs">
                            {cls.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          {cls.classCode}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-amber-900">
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
                    </TableRow>
                  );
                })
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
