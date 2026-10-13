import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, AlertCircle, RotateCcw, ArrowLeft, ShieldAlert, Sparkles } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/auth.service';
import { ZaloLinkForm } from '@/features/auth/components/ZaloLinkForm';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/api-client';
import type { UserRole, LinkZaloResponse } from '@/types/auth.types';

type CallbackState =
  | { type: 'exchanging' }
  | { type: 'link_required'; linkTicket: string }
  | { type: 'error'; title: string; message: string; canRetryZalo: boolean }
  | { type: 'invalid' };

export function ZaloCallbackPage() {
  const { setAuthSession } = useAuth();
  const navigate = useNavigate();

  // Đọc query parameters 1 lần duy nhất trên mount và xóa ngay khỏi URL
  // Tuyệt đối không log ticket/linkTicket ra console
  const [params] = useState(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const ticket = searchParams.get('ticket');
    const linkTicket = searchParams.get('linkTicket');
    const isLinked = searchParams.get('isLinked');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Xóa ticket khỏi URL ngay sau khi đọc để tránh lộ trong browser history hoặc referrer
    if (ticket || linkTicket || error) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return { ticket, linkTicket, isLinked, error, errorDescription };
  });

  const [state, setState] = useState<CallbackState>(() => {
    // 1. Trường hợp có error từ OAuth redirect của Backend
    if (params.error) {
      return resolveOAuthError(params.error, params.errorDescription);
    }

    // 2. Trường hợp chưa liên kết tài khoản
    if (params.linkTicket) {
      return { type: 'link_required', linkTicket: params.linkTicket };
    }

    // 3. Trường hợp đã liên kết và có exchange ticket
    if (params.ticket) {
      return { type: 'exchanging' };
    }

    // 4. Truy cập callback không có tham số
    return { type: 'invalid' };
  });

  // Chống chạy 2 lần trong React StrictMode
  const exchangeExecutedRef = useRef(false);

  const navigateToDashboard = useCallback(
    (role: UserRole) => {
      switch (role) {
        case 'ADMIN':
          navigate('/admin/dashboard', { replace: true });
          break;
        case 'TEACHER':
          navigate('/teacher/dashboard', { replace: true });
          break;
        case 'STUDENT':
          navigate('/student/dashboard', { replace: true });
          break;
        default:
          navigate('/', { replace: true });
      }
    },
    [navigate],
  );

  useEffect(() => {
    if (params.ticket && !params.error) {
      if (exchangeExecutedRef.current) return;
      exchangeExecutedRef.current = true;

      authService
        .exchangeZaloTicket({ ticket: params.ticket })
        .then((response) => {
          setAuthSession(response.tokens, response.user);
          navigateToDashboard(response.user.role);
        })
        .catch((err: unknown) => {
          const apiMsg = getApiErrorMessage(err);
          let title = 'Xác thực đăng nhập thất bại';
          let message = apiMsg;

          if (apiMsg.includes('hết hạn') || apiMsg.includes('không hợp lệ')) {
            title = 'Mã xác thực đã hết hạn';
            message = 'Mã đăng nhập Zalo đã hết hạn hoặc đã được sử dụng. Vui lòng thực hiện lại.';
          } else if (apiMsg.includes('vô hiệu hóa') || apiMsg.includes('khóa')) {
            title = 'Tài khoản bị khóa';
            message = 'Tài khoản của bạn đã bị vô hiệu hóa hoặc khóa. Vui lòng liên hệ quản trị viên.';
          }

          setState({
            type: 'error',
            title,
            message,
            canRetryZalo: true,
          });
        });
    }
  }, [params.ticket, params.error, setAuthSession, navigateToDashboard]);

  const handleLinkSuccess = (response: LinkZaloResponse) => {
    setAuthSession(response.tokens, response.user);
    navigateToDashboard(response.user.role);
  };

  const handleRetryZalo = () => {
    window.location.href = authService.getZaloLoginUrl();
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-linear-to-b from-amber-50/50 via-slate-50 to-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-700 text-white shadow-md shadow-amber-900/10 mb-4">
          <BookOpen className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-serif">
          VanbyNhi
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Nền tảng Quản lý & Học tập Văn học Việt Nam
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-slate-200/80 rounded-2xl">
          {/* TRƯỜNG HỢP 1: ĐANG XÁC THỰC ĐỔI TICKET */}
          {state.type === 'exchanging' && (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-4" role="status">
              <div className="relative flex items-center justify-center">
                <div className="h-14 w-14 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600 shadow-inner">
                  <Sparkles className="w-7 h-7 animate-pulse text-sky-600" />
                </div>
                <div className="absolute -inset-1 rounded-2xl border-2 border-sky-600 border-t-transparent animate-spin" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-800">
                  Đang hoàn tất đăng nhập Zalo...
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Hệ thống đang xác thực danh tính và khởi tạo phiên đăng nhập an toàn. Vui lòng đợi trong giây lát.
                </p>
              </div>
            </div>
          )}

          {/* TRƯỜNG HỢP 2: YÊU CẦU LIÊN KẾT TÀI KHOẢN */}
          {state.type === 'link_required' && (
            <div>
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-medium border border-amber-200 mb-3">
                  <span>Chưa liên kết tài khoản</span>
                </div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Liên kết tài khoản VanbyNhi
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Tài khoản Zalo của bạn chưa được liên kết. Vui lòng xác minh bằng Email hoặc Số điện thoại cùng Mật khẩu tài khoản VanbyNhi hiện có để hoàn tất liên kết.
                </p>
              </div>

              <ZaloLinkForm
                linkTicket={state.linkTicket}
                onSuccess={handleLinkSuccess}
                onCancel={() => navigate('/login')}
              />
            </div>
          )}

          {/* TRƯỜNG HỢP 3: LỖI XÁC THỰC HOẶC TÀI KHOẢN KHÓA */}
          {state.type === 'error' && (
            <div className="text-center py-4 space-y-4" role="alert">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
                {state.title.includes('khóa') ? (
                  <ShieldAlert className="w-7 h-7" />
                ) : (
                  <AlertCircle className="w-7 h-7" />
                )}
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900">{state.title}</h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed max-w-xs mx-auto">
                  {state.message}
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                {state.canRetryZalo && (
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    className="w-full bg-sky-600 hover:bg-sky-700"
                    onClick={handleRetryZalo}
                    leftIcon={<RotateCcw className="w-4 h-4" />}
                  >
                    Thử lại bằng Zalo
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  className="w-full"
                  onClick={() => navigate('/login')}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  Quay lại đăng nhập
                </Button>
              </div>
            </div>
          )}

          {/* TRƯỜNG HỢP 4: TRUY CẬP KHÔNG HỢP LỆ */}
          {state.type === 'invalid' && (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 border border-amber-200">
                <AlertCircle className="w-7 h-7" />
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900">Yêu cầu không hợp lệ</h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed max-w-xs mx-auto">
                  Không tìm thấy thông tin xác thực phiên đăng nhập từ Zalo.
                </p>
              </div>

              <div className="pt-2">
                <Link to="/login">
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    className="w-full"
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                  >
                    Về trang đăng nhập
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function resolveOAuthError(error: string, errorDescription?: string | null): CallbackState {
  switch (error) {
    case 'zalo_access_denied':
      return {
        type: 'error',
        title: 'Từ chối cấp quyền',
        message: 'Bạn đã hủy hoặc từ chối cấp quyền truy cập tài khoản Zalo cho ứng dụng.',
        canRetryZalo: true,
      };
    case 'account_inactive':
      return {
        type: 'error',
        title: 'Tài khoản đã bị khóa',
        message: 'Tài khoản của bạn đã bị vô hiệu hóa hoặc khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.',
        canRetryZalo: false,
      };
    case 'state_expired':
      return {
        type: 'error',
        title: 'Phiên đăng nhập hết hạn',
        message: 'Phiên đăng nhập Zalo đã quá thời gian chờ. Vui lòng thử lại.',
        canRetryZalo: true,
      };
    case 'invalid_state':
      return {
        type: 'error',
        title: 'Lỗi xác thực',
        message: 'Mã xác thực trạng thái không hợp lệ. Vui lòng thử lại từ đầu.',
        canRetryZalo: true,
      };
    case 'missing_code':
      return {
        type: 'error',
        title: 'Thiếu mã xác thực',
        message: 'Không nhận được mã xác thực từ Zalo. Vui lòng thử lại.',
        canRetryZalo: true,
      };
    default:
      return {
        type: 'error',
        title: 'Đăng nhập Zalo thất bại',
        message: errorDescription || 'Đã có lỗi xảy ra trong quá trình xác thực với Zalo.',
        canRetryZalo: true,
      };
  }
}
