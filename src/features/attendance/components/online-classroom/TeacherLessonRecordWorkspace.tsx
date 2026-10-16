import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Save,
  CheckCircle,
  Shield,
  FileEdit,
} from 'lucide-react';
import { teacherClassesService } from '@/features/classes/services/classes.service';
import type { UpsertLessonRecordDto } from '@/features/classes/types/class.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useToast } from '@/hooks/useToast';
import { getApiErrorMessage } from '@/lib/api-client';
import { formatDateTime } from '@/utils/formatters';

const lessonRecordSchema = z.object({
  content: z.string().trim().min(1, 'Nội dung bài học không được để trống'),
  coreKnowledge: z.string().optional(),
  incompleteContent: z.string().optional(),
  homeworkSummary: z.string().optional(),
  teacherNotes: z.string().optional(),
  generalRemarks: z.string().optional(),
});

type LessonRecordFormData = z.infer<typeof lessonRecordSchema>;

export interface TeacherLessonRecordWorkspaceProps {
  sessionId: string;
}

export function TeacherLessonRecordWorkspace({ sessionId }: TeacherLessonRecordWorkspaceProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // 1. Tải dữ liệu nhật ký hiện tại
  const {
    data: recordData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['teacher-lesson-record', sessionId],
    queryFn: () => teacherClassesService.getTeacherLessonRecord(sessionId),
    enabled: Boolean(sessionId),
  });

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<LessonRecordFormData>({
    resolver: zodResolver(lessonRecordSchema),
    defaultValues: {
      content: '',
      coreKnowledge: '',
      incompleteContent: '',
      homeworkSummary: '',
      teacherNotes: '',
      generalRemarks: '',
    },
  });

  // Khi tải xong dữ liệu, nạp vào form
  useEffect(() => {
    if (recordData) {
      reset({
        content: recordData.content || '',
        coreKnowledge: recordData.coreKnowledge || '',
        incompleteContent: recordData.incompleteContent || '',
        homeworkSummary: recordData.homeworkSummary || '',
        teacherNotes: recordData.teacherNotes || '',
        generalRemarks: recordData.generalRemarks || '',
      });
    }
  }, [recordData, reset]);

  // Cảnh báo người dùng khi có thay đổi chưa lưu
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  // Mutation: Lưu nhật ký bài học
  const saveRecordMutation = useMutation({
    mutationFn: (data: LessonRecordFormData) => {
      const payload: UpsertLessonRecordDto = {
        content: data.content,
        coreKnowledge: data.coreKnowledge?.trim() || undefined,
        incompleteContent: data.incompleteContent?.trim() || undefined,
        homeworkSummary: data.homeworkSummary?.trim() || undefined,
        teacherNotes: data.teacherNotes?.trim() || undefined,
        generalRemarks: data.generalRemarks?.trim() || undefined,
      };
      return teacherClassesService.upsertTeacherLessonRecord(sessionId, payload);
    },
    onSuccess: (res) => {
      showToast({
        type: 'success',
        title: 'Đã lưu nhật ký buổi học',
        message: res.message || 'Thông tin nhật ký buổi học đã được ghi nhận thành công.',
      });
      // Reset trạng thái dirty với dữ liệu mới
      reset(res.lessonRecord ? {
        content: res.lessonRecord.content || '',
        coreKnowledge: res.lessonRecord.coreKnowledge || '',
        incompleteContent: res.lessonRecord.incompleteContent || '',
        homeworkSummary: res.lessonRecord.homeworkSummary || '',
        teacherNotes: res.lessonRecord.teacherNotes || '',
        generalRemarks: res.lessonRecord.generalRemarks || '',
      } : undefined);

      queryClient.invalidateQueries({ queryKey: ['teacher-lesson-record', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['session-attendance', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['session-detail', sessionId] });
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Không thể lưu nhật ký',
        message: getApiErrorMessage(err),
      });
    },
  });

  const onSubmit = (data: LessonRecordFormData) => {
    saveRecordMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <ErrorState
          title="Không thể tải nhật ký buổi học"
          message={getApiErrorMessage(error)}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
              <FileEdit className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              Nhật ký giảng dạy buổi học
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Ghi chép nội dung bài giảng, mức độ tiếp thu, bài tập về nhà và dặn dò cho học sinh.
          </p>
        </div>

        {/* Trạng thái lưu */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {isDirty ? (
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
              Có thay đổi chưa lưu
            </Badge>
          ) : recordData?.updatedAt ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
              <CheckCircle className="w-4 h-4" />
              <span>Đã lưu lúc {formatDateTime(recordData.updatedAt)}</span>
            </div>
          ) : (
            <Badge className="bg-slate-100 text-slate-600 text-xs">Chưa có nhật ký</Badge>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Nội dung bài học */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="lesson-content"
              className="block text-xs font-semibold text-slate-800"
            >
              1. Nội dung đã giảng dạy trong buổi học <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-400">Bắt buộc</span>
          </div>
          <textarea
            id="lesson-content"
            rows={4}
            {...register('content')}
            placeholder="Mô tả tóm tắt nội dung bài học, tác phẩm đã phân tích, các luận điểm chính đã hoàn thành..."
            className={`w-full text-xs rounded-xl border p-3 focus:outline-hidden transition-colors leading-relaxed ${
              errors.content
                ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20'
                : 'border-slate-200 focus:border-amber-600 focus:ring-1 focus:ring-amber-600'
            }`}
          />
          {errors.content && (
            <p className="text-xs text-rose-600 font-medium">{errors.content.message}</p>
          )}
        </div>

        {/* 2 cột: Kiến thức trọng tâm & Nội dung chưa hoàn thành */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="core-knowledge"
              className="block text-xs font-semibold text-slate-800"
            >
              2. Kiến thức trọng tâm cần nhớ
            </label>
            <textarea
              id="core-knowledge"
              rows={3}
              {...register('coreKnowledge')}
              placeholder="Các khái niệm, dẫn chứng hoặc kỹ năng then chốt học sinh cần nắm vững..."
              className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:border-amber-600 focus:outline-hidden focus:ring-1 focus:ring-amber-600 leading-relaxed"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="incomplete-content"
              className="block text-xs font-semibold text-slate-800"
            >
              3. Nội dung chưa kịp hoàn thành (nếu có)
            </label>
            <textarea
              id="incomplete-content"
              rows={3}
              {...register('incompleteContent')}
              placeholder="Những phần còn dang dở cần dạy bù hoặc chuyển sang buổi sau..."
              className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:border-amber-600 focus:outline-hidden focus:ring-1 focus:ring-amber-600 leading-relaxed"
            />
          </div>
        </div>

        {/* Bài tập về nhà */}
        <div className="space-y-1.5">
          <label
            htmlFor="homework-summary"
            className="block text-xs font-semibold text-slate-800"
          >
            4. Tóm tắt bài tập & Nhiệm vụ về nhà
          </label>
          <textarea
            id="homework-summary"
            rows={3}
            {...register('homeworkSummary')}
            placeholder="Yêu cầu viết đoạn văn, đọc trước tài liệu, hoàn thiện đề bài nào..."
            className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:border-amber-600 focus:outline-hidden focus:ring-1 focus:ring-amber-600 leading-relaxed"
          />
        </div>

        {/* Nhận xét chung */}
        <div className="space-y-1.5">
          <label
            htmlFor="general-remarks"
            className="block text-xs font-semibold text-slate-800"
          >
            5. Nhận xét chung về tinh thần học tập của lớp
          </label>
          <textarea
            id="general-remarks"
            rows={2}
            {...register('generalRemarks')}
            placeholder="Không khí học tập, sự tương tác và phát biểu của học sinh trong buổi học..."
            className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:border-amber-600 focus:outline-hidden focus:ring-1 focus:ring-amber-600 leading-relaxed"
          />
        </div>

        {/* Ghi chú nội bộ giáo viên (Bảo mật) */}
        <div className="space-y-1.5 bg-amber-50/60 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-amber-700" />
              <label
                htmlFor="teacher-notes"
                className="text-xs font-bold text-amber-950"
              >
                6. Ghi chú nội bộ dành riêng cho Giáo viên
              </label>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
              Riêng tư (Chỉ GV thấy)
            </span>
          </div>
          <p className="text-[11px] text-amber-800">
            Trường này được bảo mật hoàn toàn: học sinh và phụ huynh không thể xem nội dung này.
          </p>
          <textarea
            id="teacher-notes"
            rows={2}
            {...register('teacherNotes')}
            placeholder="Ghi chú cá nhân về học sinh yếu cần kèm thêm, việc cần chuẩn bị cho buổi sau..."
            className="w-full text-xs rounded-xl border border-amber-300 bg-white p-2.5 focus:border-amber-700 focus:outline-hidden leading-relaxed"
          />
        </div>

        {/* Nút lưu */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            {isDirty ? 'Hãy bấm "Lưu nhật ký" để cập nhật thay đổi.' : 'Dữ liệu đã được lưu an toàn.'}
          </span>
          <Button
            type="submit"
            variant="primary"
            isLoading={saveRecordMutation.isPending || isSubmitting}
            className="bg-amber-800 hover:bg-amber-900 text-white font-semibold cursor-pointer"
            leftIcon={<Save className="w-4 h-4" />}
          >
            Lưu nhật ký buổi học
          </Button>
        </div>
      </form>
    </div>
  );
}
