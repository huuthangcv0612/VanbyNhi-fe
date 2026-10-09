import { useQuery } from '@tanstack/react-query';
import { BookOpen, Users, CreditCard, FileText, ArrowRight, Activity, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import type { PaginatedResponse } from '@/types/common.types';

export function AdminDashboardPage() {
  const { user } = useAuth();

  // Gọi API thật để lấy tổng số lớp học
  const { data: classesData, isLoading: isLoadingClasses } = useQuery<PaginatedResponse<unknown>>({
    queryKey: ['admin', 'classes-count'],
    queryFn: async () => {
      const res = await apiClient.get<PaginatedResponse<unknown>>('/classes', {
        params: { limit: 1 },
      });
      return res.data;
    },
    staleTime: 60000,
  });

  // Gọi API thật để lấy tổng số người dùng
  const { data: usersData, isLoading: isLoadingUsers } = useQuery<PaginatedResponse<unknown>>({
    queryKey: ['admin', 'users-count'],
    queryFn: async () => {
      const res = await apiClient.get<PaginatedResponse<unknown>>('/users', {
        params: { limit: 1 },
      });
      return res.data;
    },
    staleTime: 60000,
  });

  // Gọi API thật để lấy tổng số bài tập
  const { data: assignmentsData, isLoading: isLoadingAssignments } = useQuery<PaginatedResponse<unknown>>({
    queryKey: ['admin', 'assignments-count'],
    queryFn: async () => {
      const res = await apiClient.get<PaginatedResponse<unknown>>('/assignments', {
        params: { limit: 1 },
      });
      return res.data;
    },
    staleTime: 60000,
  });

  const totalClasses = classesData?.pagination?.total;
  const totalUsers = usersData?.pagination?.total;
  const totalAssignments = assignmentsData?.pagination?.total;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Xin chào, ${user?.fullName || 'Quản trị viên'}`}
        description="Bảng điều khiển trung tâm quản lý lớp học Văn học VanbyNhi"
      />

      {/* Real stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Tổng số lớp học</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
              <BookOpen className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingClasses ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-slate-900">
                {typeof totalClasses === 'number' ? totalClasses : 0}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-1">Dữ liệu từ hệ thống quản lý lớp</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Tổng số người dùng</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-800">
              <Users className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-slate-900">
                {typeof totalUsers === 'number' ? totalUsers : 0}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-1">Gồm Quản trị viên, Giáo viên, Học sinh</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Bài tập đã tạo</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <FileText className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingAssignments ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-slate-900">
                {typeof totalAssignments === 'number' ? totalAssignments : 0}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-1">Tổng số đề bài tập trên hệ thống</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Lối tắt thao tác nhanh</CardTitle>
            <CardDescription>Truy cập các tính năng cốt lõi của trung tâm</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              to="/admin/classes"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 transition-colors text-slate-800 text-sm font-medium"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-amber-700" />
                <span>Quản lý danh sách lớp học</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              to="/admin/users"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 transition-colors text-slate-800 text-sm font-medium"
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-blue-700" />
                <span>Quản lý giáo viên và học sinh</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              to="/admin/tuition"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 transition-colors text-slate-800 text-sm font-medium"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                <span>Quản lý học phí và thu chi</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              to="/admin/sessions"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 transition-colors text-slate-800 text-sm font-medium"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-purple-700" />
                <span>Lịch học và nhật ký bài học</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          </CardContent>
        </Card>

        {/* Aggregate analytics note: showing truthful empty state since backend has no specialized reporting API */}
        <Card>
          <CardHeader>
            <CardTitle>Biểu đồ phân tích chuyên sâu</CardTitle>
            <CardDescription>Báo cáo doanh thu và chuyên cần theo tháng</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<Activity className="w-6 h-6 text-slate-400" />}
              title="Chưa có báo cáo tổng hợp"
              description="Backend chưa cung cấp endpoint tổng hợp số liệu biểu đồ. Dữ liệu sẽ được hiển thị ngay khi backend bổ sung API thống kê."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
