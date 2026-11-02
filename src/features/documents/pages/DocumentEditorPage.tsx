import { useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Save,
  Clock,
  History,
  Download,
  CheckCircle2,
  AlertCircle,
  WifiOff,
  Loader2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useToast } from '@/hooks/useToast';
import { getApiErrorMessage } from '@/lib/api-client';

import { teacherDocumentsService } from '../services/documents.service';
import type { DocumentEntity, DocumentStatus } from '../types/document.types';
import { DocumentEditor, type DocumentEditorRef } from '../components/editor/DocumentEditor';
import { useDocumentAutosave } from '../hooks/useDocumentAutosave';
import { VersionHistoryDrawer } from '../components/editor/VersionHistoryDrawer';
import { ExportModal } from '../components/editor/ExportModal';
import { ConflictResolutionModal } from '../components/editor/ConflictResolutionModal';

function isValidTiptapDoc(content: unknown): content is Record<string, unknown> {
  return (
    typeof content === 'object' &&
    content !== null &&
    'type' in content &&
    (content as Record<string, unknown>).type === 'doc' &&
    'content' in content &&
    Array.isArray((content as Record<string, unknown>).content)
  );
}

export function DocumentEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { success, error: toastError, info } = useToast();

  const isNew = !id || id === 'new';
  const editorRef = useRef<DocumentEditorRef | null>(null);

  // Determine back path based on route
  const backPath = location.pathname.startsWith('/admin')
    ? '/admin/documents'
    : '/teacher/documents';

  // New Document Setup State
  const [newTitle, setNewTitle] = useState('Tài liệu mới');
  const [editedTitle, setEditedTitle] = useState<string | null>(null);
  const newStatus: DocumentStatus = 'DRAFT';

  // Drawer / Modals State
  const [isVersionDrawerOpen, setIsVersionDrawerOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // 1. Fetch document detail
  const {
    data: documentData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['document-detail', id],
    queryFn: () => teacherDocumentsService.getDocument(id!),
    enabled: !isNew && Boolean(id),
    staleTime: 0, // Always get fresh revision from server on mount
  });

  const isDocContentValid = isValidTiptapDoc(documentData?.content);
  const isAutosaveEnabled = !isNew && Boolean(id) && isDocContentValid;

  // 2. Setup OCC Autosave hook
  const {
    saveStatus,
    currentRevision,
    lastSavedAt,
    errorMessage: saveErrorMessage,
    conflictData,
    isDirty,
    hasLocalDraft,
    triggerSave,
    saveImmediate,
    resolveConflictWithServer,
    resolveConflictWithLocal,
    getLocalDraft,
    dismissLocalDraft,
  } = useDocumentAutosave({
    documentId: id || '',
    initialRevision: documentData?.revision ?? 1,
    initialContent: isDocContentValid ? (documentData!.content as Record<string, unknown>) : undefined,
    debounceMs: 1000,
    enabled: isAutosaveEnabled,
    onRevisionUpdate: (newRev) => {
      queryClient.setQueryData<DocumentEntity>(['document-detail', id], (old) =>
        old ? { ...old, revision: newRev } : old,
      );
    },
    onSaveSuccess: (newRev, updatedAt) => {
      queryClient.setQueryData<DocumentEntity>(['document-detail', id], (old) =>
        old ? { ...old, revision: newRev, updatedAt } : old,
      );
    },
  });

  // 3. Mutation for creating a new document
  const createMutation = useMutation({
    mutationFn: () =>
      teacherDocumentsService.createDocument({
        title: newTitle.trim() || 'Tài liệu mới',
        status: newStatus,
        content: editorRef.current?.getJSON() || undefined,
      }),
    onSuccess: (data) => {
      success('Khởi tạo tài liệu thành công');
      queryClient.invalidateQueries({ queryKey: ['teacher-documents'] });
      // Redirect to edit route for the created document
      const targetPath = location.pathname.startsWith('/admin')
        ? `/admin/documents/${data.document.id}/edit`
        : `/teacher/documents/${data.document.id}/edit`;
      navigate(targetPath, { replace: true });
    },
    onError: (err: unknown) => {
      toastError(getApiErrorMessage(err), 'Lỗi tạo tài liệu');
    },
  });

  // 4. Update title/status metadata mutation
  const updateMetadataMutation = useMutation({
    mutationFn: (dto: { title?: string; status?: DocumentStatus }) =>
      teacherDocumentsService.updateDocument(id!, dto),
    onSuccess: (data) => {
      queryClient.setQueryData<DocumentEntity>(['document-detail', id], (old) =>
        old
          ? {
              ...old,
              title: data.document.title,
              status: (data.document.status as DocumentStatus) || old.status,
            }
          : old,
      );
      setEditedTitle(null);
      success('Cập nhật thông tin thành công');
      queryClient.invalidateQueries({ queryKey: ['teacher-documents'] });
    },
    onError: (err: unknown) => {
      toastError(getApiErrorMessage(err), 'Lỗi cập nhật');
    },
  });

  // Handle Editor Content Change
  const handleEditorUpdate = (content: Record<string, unknown>) => {
    if (!isNew && id && isAutosaveEnabled) {
      triggerSave(content);
    }
  };

  // Restore local draft prompt
  const handleRecoverLocalDraft = () => {
    const draft = getLocalDraft();
    if (draft && draft.content && editorRef.current) {
      editorRef.current.setJSON(draft.content);
      triggerSave(draft.content, 'Khôi phục từ bản nháp thiết bị');
      info('Đã khôi phục nội dung từ bản nháp trên thiết bị của bạn');
    }
    dismissLocalDraft();
  };

  // Conflict handling actions
  const handleReloadServer = async () => {
    try {
      const freshDoc = await teacherDocumentsService.getDocument(id!);
      queryClient.setQueryData(['document-detail', id], freshDoc);
      if (freshDoc.content && editorRef.current) {
        editorRef.current.setJSON(freshDoc.content);
      }
      resolveConflictWithServer(freshDoc.revision ?? 1);
      success('Đã tải phiên bản mới nhất từ máy chủ');
    } catch (err: unknown) {
      toastError(getApiErrorMessage(err), 'Không thể tải phiên bản máy chủ');
    }
  };

  const handleKeepLocal = () => {
    if (conflictData?.serverRevision) {
      resolveConflictWithLocal(conflictData.serverRevision);
    }
  };

  // Safe navigation back
  const handleBack = () => {
    if (isDirty) {
      const confirmLeave = window.confirm(
        'Bạn có các thay đổi chưa được lưu lên máy chủ. Bạn có chắc chắn muốn rời đi không?',
      );
      if (!confirmLeave) return;
    }
    navigate(backPath);
  };

  // ===== CÁC TRẠNG THÁI LOADING / LỖI ĐỘC LẬP CHO TÀI LIỆU CŨ =====
  if (!isNew && isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        <div className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="flex-1 flex justify-center py-8 px-4">
          <div className="w-full max-w-4xl min-h-[800px] bg-white rounded-2xl p-12 space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // 1. Lỗi API hoặc không tìm thấy tài liệu
  if (!isNew && (isError || !documentData)) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <ErrorState
          title="Không thể tải nội dung tài liệu"
          message={getApiErrorMessage(error) || 'Tài liệu không tồn tại hoặc bạn không có quyền truy cập.'}
          onRetry={() => refetch()}
        />
        <div className="mt-4 text-center">
          <Button variant="outline" onClick={() => navigate(backPath)}>
            Quay lại thư viện
          </Button>
        </div>
      </div>
    );
  }

  // 2. Nội dung tài liệu là null (lỗi đọc R2 hoặc chưa có file nội dung)
  if (!isNew && documentData && documentData.content == null) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <ErrorState
          title="Không thể tải nội dung văn bản"
          message="Tài liệu này chưa có nội dung hoặc không thể tải nội dung từ hệ thống lưu trữ Cloudflare R2. Để bảo vệ dữ liệu gốc và tránh ghi đè nội dung rỗng, chức năng chỉnh sửa đã bị khóa."
          onRetry={() => refetch()}
        />
        <div className="mt-4 text-center">
          <Button variant="outline" onClick={() => navigate(backPath)}>
            Quay lại thư viện
          </Button>
        </div>
      </div>
    );
  }

  // 3. Nội dung tài liệu không đúng định dạng Tiptap JSON schema
  if (!isNew && documentData && !isDocContentValid) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <ErrorState
          title="Định dạng dữ liệu không hợp lệ"
          message="Nội dung tài liệu không tuân thủ cấu trúc Tiptap JSON schema chuẩn (phải có type là 'doc' và mảng 'content'). Chức năng chỉnh sửa tạm dừng để tránh làm hỏng tệp."
          onRetry={() => refetch()}
        />
        <div className="mt-4 text-center">
          <Button variant="outline" onClick={() => navigate(backPath)}>
            Quay lại thư viện
          </Button>
        </div>
      </div>
    );
  }

  const documentTitle = editedTitle ?? documentData?.title ?? '';

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-30 h-14 bg-white border-b border-slate-200/90 px-3 sm:px-6 flex items-center justify-between gap-3 shadow-2xs">
        {/* Left: Back button & Document Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={handleBack}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            title="Quay lại thư viện tài liệu"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="min-w-0 flex-1 flex items-center gap-2">
            {isNew ? (
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Nhập tiêu đề tài liệu mới..."
                className="font-bold text-slate-900 text-sm sm:text-base px-2 py-1 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 w-full max-w-md"
              />
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <input
                  type="text"
                  value={documentTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={() => {
                    const val = (editedTitle ?? '').trim();
                    if (val && val !== documentData?.title) {
                      updateMetadataMutation.mutate({ title: val });
                    } else {
                      setEditedTitle(null);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  className="font-bold text-slate-900 text-sm sm:text-base hover:bg-slate-50 focus:bg-white px-2 py-1 rounded-lg border border-transparent hover:border-slate-300 focus:border-amber-500 focus:outline-none transition-all truncate max-w-sm sm:max-w-md"
                  title="Nhấp để sửa tiêu đề (Enter để lưu)"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right: Autosave Status & Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {!isNew && (
            <>
              {/* Autosave Status Pill */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border">
                {saveStatus === 'saving' && (
                  <span className="text-amber-700 border-amber-200 bg-amber-50 flex items-center gap-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang lưu...</span>
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="text-emerald-700 border-emerald-200 bg-emerald-50 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      Đã lưu{' '}
                      {lastSavedAt
                        ? lastSavedAt.toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </span>
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span
                    className="text-rose-700 border-rose-200 bg-rose-50 flex items-center gap-1 cursor-pointer"
                    onClick={() => saveImmediate()}
                    title={saveErrorMessage || 'Lỗi lưu dữ liệu. Bấm để thử lại.'}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Lỗi lưu (Thử lại)</span>
                  </span>
                )}
                {saveStatus === 'offline' && (
                  <span className="text-slate-600 border-slate-200 bg-slate-100 flex items-center gap-1">
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>Mất mạng</span>
                  </span>
                )}
                {saveStatus === 'conflict' && (
                  <span className="text-rose-800 border-rose-300 bg-rose-100 flex items-center gap-1 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                    <span>Xung đột phiên bản!</span>
                  </span>
                )}
                {saveStatus === 'idle' && (
                  <span className="text-slate-500 border-slate-200 bg-slate-50 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Sẵn sàng</span>
                  </span>
                )}
              </div>

              {/* Version History Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsVersionDrawerOpen(true)}
                leftIcon={<History className="w-4 h-4 text-amber-700" />}
                title="Lịch sử phiên bản"
                className="text-xs"
              >
                <span className="hidden md:inline">Lịch sử</span>
              </Button>

              {/* Export Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExportModalOpen(true)}
                leftIcon={<Download className="w-4 h-4 text-blue-700" />}
                title="Xuất file DOCX / PDF"
                className="text-xs"
              >
                <span className="hidden md:inline">Xuất tệp</span>
              </Button>

              {/* Immediate Save Button */}
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const json = editorRef.current?.getJSON() || (documentData?.content as Record<string, unknown>);
                  if (json && isValidTiptapDoc(json)) {
                    void saveImmediate('Lưu mốc thủ công', json);
                  }
                }}
                disabled={saveStatus === 'saving' || !isAutosaveEnabled}
                leftIcon={<Save className="w-4 h-4" />}
                className="bg-amber-700 hover:bg-amber-800 text-white text-xs"
              >
                <span>Lưu</span>
              </Button>
            </>
          )}

          {isNew && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !newTitle.trim()}
              leftIcon={createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              className="bg-amber-700 hover:bg-amber-800 text-white"
            >
              {createMutation.isPending ? 'Đang tạo...' : 'Khởi tạo tài liệu'}
            </Button>
          )}
        </div>
      </header>

      {/* Local Draft Recovery Notification */}
      {hasLocalDraft && !isNew && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-900 gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              Phát hiện bản nháp chưa lưu trên thiết bị của bạn. Bạn có muốn khôi phục lại không?
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={handleRecoverLocalDraft} leftIcon={<RotateCcw className="w-3.5 h-3.5" />}>
              Khôi phục bản nháp
            </Button>
            <Button size="sm" variant="ghost" onClick={dismissLocalDraft}>
              Bỏ qua
            </Button>
          </div>
        </div>
      )}

      {/* Main Document Paper Workspace: Chỉ mount khi đã có initialContent hợp lệ */}
      <main className="flex-1 flex flex-col">
        <DocumentEditor
          key={id || 'new'}
          ref={editorRef}
          initialContent={isNew ? null : (documentData!.content as Record<string, unknown>)}
          onUpdate={handleEditorUpdate}
          editable={true}
        />
      </main>

      {/* Drawers & Modals */}
      {!isNew && id && (
        <>
          <VersionHistoryDrawer
            isOpen={isVersionDrawerOpen}
            onClose={() => setIsVersionDrawerOpen(false)}
            documentId={id}
            currentRevision={currentRevision}
            onRestoreSuccess={(newDoc, newRev) => {
              queryClient.setQueryData(['document-detail', id], newDoc);
              if (newDoc.content && editorRef.current) {
                editorRef.current.setJSON(newDoc.content);
              }
              resolveConflictWithServer(newRev);
              success(`Đã khôi phục thành công (rev ${newRev})`);
            }}
          />

          <ExportModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            documentId={id}
            documentTitle={documentData?.title || 'Tài liệu'}
            currentRevision={currentRevision}
          />

          <ConflictResolutionModal
            isOpen={saveStatus === 'conflict'}
            serverRevision={conflictData?.serverRevision ?? null}
            expectedRevision={conflictData?.expectedRevision ?? currentRevision}
            onReloadServer={handleReloadServer}
            onKeepLocal={handleKeepLocal}
            getLocalText={() => editorRef.current?.getText() || ''}
          />
        </>
      )}
    </div>
  );
}
