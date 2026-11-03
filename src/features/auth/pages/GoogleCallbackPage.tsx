import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, AlertCircle, RotateCcw, ArrowLeft, ShieldAlert, Sparkles } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { googleService } from '@/features/google/services/google.service';
import { GoogleLinkForm } from '@/features/auth/components/GoogleLinkForm';
import { GoogleIcon } from '@/features/google/components/GoogleIcon';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/api-client';
import type { UserRole } from '@/types/auth.types';
import type { GoogleLinkResponse } from '@/features/google/types/google.types';

type CallbackState =
  | { type: 'exchanging' }
  | { type: 'link_required'; linkTicket: string; email?: string }
  | { type: 'error'; title: string; message: string; canRetryGoogle: boolean }
  | { type: 'invalid' };

function resolveOAuthError(error: string, errorDescription?: string | null): CallbackState {
  const desc = errorDescription || '';

  if (error === 'access_denied' || error === 'oauth_access_denied') {
    return {
      type: 'error',
      title: 'Đăng nhập bị từ chối',
      message: 'Bạn đã từ chối cấp quyền truy cập tài khoản Google.',
      canRetryGoogle: true,
    };
  }

  if (error === 'state_expired' || error === 'oauth_expired_state') {
    return {
      type: 'error',
      title: 'Phiên đăng nhập hết hạn',
      message: 'Phiên đăng nhập Google đã hết hạn. Vui lòng thử lại.',
      canRetryGoogle: true,
    };
  }

  if (error === 'account_inactive') {
    return {
      type: 'error',
      title: 'Tài khoản bị khóa',
      message: 'Tài khoản của bạn đã bị vô hiệu hóa hoặc khóa. Vui lòng liên hệ quản trị viên.',
      canRetryGoogle: false,
    };
  }

  return {
    type: 'error',
    title: 'Xác thực Google thất bại',
    message: desc || 'Đã có lỗi xảy ra trong quá trình xác thực Google. Vui lòng thử lại.',
    canRetryGoogle: true,
  };
}

export function GoogleCallbackPage() {
  const { setAuthSession } = useAuth();
  const navigate = useNavigate();

  // Đọc query parameters 1 lần duy nhất trên mount và xóa ngay khỏi URL
  const [params] = useState(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const ticket = searchParams.get('ticket');
    const linkTicket = searchParams.get('linkTicket');
    const isLinked = searchParams.get('isLinked');
    const email = searchParams.get('email');
    const error = searchParams.get('error') || searchParams.get('error_code');
    const message = searchParams.get('message') || searchParams.get('error_description');

    // Xóa query khỏi URL ngay lập tức để bảo vệ an toàn
    if (ticket || linkTicket || error) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return { ticket, linkTicket, isLinked, email, error, message };
  });

  const [state, setState] = useState<CallbackState>(() => {
    // 1. Trường hợp có error từ OAuth redirect
    if (params.error) {
      return resolveOAuthError(params.error, params.message);
    }

    // 2. Trường hợp chưa liên kết tài khoản
    if (params.linkTicket) {
      return {
        type: 'link_required',
        linkTicket: params.linkTicket,
        email: params.email || undefined,
      };
    }

    // 3. Trường hợp đã liên kết và có exchange ticket
    if (params.ticket) {
      return { type: 'exchanging' };
    }

    // 4. Truy cập không có tham số
    return { type: 'invalid' };
  });

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

      googleService
        .exchangeTicket({ ticket: params.ticket })
        .then((response) => {
          setAuthSession(response.tokens, response.user);
          navigateToDashboard(response.user.role);
        })
        .catch((err: unknown) => {
          const apiMsg = getApiErrorMessage(err);
          let title = 'Xác thực đăng nhập thất bại';
          let msg = apiMsg;

          if (apiMsg.includes('hết hạn') || apiMsg.includes('không hợp lệ')) {
            title = 'Mã xác thực đã hết hạn';
            msg = 'Mã đăng nhập Google đã hết hạn hoặc đã được sử dụng. Vui lòng thực hiện lại.';
          } else if (apiMsg.includes('vô hiệu hóa') || apiMsg.includes('khóa')) {
            title = 'Tài khoản bị khóa';
            msg = 'Tài khoản của bạn đã bị vô hiệu hóa hoặc khóa. Vui lòng liên hệ quản trị viên.';
          }

          setState({
            type: 'error',
            title,
            message: msg,
            canRetryGoogle: true,
          });
        });
    }
  }, [params.ticket, params.error, setAuthSession, navigateToDashboard]);

  const handleLinkSuccess = (response: GoogleLinkResponse) => {
    setAuthSession(response.tokens, response.user);
    navigateToDashboard(response.user.role);
  };

  const handleRetryGoogle = () => {
    window.location.href = googleService.getLoginUrl();
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
          {/* TRƯỜNG HỢP 1: ĐANG HOÀN TẤT ĐĂNG NHẬP */}
          {state.type === 'exchanging' && (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-4" role="status">
              <div className="relative flex items-center justify-center">
                <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 shadow-inner">
                  <Sparkles className="w-7 h-7 animate-pulse text-amber-600" />
                </div>
                <div className="absolute -inset-1 rounded-2xl border-2 border-amber-600 border-t-transparent animate-spin" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-800">
                  Đang hoàn tất đăng nhập Google...
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
                  <GoogleIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>Chưa liên kết tài khoản</span>
                </div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Liên kết tài khoản VanbyNhi
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Tài khoản Google của bạn chưa được liên kết với bất kỳ tài khoản VanbyNhi nào. Vui lòng nhập Mật khẩu để xác nhận quyền sở hữu tài khoản và liên kết an toàn.
                </p>
              </div>

              <GoogleLinkForm
                linkTicket={state.linkTicket}
                defaultEmail={state.email}
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
                {state.canRetryGoogle && (
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    className="w-full"
                    onClick={handleRetryGoogle}
                    leftIcon={<RotateCcw className="w-4 h-4" />}
                  >
                    Thử đăng nhập lại bằng Google
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  className="w-full border-slate-200 hover:bg-slate-50"
                  onClick={() => navigate('/login')}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  Quay lại trang Đăng nhập
                </Button>
              </div>
            </div>
          )}

          {/* TRƯỜNG HỢP 4: TRUY CẬP KHÔNG HỢP LỆ */}
          {state.type === 'invalid' && (
            <div className="text-center py-6 space-y-4">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
              <div>
                <h2 className="text-base font-semibold text-slate-800">
                  Không tìm thấy thông tin xác thực
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Đường dẫn không hợp lệ hoặc đã qua sử dụng. Vui lòng đăng nhập lại.
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => navigate('/login')}
              >
                Về trang Đăng nhập
              </Button>
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          <Link to="/login" className="hover:text-slate-600 hover:underline">
            &larr; Quay lại trang Đăng nhập chính
          </Link>
        </div>
      </div>
    </div>
  );
}
