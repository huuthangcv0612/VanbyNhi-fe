import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User as UserIcon, Mail, Phone, Calendar, Key, CheckCircle2, Shield } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/auth.service';
import { ZaloIcon } from '@/features/auth/components/ZaloIcon';
import { usersService } from '../services/users.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getRoleMeta, formatDate } from '@/utils/formatters';
import { getApiErrorMessage } from '@/lib/api-client';
import { useToast } from '@/hooks/useToast';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không đúng định dạng').optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không trùng khớp',
    path: ['confirmPassword'],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { success, error } = useToast();

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUnlinkingZalo, setIsUnlinkingZalo] = useState(false);

  const roleMeta = user ? getRoleMeta(user.role) : null;

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onUpdateProfile = async (values: ProfileFormValues) => {
    setIsUpdatingProfile(true);
    try {
      await usersService.updateMe({
        fullName: values.fullName,
        email: values.email || undefined,
        dateOfBirth: values.dateOfBirth ? new Date(values.dateOfBirth).toISOString() : null,
      });
      await refreshUser();
      success('Cập nhật thông tin cá nhân thành công');
    } catch (err) {
      error(getApiErrorMessage(err));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const onChangePassword = async (values: PasswordFormValues) => {
    setIsChangingPassword(true);
    try {
      const res = await usersService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      passwordForm.reset();
      success(res.message || 'Đổi mật khẩu thành công');
    } catch (err) {
      error(getApiErrorMessage(err));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const onUnlinkZalo = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy liên kết tài khoản Zalo không?')) return;
    setIsUnlinkingZalo(true);
    try {
      const res = await authService.unlinkZaloAccount();
      await refreshUser();
      success(res.message || 'Hủy liên kết Zalo thành công');
    } catch (err) {
      error(getApiErrorMessage(err));
    } finally {
      setIsUnlinkingZalo(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hồ sơ tài khoản"
        description="Quản lý thông tin cá nhân và bảo mật tài khoản trên VanbyNhi"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User summary card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 text-2xl font-bold font-serif border border-amber-200 mb-3 shadow-xs">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <CardTitle className="text-xl">{user?.fullName || 'Người dùng'}</CardTitle>
              <div className="mt-2 flex justify-center">
                {roleMeta && (
                  <Badge className={roleMeta.badgeClass}>
                    <Shield className="w-3 h-3 mr-1" />
                    {roleMeta.label}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-xs sm:text-sm text-slate-600 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-mono">{user?.phone || '-'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{user?.email || 'Chưa cập nhật email'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Tham gia: {formatDate(user?.createdAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit profile & change password forms */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
              <CardDescription>Cập nhật họ tên, email liên hệ và ngày sinh</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Input
                      {...profileForm.register('fullName')}
                      label="Họ và tên"
                      placeholder="Nguyễn Văn A"
                      error={profileForm.formState.errors.fullName?.message}
                      leftIcon={<UserIcon className="w-4 h-4" />}
                    />
                  </div>
                  <div>
                    <Input
                      {...profileForm.register('email')}
                      type="email"
                      label="Email"
                      placeholder="email@example.com"
                      error={profileForm.formState.errors.email?.message}
                      leftIcon={<Mail className="w-4 h-4" />}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="text"
                      label="Số điện thoại"
                      value={user?.phone || ''}
                      disabled
                      helperText="Số điện thoại là định danh chính, không thể tự thay đổi"
                      leftIcon={<Phone className="w-4 h-4" />}
                    />
                  </div>
                  <div>
                    <Input
                      {...profileForm.register('dateOfBirth')}
                      type="date"
                      label="Ngày sinh"
                      error={profileForm.formState.errors.dateOfBirth?.message}
                      leftIcon={<Calendar className="w-4 h-4" />}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isUpdatingProfile}
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Lưu thông tin
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Đổi mật khẩu</CardTitle>
              <CardDescription>
                Bảo vệ tài khoản bằng mật khẩu mạnh. Sau khi đổi, các phiên đăng nhập khác sẽ tự động đăng xuất.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
                <div>
                  <Input
                    {...passwordForm.register('currentPassword')}
                    type="password"
                    label="Mật khẩu hiện tại"
                    placeholder="Nhập mật khẩu hiện tại"
                    error={passwordForm.formState.errors.currentPassword?.message}
                    leftIcon={<Key className="w-4 h-4" />}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Input
                      {...passwordForm.register('newPassword')}
                      type="password"
                      label="Mật khẩu mới"
                      placeholder="Tối thiểu 6 ký tự"
                      error={passwordForm.formState.errors.newPassword?.message}
                      leftIcon={<Key className="w-4 h-4" />}
                    />
                  </div>
                  <div>
                    <Input
                      {...passwordForm.register('confirmPassword')}
                      type="password"
                      label="Xác nhận mật khẩu mới"
                      placeholder="Nhập lại mật khẩu mới"
                      error={passwordForm.formState.errors.confirmPassword?.message}
                      leftIcon={<Key className="w-4 h-4" />}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isChangingPassword}
                  >
                    Đổi mật khẩu
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Liên kết tài khoản mạng xã hội</CardTitle>
              <CardDescription>
                Quản lý liên kết tài khoản Zalo để đăng nhập nhanh chóng và bảo mật
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200/80 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <ZaloIcon className="w-10 h-10 shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">Tài khoản Zalo</h4>
                    <p className="text-xs text-slate-500">
                      {user?.zaloId
                        ? 'Đã liên kết thành công với tài khoản Zalo'
                        : 'Chưa liên kết với tài khoản Zalo nào'}
                    </p>
                  </div>
                </div>

                <div>
                  {user?.zaloId ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300"
                      onClick={onUnlinkZalo}
                      isLoading={isUnlinkingZalo}
                    >
                      Hủy liên kết
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-sky-200 text-sky-700 hover:bg-sky-50 hover:border-sky-300"
                      onClick={() => {
                        window.location.href = authService.getZaloLoginUrl();
                      }}
                    >
                      Liên kết ngay
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
