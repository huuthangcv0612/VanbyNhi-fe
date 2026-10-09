import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Search } from 'lucide-react';
import { usersService } from '../services/users.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { SkeletonTableRows } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { getRoleMeta, formatDate } from '@/utils/formatters';
import { getApiErrorMessage } from '@/lib/api-client';

export function UsersListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const limit = 10;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['users', { page, limit, search }],
    queryFn: () => usersService.findAll({ page, limit, search: search || undefined }),
  });

  const users = data?.items || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Người dùng"
        description="Danh sách tài khoản Quản trị viên, Giáo viên và Học sinh trên VanbyNhi"
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:max-w-xs">
          <Input
            placeholder="Tìm theo họ tên, số điện thoại, email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {isError ? (
        <ErrorState
          title="Không thể tải danh sách người dùng"
          message={getApiErrorMessage(error)}
          onRetry={() => refetch()}
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Họ và tên</TableHead>
                <TableHead>Số điện thoại</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <SkeletonTableRows rows={5} />
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8">
                    <EmptyState
                      icon={<Users className="w-6 h-6 text-slate-400" />}
                      title="Không tìm thấy người dùng"
                      description="Chưa có người dùng nào phù hợp với điều kiện tìm kiếm."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => {
                  const roleMeta = getRoleMeta(u.role);
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-semibold text-slate-900">
                        {u.fullName}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-700">
                        {u.phone}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {u.email || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={roleMeta.badgeClass}>
                          {roleMeta.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={u.isActive ? 'success' : 'danger'}
                        >
                          {u.isActive ? 'Hoạt động' : 'Đã khóa'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {formatDate(u.createdAt)}
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
