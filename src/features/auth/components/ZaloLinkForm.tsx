import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, User as UserIcon, AlertCircle, Link2, ArrowLeft } from 'lucide-react';
import { authService } from '@/features/auth/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getApiErrorMessage } from '@/lib/api-client';
import type { LinkZaloResponse } from '@/types/auth.types';

const linkSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Vui lòng nhập email hoặc số điện thoại')
    .transform((val) => val.trim()),
  password: z
    .string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

type LinkFormValues = z.infer<typeof linkSchema>;

export interface ZaloLinkFormProps {
  linkTicket: string;
  onSuccess: (response: LinkZaloResponse) => void;
  onCancel?: () => void;
}

export function ZaloLinkForm({ linkTicket, onSuccess, onCancel }: ZaloLinkFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LinkFormValues>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const onSubmit = async (values: LinkFormValues) => {
    setServerError(null);
    try {
      const response = await authService.linkZaloAccount({
        linkTicket,
        identifier: values.identifier,
        password: values.password,
      });
      onSuccess(response);
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
          label="Email hoặc Số điện thoại tài khoản VanbyNhi"
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
          label="Mật khẩu tài khoản"
          placeholder="Nhập mật khẩu để xác minh"
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

      <div className="pt-2 flex flex-col sm:flex-row gap-3">
        <Button
          type="submit"
          variant="primary"
          size="md"
          className="flex-1 bg-amber-700 hover:bg-amber-800"
          isLoading={isSubmitting}
          leftIcon={<Link2 className="w-4 h-4" />}
        >
          Xác nhận liên kết
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="md"
            disabled={isSubmitting}
            onClick={onCancel}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Quay lại
          </Button>
        )}
      </div>
    </form>
  );
}
