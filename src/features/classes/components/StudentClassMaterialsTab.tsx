import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Eye,
  Download,
  Clock,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { formatDate, formatBytes } from '@/utils/formatters';
import { getApiErrorMessage } from '@/lib/api-client';
import { useToast } from '@/hooks/useToast';
import { studentDocumentsService } from '@/features/documents/services/documents.service';
import type { ClassMaterialItem, DocumentItem } from '@/features/documents/types/document.types';
import { DocumentPreviewModal } from '@/features/documents/components/DocumentPreviewModal';

export interface StudentClassMaterialsTabProps {
  classId: string;
}

export function StudentClassMaterialsTab({ classId }: StudentClassMaterialsTabProps) {
  const { error: toastError } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [docToPreview, setDocToPreview] = useState<DocumentItem | null>(null);
  const [downloadingMaterialId, setDownloadingMaterialId] = useState<string | null>(null);

  const {
    data: materialsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['student-class-materials-tab', classId, page, searchQuery],
    queryFn: () =>
      studentDocumentsService.getClassMaterials(classId, {
        page,
        limit,
        search: searchQuery || undefined,
      }),
    enabled: Boolean(classId),
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
      id: m.id,
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
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Tìm kiếm tài liệu bài giảng trong lớp này..."
          className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {isError ? (
        <ErrorState
          title="Không thể tải tài liệu của lớp"
          message={getApiErrorMessage(error)}
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : materials.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-8 h-8 text-slate-400" />}
          title="Lớp học này chưa có tài liệu được chia sẻ."
          description={
            searchQuery
              ? 'Không tìm thấy tài liệu phù hợp với từ khóa.'
              : 'Giáo viên chưa chia sẻ tài liệu bài giảng nào cho lớp học này.'
          }
        />
      ) : (
        <div className="space-y-3">
          {materials.map((m) => (
            <div
              key={m.id}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-amber-300 hover:shadow-xs transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="mt-0.5">
                    {getFileTypeBadge(m.mimeType, m.originalName)}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h4
                      onClick={() => handleOpenPreview(m)}
                      className="font-bold text-slate-900 hover:text-amber-800 text-sm sm:text-base cursor-pointer transition-colors truncate"
                      title={m.title}
                    >
                      {m.title}
                    </h4>

                    {m.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {m.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
                      {m.originalName && (
                        <span className="font-mono text-slate-600 truncate max-w-xs" title={m.originalName}>
                          {m.originalName}
                        </span>
                      )}
                      <span>•</span>
                      <span className="font-medium text-slate-700">
                        {formatBytes(m.fileSize || m.document?.sizeBytes || 0)}
                      </span>
                      <span>•</span>
                      <span>Đăng ngày: {formatDate(m.createdAt)}</span>

                      {(m.accessStartTime || m.accessEndTime) && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>
                            {m.accessStartTime ? formatDate(m.accessStartTime) : 'Bắt đầu ngay'}{' '}
                            - {m.accessEndTime ? formatDate(m.accessEndTime) : 'Vô thời hạn'}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenPreview(m)}
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                  >
                    Xem
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={downloadingMaterialId === m.id}
                    onClick={() => handleDirectDownload(m)}
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                  >
                    Tải về
                  </Button>
                </div>
              </div>
            </div>
          ))}

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

      {/* Modal Preview file cho học sinh */}
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
