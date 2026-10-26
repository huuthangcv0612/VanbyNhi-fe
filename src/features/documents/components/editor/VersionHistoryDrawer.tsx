import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { History, RotateCcw, X, Clock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import { ConfirmModal } from '@/features/classes/components/ConfirmModal';
import { formatDateTime } from '@/utils/formatters';
import { teacherDocumentsService } from '../../services/documents.service';
import type { DocumentEntity, DocumentVersionEntity } from '../../types/document.types';
import { getApiErrorMessage } from '@/lib/api-client';

export interface VersionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  currentRevision: number;
  onRestoreSuccess: (newDocument: DocumentEntity, newRevision: number) => void;
}

export function VersionHistoryDrawer({
  isOpen,
  onClose,
  documentId,
  currentRevision,
  onRestoreSuccess,
}: VersionHistoryDrawerProps) {
  const [page, setPage] = useState(1);
  const [versionToRestore, setVersionToRestore] = useState<DocumentVersionEntity | null>(null);

  const {
    data: versionsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['document-versions', documentId, page],
    queryFn: () => teacherDocumentsService.getVersions(documentId, { page, limit: 10 }),
    enabled: isOpen && Boolean(documentId),
  });

  const restoreMutation = useMutation({
    mutationFn: (versionId: string) =>
      teacherDocumentsService.restoreVersion(documentId, versionId),
    onSuccess: (data) => {
      onRestoreSuccess(data.document, data.revision);
      setVersionToRestore(null);
      onClose();
    },
  });

  if (!isOpen) return null;

  const versions = versionsData?.items || [];
  const pagination = versionsData?.pagination;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Lịch sử phiên bản
              </h3>
              <p className="text-xs text-slate-500">
                Phiên bản hiện tại: <span className="font-mono font-bold text-amber-800">rev {currentRevision}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-3 border border-slate-200 rounded-xl space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-2 text-center">
              <AlertCircle className="w-5 h-5 mx-auto text-rose-600" />
              <p>{getApiErrorMessage(error)}</p>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                Thử lại
              </Button>
            </div>
          ) : versions.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Chưa có mốc phiên bản nào được lưu cho tài liệu này.
            </div>
          ) : (
            versions.map((ver) => {
              const isCurrent = ver.revision === currentRevision;
              return (
                <div
                  key={ver.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isCurrent
                      ? 'border-amber-400 bg-amber-50/40 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          rev {ver.revision}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-amber-700" />
                            Hiện tại
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 font-medium mt-1.5">
                        {ver.reason || 'Lưu tự động hoặc định kỳ'}
                      </p>
                    </div>

                    {!isCurrent && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setVersionToRestore(ver)}
                        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                        className="text-xs shrink-0"
                      >
                        Khôi phục
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-3 pt-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(ver.createdAt)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {ver.actor.fullName}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-center">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>

      {/* Confirmation Modal before Restore */}
      <ConfirmModal
        isOpen={Boolean(versionToRestore)}
        title="Khôi phục phiên bản lịch sử?"
        description={`Hệ thống sẽ lấy lại toàn bộ nội dung của phiên bản revision ${versionToRestore?.revision} và tạo thành một revision mới tiếp theo. Các thay đổi chưa lưu sẽ được thay thế.`}
        confirmLabel="Xác nhận khôi phục"
        variant="primary"
        isLoading={restoreMutation.isPending}
        onClose={() => setVersionToRestore(null)}
        onConfirm={() => {
          if (versionToRestore) {
            restoreMutation.mutate(versionToRestore.id);
          }
        }}
      />
    </>
  );
}
