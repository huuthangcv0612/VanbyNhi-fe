import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, Calendar, BookOpen, User } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { apiClient } from '@/lib/api-client';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton, SkeletonTableRows } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { getTuitionStatusMeta, formatCurrency } from '@/utils/formatters';
import { getApiErrorMessage } from '@/lib/api-client';
import type { PaginatedResponse, TuitionStatus } from '@/types/common.types';

interface TuitionFeeItem {
  id: string;
  enrollmentId: string;
  billingYear: number;
  billingMonth: number;
  amountDue: string | number;
  status: TuitionStatus;
  note?: string;
  enrollment?: {
    student?: { fullName: string; phone: string };
    class?: { name: string };
  };
}

export function TuitionPage() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['tuition-fees', { page, limit }],
    queryFn: async () => {
      const res = await apiClient.get<PaginatedResponse<TuitionFeeItem>>('/tuition/fees', {
        params: { page, limit },
      });
      return res.data;
    },
  });

  const fees = data?.items || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Học phí"
        description="Theo dõi học phí tháng, trạng thái đóng học và các khoản thu chi"
      />

      {isError ? (
        <ErrorState
          title="Không thể tải danh sách học phí"
          message={getApiErrorMessage(error)}
          onRetry={() => refetch()}
        />
      ) : (
        <div className="space-y-4">
          {/* Mobile view (< sm) */}
          <div className="sm:hidden space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-32 rounded" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-40 rounded" />
                  <Skeleton className="h-5 w-28 rounded" />
                </Card>
              ))
            ) : fees.length === 0 ? (
              <EmptyState
                icon={<CreditCard className="w-8 h-8 text-slate-400" />}
                title="Chưa có bản ghi học phí"
                description="Hiện chưa có dữ liệu học phí được tạo trên hệ thống."
              />
            ) : (
              fees.map((fee) => {
                const statusMeta = getTuitionStatusMeta(fee.status);
                return (
                  <Card key={fee.id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-bold text-slate-900 font-serif text-sm truncate">
                          {fee.enrollment?.student?.fullName || 'Học sinh'}
                        </span>
                      </div>
                      <Badge className={statusMeta.badgeClass} size="sm">
                        {statusMeta.label}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{fee.enrollment?.class?.name || '-'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Tháng {fee.billingMonth}/{fee.billingYear}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500">Cần đóng:</span>
                      <span className="font-bold text-sm text-amber-900">
                        {formatCurrency(fee.amountDue)}
                      </span>
                    </div>
                  </Card>
                );
              })
            )}
          </div>

          {/* Desktop/Tablet Table (sm+) */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Học sinh</TableHead>
                  <TableHead>Lớp học</TableHead>
                  <TableHead>Kỳ học phí</TableHead>
                  <TableHead>Số tiền cần đóng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <SkeletonTableRows rows={5} />
                ) : fees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8">
                      <EmptyState
                        icon={<CreditCard className="w-6 h-6 text-slate-400" />}
                        title="Chưa có bản ghi học phí"
                        description="Hiện chưa có dữ liệu học phí được tạo trên hệ thống."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  fees.map((fee) => {
                    const statusMeta = getTuitionStatusMeta(fee.status);
                    return (
                      <TableRow key={fee.id}>
                        <TableCell className="font-semibold text-slate-900">
                          {fee.enrollment?.student?.fullName || 'Học sinh'}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {fee.enrollment?.class?.name || '-'}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-slate-700">
                          Tháng {fee.billingMonth}/{fee.billingYear}
                        </TableCell>
                        <TableCell className="font-semibold text-amber-900">
                          {formatCurrency(fee.amountDue)}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusMeta.badgeClass}>
                            {statusMeta.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

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
