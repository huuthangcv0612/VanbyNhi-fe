import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { formatDate } from '@/utils/formatters';
import { getApiErrorMessage } from '@/lib/api-client';
import type { PaginatedResponse, NotificationType } from '@/types/common.types';

interface NotificationItem {
  id: string;
  recipientId: string;
  title: string;
  content: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

export function NotificationsPage() {
  const [page] = useState(1);
  const limit = 20;
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['notifications', { page, limit }],
    queryFn: async () => {
      const res = await apiClient.get<PaginatedResponse<NotificationItem>>('/notifications', {
        params: { page, limit },
      });
      return res.data;
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markSingleAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = data?.items || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thông báo hệ thống"
        description="Tin tức, nhắc nhở lịch học, bài tập mới và học phí môn Văn"
        action={
          notifications.some((n) => !n.isRead) ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              isLoading={markAllAsReadMutation.isPending}
              leftIcon={<CheckCheck className="w-4 h-4" />}
            >
              Đánh dấu tất cả đã đọc
            </Button>
          ) : undefined
        }
      />

      {isError ? (
        <ErrorState
          title="Không thể tải thông báo"
          message={getApiErrorMessage(error)}
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-6 h-6 text-slate-400" />}
          title="Không có thông báo mới"
          description="Hiện tại hộp thư thông báo của bạn đang trống."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (!item.isRead) {
                  markSingleAsReadMutation.mutate(item.id);
                }
              }}
              className={`rounded-xl border p-4 transition-all cursor-pointer ${
                item.isRead
                  ? 'border-slate-200 bg-white text-slate-700'
                  : 'border-amber-200 bg-amber-50/40 text-slate-900 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold">{item.title}</h4>
                    {!item.isRead && (
                      <Badge variant="primary" size="sm">
                        Mới
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.content}
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">
                  {formatDate(item.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
