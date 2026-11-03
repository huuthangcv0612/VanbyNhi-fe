import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { GoogleAccountCard } from '../components/GoogleAccountCard';
import { useToast } from '@/hooks/useToast';

export function TeacherGoogleSettingsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const hasHandledCallback = useRef(false);

  const status = searchParams.get('status');
  const email = searchParams.get('email');
  const errorParam = searchParams.get('error') || searchParams.get('message');

  useEffect(() => {
    if (hasHandledCallback.current) return;

    if (status === 'success') {
      hasHandledCallback.current = true;
      showToast({
        type: 'success',
        title: 'Liên kết Google Workspace thành công',
        message: email
          ? `Tài khoản ${email} đã được liên kết với VanbyNhi`
          : 'Tài khoản Google đã được liên kết thành công',
      });
      queryClient.invalidateQueries({ queryKey: ['google-connection'] });
      // Xóa query param trên thanh địa chỉ để tránh toast lặp lại khi refresh
      navigate('/teacher/settings/google', { replace: true });
    } else if (errorParam || status === 'error') {
      hasHandledCallback.current = true;
      showToast({
        type: 'error',
        title: 'Liên kết Google thất bại',
        message: errorParam || 'Không thể hoàn tất xác thực tài khoản Google',
      });
      navigate('/teacher/settings/google', { replace: true });
    }
  }, [status, email, errorParam, showToast, queryClient, navigate]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          to="/teacher/classes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại Quản lý lớp học</span>
        </Link>
        <PageHeader
          title="Tài khoản Google Workspace"
          description="Quản lý liên kết tài khoản Google để tự động tạo phòng học Google Meet và đồng bộ dữ liệu"
        />
      </div>

      <div className="max-w-3xl space-y-6">
        <GoogleAccountCard />

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Về tích hợp Google Meet & Quyền lợi cuộc họp</h3>
          <ul className="space-y-2 text-xs text-slate-600 list-disc list-inside">
            <li>
              Hệ thống tự động sử dụng tài khoản Google đã liên kết của từng giáo viên để khởi tạo phòng học trực tuyến (Google Meet Space) mỗi khi tạo lớp học mới.
            </li>
            <li>
              Giáo viên là chủ phòng (host) và có đầy đủ quyền quản lý người tham gia, phê duyệt học sinh ngoài tổ chức và chia sẻ màn hình.
            </li>
            <li>
              <strong className="text-slate-800">Quyền lợi và thời lượng cuộc họp:</strong> Thời lượng cuộc họp tuân thủ hoàn toàn theo gói tài khoản Google của chính quý thầy/cô (tài khoản cá nhân miễn phí giới hạn 60 phút khi có từ 3 người tham gia; tài khoản Google Workspace for Education, Business hoặc Google One Premium hỗ trợ cuộc họp liên tục lên tới 24 giờ). VanbyNhi không can thiệp hay xóa bỏ giới hạn thời gian mặc định của Google.
            </li>
            <li>
              Học sinh trong lớp chỉ có thể lấy liên kết Google Meet khi đã là thành viên chính thức và đúng khung giờ học quy định (mở trước 15 phút).
            </li>
            <li>
              VanbyNhi không lưu trữ mật khẩu hay thông tin đăng nhập của bạn, chỉ sử dụng mã xác thực bảo mật ủy quyền từ Google.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
