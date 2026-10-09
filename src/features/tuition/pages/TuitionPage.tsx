import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { apiClient } from '@/lib/api-client';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { SkeletonTableRows } from '@/components/ui/skeleton';
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
