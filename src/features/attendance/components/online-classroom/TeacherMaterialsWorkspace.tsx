import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Search,
  Share2,
  FolderOpen,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { teacherDocumentsService } from '@/features/documents/services/documents.service';
import type { ClassMaterialItem, DocumentItem } from '@/features/documents/types/document.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmModal } from '@/features/classes/components/ConfirmModal';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useToast } from '@/hooks/useToast';
import { getApiErrorMessage } from '@/lib/api-client';
import { formatDate } from '@/utils/formatters';

export interface TeacherMaterialsWorkspaceProps {
  sessionId: string;
}

export function TeacherMaterialsWorkspace({ sessionId }: TeacherMaterialsWorkspaceProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState('');

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Share from library modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [librarySearchTerm, setLibrarySearchTerm] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [shareTitle, setShareTitle] = useState('');

  // Delete modal state
  const [deleteTargetMaterial, setDeleteTargetMaterial] = useState<ClassMaterialItem | null>(null);

  // Downloading target ID
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // 1. Lấy danh sách tài liệu của buổi học
  const {
    data: materialsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['session-materials', sessionId],
    queryFn: () => teacherDocumentsService.getSessionMaterials(sessionId),
    enabled: Boolean(sessionId),
  });

  // 2. Lấy danh sách tài liệu từ thư viện cá nhân của giáo viên để chia sẻ
  const {
    data: libraryDocsData,
    isLoading: isLoadingLibrary,
  } = useQuery({
    queryKey: ['teacher-library-documents', librarySearchTerm],
    queryFn: () =>
      teacherDocumentsService.getDocuments({
        page: 1,
        limit: 50,
        search: librarySearchTerm || undefined,
      }),
    enabled: isShareModalOpen,
  });

  const invalidateMaterials = () => {
    queryClient.invalidateQueries({ queryKey: ['session-materials', sessionId] });
    queryClient.invalidateQueries({ queryKey: ['session-attendance', sessionId] });
    queryClient.invalidateQueries({ queryKey: ['session-detail', sessionId] });
  };

  // Mutation: Xóa / Gỡ tài liệu khỏi buổi học
  const deleteMutation = useMutation({
    mutationFn: (materialId: string) => teacherDocumentsService.removeMaterial(materialId),
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'Đã gỡ tài liệu khỏi buổi học',
        message: 'Tài liệu đã được loại bỏ khỏi danh sách tài nguyên buổi học.',
      });
      setDeleteTargetMaterial(null);
      invalidateMaterials();
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Không thể gỡ tài liệu',
        message: getApiErrorMessage(err),
      });
    },
  });

  // Mutation: Gắn tài liệu từ thư viện vào buổi học
  const shareMutation = useMutation({
    mutationFn: (dto: { documentId: string; title?: string }) =>
      teacherDocumentsService.shareDocumentToSession(sessionId, {
        documentId: dto.documentId,
        title: dto.title || undefined,
        isPublished: true,
      }),
    onSuccess: (res) => {
      showToast({
        type: 'success',
        title: 'Đã gắn tài liệu vào buổi học',
        message: res.message || 'Học sinh có thể xem và tải tài liệu này.',
      });
      setIsShareModalOpen(false);
      setSelectedDocId(null);
      setShareTitle('');
      invalidateMaterials();
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Không thể gắn tài liệu',
        message: getApiErrorMessage(err),
      });
    },
  });

  // Quy trình Upload trực tiếp (3 bước)
  const handleDirectUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast({
        type: 'warning',
        title: 'Chưa chọn tệp tin',
        message: 'Vui lòng chọn tệp tin từ máy tính cần tải lên.',
      });
      return;
    }

    const title = uploadTitle.trim() || selectedFile.name;
    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Bước 1: Khởi tạo upload URL
      setUploadProgress(25);
      const initRes = await teacherDocumentsService.initSessionUpload(sessionId, {
        title,
        originalName: selectedFile.name,
        mimeType: selectedFile.type || 'application/octet-stream',
        sizeBytes: selectedFile.size,
        description: uploadDescription.trim() || undefined,
      });

      // Bước 2: Upload trực tiếp file lên Cloudflare R2 presigned URL
      setUploadProgress(50);
      await teacherDocumentsService.uploadFileToR2(
        initRes.uploadUrl,
        selectedFile,
        initRes.requiredHeaders,
      );

      // Bước 3: Xác nhận hoàn tất upload
      setUploadProgress(85);
      await teacherDocumentsService.completeSessionUpload(sessionId, {
        storageKey: initRes.storageKey,
      });

      setUploadProgress(100);
      showToast({
        type: 'success',
        title: 'Tải tài liệu lên buổi học thành công',
        message: `Đã lưu tệp "${title}" vào tài nguyên buổi học.`,
      });

      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setUploadTitle('');
      setUploadDescription('');
      invalidateMaterials();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Quá trình tải lên thất bại',
        message: getApiErrorMessage(err),
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Tải file xuống qua presigned URL
  const handleDownload = async (material: ClassMaterialItem) => {
    if (downloadingId === material.id) return;
    setDownloadingId(material.id);

    try {
      const res = await teacherDocumentsService.getMaterialDownloadUrl(material.id);
      if (res?.downloadUrl) {
        // Mở URL ký tạm thời trong tab mới để tải về / xem
        const link = document.createElement('a');
        link.href = res.downloadUrl;
        link.target = '_blank';
        link.rel = 'noreferrer';
        link.download = res.originalName || material.title || 'document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error('Không nhận được liên kết tải từ máy chủ');
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Không thể lấy liên kết tải tài liệu',
        message: getApiErrorMessage(err),
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const materials = materialsData?.items || [];
  const filteredMaterials = materials.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.title.toLowerCase().includes(term) ||
      (item.originalName && item.originalName.toLowerCase().includes(term)) ||
      (item.description && item.description.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm tài liệu buổi học..."
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            className="text-xs"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Nút chia sẻ từ thư viện */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsShareModalOpen(true)}
            className="text-xs cursor-pointer"
            leftIcon={<FolderOpen className="w-4 h-4 text-amber-700" />}
          >
            Gắn từ thư viện
          </Button>

          {/* Nút upload file trực tiếp */}
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setIsUploadModalOpen(true)}
            className="text-xs bg-amber-800 hover:bg-amber-900 text-white cursor-pointer"
            leftIcon={<Upload className="w-4 h-4" />}
          >
            Tải lên tài liệu mới
          </Button>
        </div>
      </div>

      {/* Materials List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-6">
            <ErrorState
              title="Không thể tải danh sách tài liệu"
              message={getApiErrorMessage(error)}
              onRetry={() => refetch()}
            />
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title={searchTerm ? 'Không tìm thấy tài liệu phù hợp' : 'Buổi học chưa có tài liệu nào'}
              description={
                searchTerm
                  ? `Không có kết quả khớp với "${searchTerm}"`
                  : 'Giáo viên có thể tải lên tài liệu mới hoặc gắn tài liệu từ thư viện cá nhân.'
              }
              actionLabel="Tải lên tài liệu ngay"
              onAction={() => setIsUploadModalOpen(true)}
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredMaterials.map((mat) => {
              const isDownloading = downloadingId === mat.id;
              return (
                <div
                  key={mat.id}
                  className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-violet-50 text-violet-700 border border-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-sm text-slate-900 truncate">
                          {mat.title}
                        </h4>
                        <Badge className="bg-slate-100 text-slate-700 text-[10px]">
                          {mat.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}
                        </Badge>
                      </div>

                      {mat.description && (
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {mat.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                        <span>Dung lượng: {formatFileSize(mat.fileSize || mat.document?.sizeBytes)}</span>
                        <span>•</span>
                        <span>Ngày tạo: {formatDate(mat.createdAt)}</span>
                        {mat.originalName && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-xs">{mat.originalName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(mat)}
                      isLoading={isDownloading}
                      className="text-xs cursor-pointer text-slate-700 hover:text-amber-800"
                      leftIcon={<Download className="w-3.5 h-3.5" />}
                    >
                      Tải về
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTargetMaterial(mat)}
                      title="Gỡ tài liệu khỏi buổi học"
                      className="text-xs text-rose-600 hover:bg-rose-50 p-2 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Tải lên tài liệu mới trực tiếp */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => {
          if (!isUploading) {
            setIsUploadModalOpen(false);
            setSelectedFile(null);
            setUploadTitle('');
          }
        }}
        title="Tải tài liệu mới lên buổi học"
        description="Tải tài liệu bài giảng, đề cương hoặc bài tập trực tiếp vào buổi học trực tuyến."
        maxWidth="md"
      >
        <form onSubmit={handleDirectUpload} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Chọn tệp tin từ máy tính <span className="text-rose-500">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setSelectedFile(file);
                  if (!uploadTitle) {
                    setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
                  }
                }
              }}
              disabled={isUploading}
              className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-900 hover:file:bg-amber-100 cursor-pointer"
            />
            {selectedFile && (
              <p className="text-[11px] text-slate-500">
                Đã chọn: <strong className="text-slate-800">{selectedFile.name}</strong> ({formatFileSize(selectedFile.size)})
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Tiêu đề hiển thị <span className="text-rose-500">*</span>
            </label>
            <Input
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="Nhập tên tài liệu..."
              disabled={isUploading}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Mô tả ngắn
            </label>
            <textarea
              rows={2}
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              placeholder="Ghi chú về tài liệu này..."
              disabled={isUploading}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:border-amber-600 focus:outline-hidden"
            />
          </div>

          {isUploading && (
            <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                  Đang tải lên lưu trữ an toàn...
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-700 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsUploadModalOpen(false)}
              disabled={isUploading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isUploading}
              disabled={!selectedFile}
              leftIcon={<Upload className="w-4 h-4" />}
            >
              Tải lên tài liệu
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Chia sẻ từ thư viện tài liệu cá nhân */}
      <Modal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="Gắn tài liệu từ thư viện của bạn"
        description="Chọn tài liệu bạn đã tải lên hệ thống để cấp quyền cho buổi học này mà không cần tải lại file."
        maxWidth="lg"
      >
        <div className="space-y-4">
          <Input
            value={librarySearchTerm}
            onChange={(e) => setLibrarySearchTerm(e.target.value)}
            placeholder="Tìm tài liệu trong thư viện cá nhân..."
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            className="text-xs"
          />

          <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
            {isLoadingLibrary ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : !libraryDocsData?.items || libraryDocsData.items.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                Không tìm thấy tài liệu nào trong thư viện của bạn.
              </div>
            ) : (
              libraryDocsData.items.map((doc: DocumentItem) => {
                const isSelected = selectedDocId === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setSelectedDocId(doc.id);
                      setShareTitle(doc.title);
                    }}
                    className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-amber-50/80 border-l-4 border-amber-800' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-800' : 'text-slate-400'}`} />
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold truncate ${isSelected ? 'text-amber-950' : 'text-slate-900'}`}>
                          {doc.title}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {doc.originalName} ({formatFileSize(doc.sizeBytes)})
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <CheckCircle className="w-4 h-4 text-amber-800 shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {selectedDocId && (
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Tên hiển thị trong buổi học (tùy chọn)
              </label>
              <Input
                value={shareTitle}
                onChange={(e) => setShareTitle(e.target.value)}
                placeholder="Để trống nếu muốn giữ nguyên tên gốc"
                className="text-xs"
              />
            </div>
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
              disabled={!selectedDocId}
              isLoading={shareMutation.isPending}
              onClick={() => {
                if (selectedDocId) {
                  shareMutation.mutate({
                    documentId: selectedDocId,
                    title: shareTitle.trim() || undefined,
                  });
                }
              }}
              leftIcon={<Share2 className="w-4 h-4" />}
            >
              Gắn vào buổi học
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal xác nhận gỡ tài liệu */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetMaterial)}
        onClose={() => setDeleteTargetMaterial(null)}
        onConfirm={() => {
          if (deleteTargetMaterial) {
            deleteMutation.mutate(deleteTargetMaterial.id);
          }
        }}
        title="Gỡ tài liệu khỏi buổi học"
        description={
          deleteTargetMaterial ? (
            <p className="text-xs text-slate-600">
              Bạn có chắc chắn muốn gỡ tài liệu <strong>"{deleteTargetMaterial.title}"</strong> khỏi buổi học này?
              Học sinh sẽ không còn nhìn thấy tệp tin này trong danh sách tài liệu buổi học nữa.
            </p>
          ) : null
        }
        confirmLabel="Gỡ tài liệu"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
