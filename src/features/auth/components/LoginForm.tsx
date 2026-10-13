import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/auth.service';
import { ZaloIcon } from '@/features/auth/components/ZaloIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getApiErrorMessage } from '@/lib/api-client';

const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Vui lòng nhập email hoặc số điện thoại')
    .transform((val) => val.trim()),
  password: z
    .string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      await login(values);
      onSuccess?.();
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err);
      setServerError(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && (
        <div
          className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50/70 p-3 text-sm text-rose-800"
          role="alert"
        >
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <span className="leading-snug">{serverError}</span>
        </div>
      )}

      <div>
        <Input
          {...register('identifier')}
          type="text"
          label="Email hoặc Số điện thoại"
          placeholder="vd: giaovien@vanbynhi.vn hoặc 0912345678"
          autoComplete="username"
          error={errors.identifier?.message}
          leftIcon={<UserIcon className="w-4 h-4" />}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <Input
          {...register('password')}
          type={showPassword ? 'text' : 'password'}
          label="Mật khẩu"
          placeholder="Nhập mật khẩu"
          autoComplete="current-password"
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

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full"
          isLoading={isSubmitting}
        >
          Đăng nhập
        </Button>
      </div>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-slate-400 font-medium">Hoặc</span>
        </div>
      </div>

      <div>
        <Button
          type="button"
          variant="outline"
          size="md"
          className="w-full border-slate-200 hover:bg-sky-50/50 hover:border-sky-300 hover:text-sky-700 text-slate-700 font-medium flex items-center justify-center gap-2.5 transition-colors shadow-xs"
          onClick={() => {
            window.location.href = authService.getZaloLoginUrl();
          }}
        >
          <ZaloIcon className="w-5 h-5 shrink-0" />
          <span>Đăng nhập bằng Zalo</span>
        </Button>
      </div>
    </form>
  );
}
