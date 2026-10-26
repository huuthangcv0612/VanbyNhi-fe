import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Search, Phone, Mail, Calendar, X } from 'lucide-react';
import { usersService } from '../services/users.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton, SkeletonTableRows } from '@/components/ui/skeleton';
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
    queryFn: () => usersService.findAll({ page, limit, search: search.trim() || undefined }),
  });

  const users = data?.items || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Người dùng"
        description="Danh sách tài khoản Quản trị viên, Giáo viên và Học sinh trên VanbyNhi"
      />

      {/* Toolbar: Search input with clear button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full sm:max-w-md">
          <Input
            placeholder="Tìm theo họ tên, số điện thoại, email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            aria-label="Tìm kiếm người dùng"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
              aria-label="Xóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
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
          {/* Mobile View: Clean Apple Cards (< sm) */}
          <div className="sm:hidden space-y-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-32 rounded-lg" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-40 rounded" />
                  <Skeleton className="h-4 w-48 rounded" />
                </Card>
              ))
            ) : users.length === 0 ? (
              <EmptyState
                icon={<Users className="w-8 h-8 text-slate-400" />}
                title="Không tìm thấy người dùng"
                description="Chưa có người dùng nào phù hợp với điều kiện tìm kiếm."
              />
            ) : (
              users.map((u) => {
                const roleMeta = getRoleMeta(u.role);
                return (
                  <Card key={u.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800 font-bold text-sm shrink-0 border border-amber-200/80">
                          {u.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 font-serif truncate text-sm">
                            {u.fullName}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge className={roleMeta.badgeClass} size="sm">
                              {roleMeta.label}
                            </Badge>
                            <Badge variant={u.isActive ? 'success' : 'danger'} size="sm">
                              {u.isActive ? 'Hoạt động' : 'Đã khóa'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono text-slate-800">{u.phone}</span>
                      </div>
                      {u.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate text-slate-600">{u.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Ngày tạo: {formatDate(u.createdAt)}</span>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>

          {/* Desktop/Tablet View: Table (sm+) */}
          <div className="hidden sm:block">
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
