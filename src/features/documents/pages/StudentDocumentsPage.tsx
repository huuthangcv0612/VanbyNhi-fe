import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Search,
  Eye,
  Download,
  GraduationCap,
  Clock,
  Layers,
  User,
  FileText,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { formatDate, formatBytes } from '@/utils/formatters';
import { getApiErrorMessage } from '@/lib/api-client';
import { useToast } from '@/hooks/useToast';
import { studentClassesService } from '@/features/classes/services/classes.service';
import { studentDocumentsService } from '../services/documents.service';
import type { ClassMaterialItem, DocumentItem } from '../types/document.types';
import { DocumentPreviewModal } from '../components/DocumentPreviewModal';

export function StudentDocumentsPage() {
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 12;

  const [docToPreview, setDocToPreview] = useState<DocumentItem | null>(null);
  const [downloadingMaterialId, setDownloadingMaterialId] = useState<string | null>(null);

  // 1. Fetch student's ACTIVE enrolled classes
  const {
    data: classesData,
    isLoading: isLoadingClasses,
    isError: isClassesError,
    error: classesError,
    refetch: refetchClasses,
  } = useQuery({
    queryKey: ['student-enrolled-classes-for-documents'],
    queryFn: () => studentClassesService.getMyClasses({ limit: 100 }),
  });

  const enrolledClasses = useMemo(() => classesData?.items || [], [classesData?.items]);

  // Set default selected class once loaded
  const currentClassId =
    selectedClassId || (enrolledClasses.length > 0 ? enrolledClasses[0].class.id : '');
  const currentClassItem = enrolledClasses.find((item) => item.class.id === currentClassId);

  // 2. Fetch materials for selected class
  const {
    data: materialsData,
    isLoading: isLoadingMaterials,
    isError: isMaterialsError,
    error: materialsError,
    refetch: refetchMaterials,
  } = useQuery({
    queryKey: ['student-class-materials', currentClassId, page, searchQuery],
    queryFn: () =>
      studentDocumentsService.getClassMaterials(currentClassId, {
        page,
        limit,
        search: searchQuery || undefined,
      }),
    enabled: Boolean(currentClassId),
  });

  const materials = materialsData?.items || [];
  const pagination = materialsData?.pagination;

  const getFileTypeBadge = (mimeType: string | null, originalName: string | null) => {
    const ext = originalName?.split('.').pop()?.toUpperCase() || '';
    if (mimeType?.includes('pdf') || ext === 'PDF') {
      return (
        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 shrink-0">
          PDF
        </span>
      );
    }
    if (mimeType?.includes('word') || ext === 'DOC' || ext === 'DOCX') {
      return (
        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shrink-0">
          WORD
        </span>
      );
    }
    if (mimeType?.includes('presentation') || ext === 'PPT' || ext === 'PPTX') {
      return (
        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
          SLIDE
        </span>
      );
    }
    if (mimeType?.includes('sheet') || ext === 'XLS' || ext === 'XLSX') {
      return (
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
          EXCEL
        </span>
      );
    }
    if (mimeType?.startsWith('image/')) {
      return (
        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 shrink-0">
          ẢNH
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shrink-0">
        {ext || 'FILE'}
      </span>
    );
  };

  const handleOpenPreview = (m: ClassMaterialItem) => {
    const docItem: DocumentItem = {
      id: m.id, // Using material id so download-url endpoint uses it
      title: m.title,
      description: m.description,
      originalName: m.originalName || 'file',
      storageKey: m.document?.storageKey || '',
      mimeType: m.mimeType || 'application/octet-stream',
      sizeBytes: m.fileSize || m.document?.sizeBytes || 0,
      ownerId: m.uploadedById,
      categoryId: null,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    };
    setDocToPreview(docItem);
  };

  const handleDirectDownload = async (m: ClassMaterialItem) => {
    setDownloadingMaterialId(m.id);
    try {
      const data = await studentDocumentsService.getMaterialDownloadUrl(m.id);
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank', 'noopener,noreferrer');
      } else {
        toastError('Không thể lấy liên kết tải tài liệu.');
      }
    } catch (err: unknown) {
      toastError(getApiErrorMessage(err), 'Lỗi tải tài liệu');
    } finally {
      setDownloadingMaterialId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tài liệu học tập"
        description="Kho tài liệu bài giảng, chuyên đề ôn thi và văn mẫu chọn lọc do giáo viên cấp quyền cho các lớp bạn đang theo học"
      />

      {/* 1. Class Selection Tabs / Bar */}
      {isLoadingClasses ? (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-44 rounded-xl shrink-0" />
          ))}
        </div>
      ) : isClassesError ? (
        <ErrorState
          title="Không thể tải danh sách lớp học của bạn"
          message={getApiErrorMessage(classesError)}
          onRetry={() => refetchClasses()}
        />
      ) : enrolledClasses.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="w-12 h-12 text-slate-400" />}
          title="Bạn chưa tham gia lớp học nào"
          description="Hãy đăng ký tham gia lớp học để xem các tài liệu bài giảng và đề thi do giáo viên chia sẻ."
          actionLabel="Xem các lớp học"
          onAction={() => navigate('/student/classes')}
        />
      ) : (
        <div className="space-y-6">
          {/* Class Selector Bar */}
          <Card className="p-3 bg-white border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-700" />
                Chọn lớp học ({enrolledClasses.length} lớp):
              </label>
              {currentClassItem && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Giáo viên:{' '}
                    <strong className="text-slate-800">
                      {currentClassItem.class.teacher?.fullName || 'Giáo viên phụ trách'}
                    </strong>
                  </span>
                </div>
              )}
            </div>

            {/* Horizontal class pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {enrolledClasses.map((item) => {
                const isSelected = item.class.id === currentClassId;
                return (
                  <button
                    key={item.class.id}
                    type="button"
                    onClick={() => {
                      setSelectedClassId(item.class.id);
                      setPage(1);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <BookOpen className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-800' : 'text-slate-400'}`} />
                    <span className="truncate max-w-xs">{item.class.name}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Search bar & Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Tìm kiếm tài liệu theo tiêu đề, mô tả..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="text-xs text-slate-500 font-medium self-end sm:self-center">
              Hiển thị: <span className="font-bold text-slate-800">{pagination?.total ?? 0}</span> tài liệu
            </div>
          </div>

          {/* Materials Content */}
          {isMaterialsError ? (
            <ErrorState
              title="Không thể tải tài liệu của lớp"
              message={getApiErrorMessage(materialsError)}
              onRetry={() => refetchMaterials()}
            />
          ) : isLoadingMaterials ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="pt-2 flex justify-end gap-2">
                    <Skeleton className="h-8 w-20 rounded-lg" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : materials.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-10 h-10 text-slate-400" />}
              title="Lớp học này chưa có tài liệu được chia sẻ."
              description={
                searchQuery
                  ? 'Không tìm thấy tài liệu phù hợp với từ khóa tìm kiếm.'
                  : 'Giáo viên phụ trách lớp chưa tải lên tài liệu học tập nào cho lớp này. Hãy quay lại sau nhé!'
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border border-slate-200 bg-white p-4.5 hover:border-amber-300 hover:shadow-xs transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2.5">
                    {/* Top Row: File Type Badge + File Size */}
                    <div className="flex items-center justify-between">
                      {getFileTypeBadge(m.mimeType, m.originalName)}
                      <span className="text-[11px] font-mono text-slate-500 font-medium">
                        {formatBytes(m.fileSize || m.document?.sizeBytes || 0)}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h4
                        onClick={() => handleOpenPreview(m)}
                        className="font-bold text-slate-900 hover:text-amber-800 text-sm sm:text-base cursor-pointer line-clamp-2 transition-colors leading-snug"
                        title={m.title}
                      >
                        {m.title}
                      </h4>
                      {m.description && (
                        <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {m.description}
                        </p>
                      )}
                    </div>

                    {/* Original filename & published date */}
                    <div className="space-y-1 pt-1 border-t border-slate-100 text-[11px] text-slate-400">
                      {m.originalName && (
                        <p className="font-mono text-slate-500 truncate" title={m.originalName}>
                          {m.originalName}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span>Đăng ngày: {formatDate(m.createdAt)}</span>
                      </div>
                    </div>

                    {/* Access window badge if restricted */}
                    {(m.accessStartTime || m.accessEndTime) && (
                      <div className="p-2 rounded-lg bg-amber-50/80 border border-amber-200/60 text-[10px] text-amber-900 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span className="truncate">
                          Thời hạn:{' '}
                          {m.accessStartTime ? formatDate(m.accessStartTime) : 'Bắt đầu ngay'}{' '}
                          - {m.accessEndTime ? formatDate(m.accessEndTime) : 'Vô thời hạn'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions: Xem tài liệu & Tải xuống */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenPreview(m)}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                      aria-label={`Xem tài liệu ${m.title}`}
                    >
                      <span className="hidden sm:inline">Xem tài liệu</span>
                      <span className="sm:hidden">Xem</span>
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={downloadingMaterialId === m.id}
                      onClick={() => handleDirectDownload(m)}
                      leftIcon={<Download className="w-3.5 h-3.5" />}
                      aria-label={`Tải xuống tài liệu ${m.title}`}
                    >
                      <span className="hidden sm:inline">Tải xuống</span>
                      <span className="sm:hidden">Tải</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="pt-2 flex justify-center">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(newPage) => setPage(newPage)}
              />
            </div>
          )}
        </div>
      )}

      {/* Modal xem trước file cho học sinh với student presigned download URL */}
      {docToPreview && (
        <DocumentPreviewModal
          isOpen={Boolean(docToPreview)}
          onClose={() => setDocToPreview(null)}
          document={docToPreview}
          fetchUrlFn={(id) => studentDocumentsService.getMaterialDownloadUrl(id)}
        />
      )}
    </div>
  );
}
