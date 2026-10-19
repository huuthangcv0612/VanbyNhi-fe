import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, AlertTriangle, Unlink, RefreshCw, AlertCircle } from 'lucide-react';
import { googleService } from '../services/google.service';
import { GoogleIcon } from './GoogleIcon';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmModal } from '@/features/classes/components/ConfirmModal';
import { getApiErrorMessage } from '@/lib/api-client';
import { useToast } from '@/hooks/useToast';
import { formatDateTime } from '@/utils/formatters';

export function GoogleAccountCard() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);

  // Lấy trạng thái kết nối từ backend
  const {
    data: connection,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['google-connection'],
    queryFn: () => googleService.getConnectionStatus(),
  });

  // Mutation ngắt liên kết
  const disconnectMutation = useMutation({
    mutationFn: () => googleService.disconnect(),
    onSuccess: (res) => {
      showToast({
        type: 'success',
        title: 'Ngắt liên kết thành công',
        message: res.message || 'Đã ngắt liên kết tài khoản Google Workspace',
      });
      setIsDisconnectModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['google-connection'] });
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Không thể ngắt liên kết',
        message: getApiErrorMessage(err),
      });
    },
  });

  // Xử lý bắt đầu luồng liên kết Google
  const handleConnect = async () => {
    if (isConnecting) return;
    setIsConnecting(true);

    try {
      const res = await googleService.getConnectUrl();
      if (res?.authorizationUrl) {
        // Điều hướng trình duyệt trực tiếp tới URL do Backend cấp
        window.location.href = res.authorizationUrl;
      } else {
        throw new Error('Máy chủ không cung cấp đường dẫn xác thực Google.');
      }
    } catch (err) {
      setIsConnecting(false);
      showToast({
        type: 'error',
        title: 'Không thể khởi tạo liên kết Google',
        message: getApiErrorMessage(err),
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Tài khoản Google Workspace</CardTitle>
              <CardDescription>
                Liên kết tài khoản Google để tự động tạo và quản lý phòng học Google Meet
              </CardDescription>
            </div>
            {connection?.status === 'CONNECTED' && (
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 shrink-0">
                <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                Đã liên kết
              </Badge>
            )}
            {connection?.status === 'NEEDS_REAUTH' && (
              <Badge className="bg-amber-100 text-amber-800 border-amber-200 shrink-0">
                <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
                Cần ủy quyền lại
              </Badge>
            )}
            {connection?.status === 'DISCONNECTED' && (
              <Badge className="bg-slate-100 text-slate-700 border-slate-200 shrink-0">
                Chưa liên kết
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3 py-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 space-y-3">
              <div className="flex items-start gap-3 text-rose-800 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Lỗi tải trạng thái tài khoản Google</p>
                  <p className="text-xs text-rose-700 mt-0.5">{getApiErrorMessage(error)}</p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => refetch()}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Thử lại
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200/80 bg-slate-50/50">
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-slate-200 shrink-0 shadow-2xs">
                  <GoogleIcon className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-slate-900">
                    {connection?.status === 'CONNECTED'
                      ? 'Google Workspace'
                      : 'Tài khoản Google Workspace'}
                  </h4>

                  {connection?.status === 'CONNECTED' && connection.email ? (
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-slate-700 truncate">
                        {connection.email}
                      </p>
                      {connection.lastConnectedAt && (
                        <p className="text-[11px] text-slate-400">
                          Đã liên kết lúc: {formatDateTime(connection.lastConnectedAt)}
                        </p>
                      )}
                    </div>
                  ) : connection?.status === 'NEEDS_REAUTH' ? (
                    <div className="space-y-1">
                      <p className="text-xs text-amber-700 font-medium">
                        {connection.email || 'Tài khoản đã liên kết'}
                      </p>
                      <p className="text-[11px] text-amber-600">
                        Phiên xác thực đã hết hạn hoặc bị thu hồi quyền trên Google. Vui lòng liên kết lại.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Chưa liên kết. Liên kết Google Workspace để tự động tạo link Google Meet cho các lớp học.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {connection?.status === 'CONNECTED' ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300"
                    onClick={() => setIsDisconnectModalOpen(true)}
                    disabled={isConnecting}
                    leftIcon={<Unlink className="w-3.5 h-3.5" />}
                  >
                    Ngắt liên kết
                  </Button>
                ) : connection?.status === 'NEEDS_REAUTH' ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                    onClick={handleConnect}
                    isLoading={isConnecting}
                    leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  >
                    Liên kết lại
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-slate-300 hover:border-slate-400 bg-white shadow-2xs font-medium text-slate-800"
                    onClick={handleConnect}
                    isLoading={isConnecting}
                  >
                    Liên kết Google Workspace
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal xác nhận ngắt liên kết */}
      <ConfirmModal
        isOpen={isDisconnectModalOpen}
        onClose={() => setIsDisconnectModalOpen(false)}
        onConfirm={() => disconnectMutation.mutate()}
        title="Ngắt liên kết tài khoản Google?"
        description={
          <div className="space-y-2 text-sm text-slate-600">
            <p>
              Bạn có chắc chắn muốn ngắt liên kết tài khoản Google Workspace{' '}
              {connection?.email && <strong className="text-slate-900">{connection.email}</strong>}?
            </p>
            <p className="text-xs text-slate-500">
              Sau khi ngắt liên kết, hệ thống sẽ không thể tự động tạo hoặc đồng bộ phòng Google Meet cho các lớp học mới tạo cho đến khi bạn liên kết lại.
            </p>
          </div>
        }
        confirmLabel="Ngắt liên kết"
        variant="danger"
        isLoading={disconnectMutation.isPending}
      />
    </>
  );
}
