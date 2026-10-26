import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FolderOpen,
  Search,
  Trash2,
  Eye,
  Clock,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useToast } from '@/hooks/useToast';
import { formatDate, formatBytes } from '@/utils/formatters';
import { getApiErrorMessage } from '@/lib/api-client';
import { teacherClassesService } from '@/features/classes/services/classes.service';
import { teacherDocumentsService } from '../services/documents.service';
import type { ClassMaterialItem, DocumentItem } from '../types/document.types';
import { DocumentPreviewModal } from './DocumentPreviewModal';

export function TeacherAssignedMaterialsView() {
  const queryClient = useQueryClient();
  const { error: toastError, info } = useToast();

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [materialToDelete, setMaterialToDelete] = useState<ClassMaterialItem | null>(null);
  const [docToPreview, setDocToPreview] = useState<DocumentItem | null>(null);

  // 1. Fetch teacher classes
  const {
    data: classesData,
    isLoading: isLoadingClasses,
    isError: isClassesError,
    error: classesError,
    refetch: refetchClasses,
  } = useQuery({
    queryKey: ['teacher-my-classes-assigned-view'],
    queryFn: () => teacherClassesService.getMyClasses({ limit: 100 }),
  });

  const classes = classesData?.items || [];
  const currentClassId = selectedClassId || (classes.length > 0 ? classes[0].id : '');
  const currentClass = classes.find((c) => c.id === currentClassId);

  // 2. Fetch class materials
  const {
    data: materialsData,
    isLoading: isLoadingMaterials,
    isError: isMaterialsError,
    error: materialsError,
    refetch: refetchMaterials,
  } = useQuery({
    queryKey: ['teacher-class-materials-view', currentClassId, page, searchQuery],
    queryFn: () =>
      teacherDocumentsService.getClassMaterials(currentClassId, {
        page,
        limit,
        search: searchQuery || undefined,
      }),
    enabled: Boolean(currentClassId),
  });

  const materials = materialsData?.items || [];
  const pagination = materialsData?.pagination;

  // Mutation: Revoke material permission from class
  const revokeMutation = useMutation({
    mutationFn: (materialId: string) => teacherDocumentsService.removeMaterial(materialId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-class-materials-view'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-documents'] });
      info(data.message || 'Đã thu hồi quyền truy cập tài liệu khỏi lớp');
      setMaterialToDelete(null);
    },
    onError: (err: unknown) => {
      toastError(getApiErrorMessage(err), 'Lỗi thu hồi quyền');
    },
  });

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

  const handlePreview = (m: ClassMaterialItem) => {
    // Construct virtual DocumentItem for DocumentPreviewModal
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

  if (isLoadingClasses) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (isClassesError) {
    return (
      <ErrorState
        title="Không thể tải danh sách lớp học"
        message={getApiErrorMessage(classesError)}
        onRetry={() => refetchClasses()}
      />
    );
  }

  if (classes.length === 0) {
    return (
      <EmptyState
        icon={<GraduationCap className="w-10 h-10 text-slate-400" />}
        title="Bạn chưa có lớp học nào"
        description="Hãy tạo lớp học mới để bắt đầu cấp quyền tài liệu giảng dạy cho học sinh."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Class Selector & Stats */}
      <Card className="p-4 border-slate-200 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-700" />
              Chọn lớp học để xem tài liệu đã cấp quyền:
            </label>
            <div className="flex items-center gap-3">
              <select
                value={currentClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setPage(1);
                }}
                className="text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 bg-white py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 cursor-pointer min-w-56"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>

              {currentClass && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant={currentClass.status === 'ACTIVE' ? 'success' : 'default'}
                    size="sm"
                    className="text-[10px]"
                  >
                    {currentClass.status === 'ACTIVE' ? 'Đang hoạt động' : currentClass.status}
                  </Badge>
                  {currentClass.activeStudentCount !== undefined && (
                    <span className="text-xs text-slate-500">
                      {currentClass.activeStudentCount} học sinh
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Tổng tài liệu trong lớp:{' '}
            <span className="font-bold text-amber-800">{pagination?.total ?? 0}</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm kiếm tài liệu trong lớp theo tiêu đề, mô tả..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </Card>

      {/* Materials List */}
      {isMaterialsError ? (
        <ErrorState
          title="Không thể tải tài liệu của lớp"
          message={getApiErrorMessage(materialsError)}
          onRetry={() => refetchMaterials()}
        />
      ) : isLoadingMaterials ? (
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
          icon={<FolderOpen className="w-8 h-8 text-slate-400" />}
          title="Lớp này chưa có tài liệu nào"
          description={
            searchQuery
              ? 'Không tìm thấy tài liệu phù hợp với từ khóa.'
              : 'Hãy chuyển sang tab "Thư viện tài liệu" để chọn và cấp quyền tài liệu cho lớp học này.'
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
                      onClick={() => handlePreview(m)}
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
                        <span className="font-mono text-slate-600 truncate max-w-xs">
                          {m.originalName}
                        </span>
                      )}
                      <span>•</span>
                      <span className="font-medium text-slate-700">
                        {formatBytes(m.fileSize || m.document?.sizeBytes || 0)}
                      </span>
                      <span>•</span>
                      <span>Được cấp: {formatDate(m.createdAt)}</span>

                      <Badge
                        variant={m.isPublished ? 'success' : 'default'}
                        size="sm"
                        className="text-[10px] px-2 py-0"
                      >
                        {m.isPublished ? 'Đã xuất bản' : 'Bản nháp'}
                      </Badge>

                      {(m.accessStartTime || m.accessEndTime) && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>
                            {m.accessStartTime ? formatDate(m.accessStartTime) : 'Bắt đầu ngay'}{' '}
                            - {m.accessEndTime ? formatDate(m.accessEndTime) : 'Vô thời hạn'}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview(m)}
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                  >
                    Xem
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setMaterialToDelete(m)}
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                    title="Thu hồi quyền khỏi lớp"
                  >
                    Thu hồi
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

      {/* Modal xác nhận thu hồi quyền */}
      {materialToDelete && (
        <Modal
          isOpen={Boolean(materialToDelete)}
          onClose={() => setMaterialToDelete(null)}
          title="Xác nhận thu hồi quyền tài liệu"
          description={`Bạn có chắc chắn muốn thu hồi quyền tài liệu "${materialToDelete.title}" khỏi lớp "${currentClass?.name}"?`}
          maxWidth="sm"
        >
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <p className="font-semibold mb-1">Chính sách an toàn dữ liệu:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Học sinh trong lớp "{currentClass?.name}" sẽ không còn quyền xem hoặc tải tài liệu này.</li>
                <li>Tài liệu gốc vẫn được lưu an toàn trong Thư viện cá nhân của bạn.</li>
                <li>Tệp tin trên Cloudflare R2 và các lớp học khác có cùng tài liệu không bị ảnh hưởng.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMaterialToDelete(null)}
                disabled={revokeMutation.isPending}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={revokeMutation.isPending}
                onClick={() => revokeMutation.mutate(materialToDelete.id)}
              >
                Xác nhận thu hồi
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal xem trước tài liệu */}
      {docToPreview && (
        <DocumentPreviewModal
          isOpen={Boolean(docToPreview)}
          onClose={() => setDocToPreview(null)}
          document={docToPreview}
          fetchUrlFn={(id) => teacherDocumentsService.getMaterialDownloadUrl(id)}
        />
      )}
    </div>
  );
}
