import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Eye,
  Trash2,
  FolderOpen,
  Download,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/hooks/useToast';
import { formatDate, formatBytes } from '@/utils/formatters';
import { getApiErrorMessage } from '@/lib/api-client';

import { teacherDocumentsService } from '@/features/documents/services/documents.service';
import type {
  ClassMaterialItem,
} from '@/features/documents/types/document.types';

export interface TeacherClassMaterialsTabProps {
  classId: string;
  classNameTitle?: string;
}

export function TeacherClassMaterialsTab({
  classId,
  classNameTitle,
}: TeacherClassMaterialsTabProps) {
  const queryClient = useQueryClient();
  const { success, error: toastError, info } = useToast();

  const page = 1;
  const limit = 10;

  // Modals
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<ClassMaterialItem | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<ClassMaterialItem | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // 1. Fetch class materials
  const {
    data: materialsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['teacher-class-materials', classId, { page, limit }],
    queryFn: () => teacherDocumentsService.getClassMaterials(classId, { page, limit }),
    enabled: Boolean(classId),
  });

  // 2. Fetch library documents for sharing selector
  const { data: libraryDocsData, isLoading: isLoadingLibrary } = useQuery({
    queryKey: ['teacher-library-for-share'],
    queryFn: () => teacherDocumentsService.getDocuments({ limit: 50 }),
    enabled: isShareModalOpen,
  });

  const materials = materialsData?.items || [];
  const libraryDocs = libraryDocsData?.items || [];

  // Share from library state
  const [selectedDocId, setSelectedDocId] = useState('');
  const [shareTitle, setShareTitle] = useState('');
  const [shareDescription, setShareDescription] = useState('');
  const [shareIsPublished, setShareIsPublished] = useState(true);

  // Mutation: Share document to class
  const shareMutation = useMutation({
    mutationFn: () =>
      teacherDocumentsService.shareDocumentToClass(classId, {
        documentId: selectedDocId,
        title: shareTitle.trim() || undefined,
        description: shareDescription.trim() || undefined,
        isPublished: shareIsPublished,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-class-materials', classId] });
      queryClient.invalidateQueries({ queryKey: ['teacher-documents'] });
      success(data.message || 'Chia sẻ tài liệu vào lớp học thành công!');
      setIsShareModalOpen(false);
      setSelectedDocId('');
      setShareTitle('');
      setShareDescription('');
    },
    onError: (err: unknown) => {
      toastError(getApiErrorMessage(err), 'Lỗi chia sẻ tài liệu');
    },
  });

  // Mutation: Remove material from class
  const removeMutation = useMutation({
    mutationFn: (id: string) => teacherDocumentsService.removeMaterial(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-class-materials', classId] });
      queryClient.invalidateQueries({ queryKey: ['teacher-documents'] });
      info(data.message || 'Đã gỡ tài liệu khỏi lớp học.');
      setMaterialToDelete(null);
    },
    onError: (err: unknown) => {
      toastError(getApiErrorMessage(err), 'Lỗi gỡ tài liệu');
    },
  });

  const handleOpenPreview = async (material: ClassMaterialItem) => {
    setPreviewMaterial(material);
    setIsLoadingPreview(true);
    setPreviewUrl(null);
    try {
      const data = await teacherDocumentsService.getMaterialDownloadUrl(material.id);
      setPreviewUrl(data.downloadUrl);
    } catch (err: unknown) {
      toastError(getApiErrorMessage(err), 'Không thể lấy liên kết tài liệu');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const getFormatBadge = (mimeType?: string | null, name?: string | null) => {
    const ext = name?.split('.').pop()?.toUpperCase() || '';
    if (mimeType?.includes('pdf') || ext === 'PDF') {
      return (
        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
          PDF
        </span>
      );
    }
    if (mimeType?.includes('word') || ext === 'DOCX' || ext === 'DOC') {
      return (
        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          WORD
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
        {ext || 'FILE'}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Tài liệu chung của lớp {classNameTitle ? `"${classNameTitle}"` : ''}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Các tài liệu này sẽ hiển thị trực tiếp cho toàn bộ học sinh trong lớp học.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setSelectedDocId('');
            setShareTitle('');
            setShareDescription('');
            setIsShareModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Chia sẻ từ thư viện
        </Button>
      </div>

      {/* Materials List */}
      {isError ? (
        <ErrorState
          title="Không thể tải danh sách tài liệu lớp"
          message={getApiErrorMessage(error)}
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <div className="p-8 flex justify-center items-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-amber-700 mr-2" />
          <span className="text-sm">Đang tải tài liệu lớp học...</span>
        </div>
      ) : materials.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="w-8 h-8 text-slate-400" />}
          title="Chưa có tài liệu nào trong lớp"
          description="Bạn có thể chọn tài liệu có sẵn từ thư viện cá nhân để chia sẻ cho học sinh lớp này."
          actionLabel="Chia sẻ tài liệu ngay"
          onAction={() => setIsShareModalOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          {materials.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-amber-300 transition-colors flex items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="mt-0.5 shrink-0">
                  {getFormatBadge(item.mimeType, item.originalName)}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <h4
                    onClick={() => handleOpenPreview(item)}
                    className="text-sm font-semibold text-slate-900 hover:text-amber-800 transition-colors cursor-pointer truncate"
                  >
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className="text-xs text-slate-500 line-clamp-1">
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>{formatBytes(item.fileSize)}</span>
                    <span>•</span>
                    <span>{formatDate(item.createdAt)}</span>
                    <span>•</span>
                    <Badge
                      variant={item.isPublished ? 'success' : 'default'}
                      size="sm"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {item.isPublished ? 'Đã xuất bản' : 'Bản nháp'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenPreview(item)}
                  leftIcon={<Eye className="w-3.5 h-3.5" />}
                >
                  Xem
                </Button>
                <button
                  type="button"
                  onClick={() => setMaterialToDelete(item)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Gỡ khỏi lớp học"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Share from library */}
      <Modal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="Chia sẻ tài liệu từ thư viện vào lớp học"
        description="Chọn một tài liệu trong thư viện cá nhân của bạn để gắn vào lớp học này."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Chọn tài liệu từ thư viện *
            </label>
            {isLoadingLibrary ? (
              <p className="text-xs text-slate-400">Đang tải tài liệu thư viện...</p>
            ) : libraryDocs.length === 0 ? (
              <p className="text-xs text-slate-500 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                Thư viện của bạn chưa có tài liệu nào. Vui lòng vào mục "Quản lý tài liệu" để tải lên trước.
              </p>
            ) : (
              <select
                value={selectedDocId}
                onChange={(e) => {
                  const docId = e.target.value;
                  setSelectedDocId(docId);
                  const doc = libraryDocs.find((d) => d.id === docId);
                  if (doc) {
                    setShareTitle(doc.title);
                    setShareDescription(doc.description || '');
                  }
                }}
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="">-- Chọn tài liệu trong thư viện --</option>
                {libraryDocs.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title} ({formatBytes(doc.sizeBytes)})
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedDocId && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tiêu đề hiển thị cho lớp học
                </label>
                <input
                  type="text"
                  value={shareTitle}
                  onChange={(e) => setShareTitle(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Hướng dẫn / Mô tả cho học sinh
                </label>
                <textarea
                  rows={2}
                  value={shareDescription}
                  onChange={(e) => setShareDescription(e.target.value)}
                  className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="tabSharePublishCheck"
                  type="checkbox"
                  checked={shareIsPublished}
                  onChange={(e) => setShareIsPublished(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <label
                  htmlFor="tabSharePublishCheck"
                  className="text-xs text-slate-700 cursor-pointer"
                >
                  Xuất bản ngay cho học sinh xem
                </label>
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsShareModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!selectedDocId || shareMutation.isPending}
              isLoading={shareMutation.isPending}
              onClick={() => shareMutation.mutate()}
            >
              Chia sẻ vào lớp
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Xác nhận gỡ tài liệu */}
      {materialToDelete && (
        <Modal
          isOpen={!!materialToDelete}
          onClose={() => setMaterialToDelete(null)}
          title="Gỡ tài liệu khỏi lớp học"
          description={`Bạn có chắc muốn gỡ "${materialToDelete.title}" khỏi lớp học này? Tệp tin trong thư viện cá nhân vẫn được bảo toàn nguyên vẹn.`}
          maxWidth="sm"
        >
          <div className="flex items-center justify-end gap-2 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMaterialToDelete(null)}
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={removeMutation.isPending}
              onClick={() => removeMutation.mutate(materialToDelete.id)}
            >
              Gỡ tài liệu
            </Button>
          </div>
        </Modal>
      )}

      {/* Modal Preview Material */}
      {previewMaterial && (
        <Modal
          isOpen={!!previewMaterial}
          onClose={() => setPreviewMaterial(null)}
          title={previewMaterial.title}
          description={`Tệp gốc: ${previewMaterial.originalName || 'Tài liệu'} • ${formatBytes(previewMaterial.fileSize)}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            {isLoadingPreview ? (
              <div className="py-8 flex justify-center items-center text-slate-500 text-xs">
                <Loader2 className="w-5 h-5 animate-spin text-amber-700 mr-2" />
                Đang tạo đường dẫn xem tài liệu...
              </div>
            ) : previewUrl ? (
              <div className="space-y-3">
                {previewMaterial.mimeType?.includes('pdf') ? (
                  <iframe
                    src={`${previewUrl}#toolbar=1`}
                    title={previewMaterial.title}
                    className="w-full h-[55vh] rounded-lg border border-slate-200"
                  />
                ) : (
                  <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-600 mb-3">
                      Tệp tin đã sẵn sàng để tải xuống hoặc mở bằng ứng dụng trên thiết bị của bạn.
                    </p>
                    <a
                      href={previewUrl}
                      download={previewMaterial.originalName || 'tai-lieu'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-700 text-white rounded-lg text-xs font-semibold hover:bg-amber-800 shadow-xs"
                    >
                      <Download className="w-4 h-4" />
                      <span>Tải tệp tin về máy</span>
                    </a>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Mở tab mới</span>
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewMaterial(null)}
                  >
                    Đóng
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </Modal>
      )}
    </div>
  );
}
