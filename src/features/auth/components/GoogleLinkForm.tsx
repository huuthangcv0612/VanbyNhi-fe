import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, User as UserIcon, AlertCircle, ArrowLeft } from 'lucide-react';
import { googleService } from '@/features/google/services/google.service';
import { GoogleIcon } from '@/features/google/components/GoogleIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getApiErrorMessage } from '@/lib/api-client';
import type { GoogleLinkResponse } from '@/features/google/types/google.types';

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

export interface GoogleLinkFormProps {
  linkTicket: string;
  defaultEmail?: string;
  onSuccess: (response: GoogleLinkResponse) => void;
  onCancel?: () => void;
}

export function GoogleLinkForm({
  linkTicket,
  defaultEmail,
  onSuccess,
  onCancel,
}: GoogleLinkFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LinkFormValues>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      identifier: defaultEmail || '',
      password: '',
    },
  });

  const onSubmit = async (values: LinkFormValues) => {
    setServerError(null);
    try {
      const response = await googleService.linkAccount({
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

      <div className="pt-2 space-y-2">
        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full"
          isLoading={isSubmitting}
          leftIcon={<GoogleIcon className="w-4 h-4" />}
        >
          Xác nhận liên kết & Đăng nhập
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="md"
            className="w-full text-slate-500 hover:text-slate-700"
            onClick={onCancel}
            disabled={isSubmitting}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Quay lại trang Đăng nhập
          </Button>
        )}
      </div>
    </form>
  );
}
