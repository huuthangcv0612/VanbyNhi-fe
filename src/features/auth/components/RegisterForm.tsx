import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import {
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authService } from '@/features/auth/services/auth.service';
import { getApiErrorMessage } from '@/lib/api-client';
import type { RegisterPayload, User } from '@/types/auth.types';

const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập họ và tên'),
    email: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập email')
      .email('Email không đúng định dạng'),
    phone: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập số điện thoại')
      .regex(/^[0-9+]{9,15}$/, 'Số điện thoại không hợp lệ (từ 9 đến 15 ký tự số hoặc dấu +)'),
    dateOfBirth: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine(
        (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
        'Ngày sinh không đúng định dạng (YYYY-MM-DD)',
      ),
    password: z
      .string()
      .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirmPassword: z
      .string()
      .min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không trùng khớp',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export interface RegisterFormProps {
  onSuccess?: (user: User) => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [registeredUser, setRegisteredUser] = useState<User | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);

    // Chuẩn bị payload theo đúng contract:
    // Tuyệt đối không gửi confirmPassword, role, isActive, passwordHash
    const payload: RegisterPayload = {
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      password: values.password, // không tự ý biến đổi mật khẩu
    };

    if (values.dateOfBirth && values.dateOfBirth.trim() !== '') {
      payload.dateOfBirth = values.dateOfBirth.trim();
    }

    try {
      const response = await authService.register(payload);
      setRegisteredUser(response.user);
      onSuccess?.(response.user);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 409) {
          const resData = err.response.data as { message?: string | string[] } | undefined;
          const msg = Array.isArray(resData?.message)
            ? resData.message.join('. ')
            : resData?.message;
          setServerError(
            msg || 'Email hoặc số điện thoại đã được đăng ký trong hệ thống. Vui lòng kiểm tra lại.',
          );
          return;
        }

        if (err.response?.status === 400) {
          const resData = err.response.data as { message?: string | string[] } | undefined;
          const msg = Array.isArray(resData?.message)
            ? resData.message.join('. ')
            : resData?.message;
          setServerError(msg || 'Dữ liệu đầu vào không hợp lệ. Vui lòng kiểm tra lại các trường.');
          return;
        }
      }

      const msg = getApiErrorMessage(err);
      setServerError(msg);
    }
  };

  if (registeredUser) {
    return (
      <div className="space-y-6 text-center py-4" data-testid="register-success-view">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-900">Đăng ký thành công!</h3>
          <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
            Chào mừng <span className="font-semibold text-slate-800">{registeredUser.fullName}</span> gia nhập VanbyNhi. Tài khoản của bạn đã được khởi tạo thành công với vai trò Học viên.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-4 text-left text-xs text-slate-600 space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Email:</span>
            <span className="font-medium text-slate-800">{registeredUser.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Số điện thoại:</span>
            <span className="font-medium text-slate-800">{registeredUser.phone}</span>
          </div>
          {registeredUser.dateOfBirth && (
            <div className="flex justify-between">
              <span className="text-slate-500">Ngày sinh:</span>
              <span className="font-medium text-slate-800">{registeredUser.dateOfBirth}</span>
            </div>
          )}
        </div>

        <div className="pt-2">
          <Link to="/login" className="block w-full">
            <Button variant="primary" size="md" className="w-full gap-2">
              <span>Đăng nhập ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && (
        <div
          className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50/80 p-3.5 text-sm text-rose-800"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <span className="leading-snug">{serverError}</span>
        </div>
      )}

      <div>
        <Input
          {...register('fullName')}
          id="register-fullName"
          type="text"
          label="Họ và tên *"
          placeholder="vd: Nguyễn Văn A"
          autoComplete="name"
          error={errors.fullName?.message}
          leftIcon={<UserIcon className="w-4 h-4" />}
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Input
            {...register('email')}
            id="register-email"
            type="email"
            label="Email *"
            placeholder="vd: hocvien@example.com"
            autoComplete="email"
            error={errors.email?.message}
            leftIcon={<Mail className="w-4 h-4" />}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Input
            {...register('phone')}
            id="register-phone"
            type="tel"
            label="Số điện thoại *"
            placeholder="vd: 0901234567"
            autoComplete="tel"
            error={errors.phone?.message}
            leftIcon={<Phone className="w-4 h-4" />}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div>
        <Input
          {...register('dateOfBirth')}
          id="register-dateOfBirth"
          type="date"
          label="Ngày sinh (Tùy chọn)"
          helperText="Định dạng YYYY-MM-DD"
          error={errors.dateOfBirth?.message}
          leftIcon={<Calendar className="w-4 h-4" />}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <Input
          {...register('password')}
          id="register-password"
          type={showPassword ? 'text' : 'password'}
          label="Mật khẩu *"
          placeholder="Tối thiểu 6 ký tự"
          autoComplete="new-password"
          error={errors.password?.message}
          leftIcon={<Lock className="w-4 h-4" />}
          disabled={isSubmitting}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-slate-400 hover:text-slate-600 focus:outline-none p-1 cursor-pointer"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />
      </div>

      <div>
        <Input
          {...register('confirmPassword')}
          id="register-confirmPassword"
          type={showConfirmPassword ? 'text' : 'password'}
          label="Xác nhận mật khẩu *"
          placeholder="Nhập lại mật khẩu"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          leftIcon={<Lock className="w-4 h-4" />}
          disabled={isSubmitting}
          rightElement={
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="text-slate-400 hover:text-slate-600 focus:outline-none p-1 cursor-pointer"
              aria-label={showConfirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'}
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full"
          isLoading={isSubmitting}
        >
          Đăng ký tài khoản
        </Button>
      </div>

      <div className="pt-2 text-center text-xs text-slate-500">
        Bằng việc đăng ký, bạn đồng ý với Điều khoản sử dụng và Chính sách bảo mật của VanbyNhi.
      </div>
    </form>
  );
}
