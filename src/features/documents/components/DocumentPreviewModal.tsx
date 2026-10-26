import { useState, useEffect } from 'react';
import {
  Download,
  ExternalLink,
  FileText,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { formatBytes, formatDateTime } from '@/utils/formatters';
import { teacherDocumentsService } from '../services/documents.service';
import type {
  DocumentItem,
  DocumentDownloadUrlResponse,
  DocumentEntity,
} from '../types/document.types';
import { DocumentEditor } from './editor/DocumentEditor';
import { ExportModal } from './editor/ExportModal';

import { getApiErrorMessage } from '@/lib/api-client';

export interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  fetchUrlFn?: (id: string) => Promise<DocumentDownloadUrlResponse>;
}

export function DocumentPreviewModal({
  isOpen,
  onClose,
  document,
  fetchUrlFn,
}: DocumentPreviewModalProps) {
  const [downloadData, setDownloadData] =
    useState<DocumentDownloadUrlResponse | null>(null);
  const [structuredDoc, setStructuredDoc] = useState<DocumentEntity | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const isStructured =
    document?.type === 'STRUCTURED_NOTE' ||
    document?.mimeType === 'application/vnd.tiptap+json';

  const fetchDocumentData = async (docId: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (isStructured) {
        const fullDoc = await teacherDocumentsService.getDocument(docId);
        setStructuredDoc(fullDoc);
      } else {
        const data = fetchUrlFn
          ? await fetchUrlFn(docId)
          : await teacherDocumentsService.getDownloadUrl(docId);
        setDownloadData(data);
      }
    } catch (err: unknown) {
      setErrorMsg(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && document) {
      setDownloadData(null);
      setStructuredDoc(null);
      fetchDocumentData(document.id);
    } else {
      setDownloadData(null);
      setStructuredDoc(null);
      setErrorMsg(null);
    }
  }, [isOpen, document?.id]);

  if (!document) return null;

  const isPdf =
    document.mimeType === 'application/pdf' ||
    (document.originalName && document.originalName.toLowerCase().endsWith('.pdf'));

  const isImage =
    document.mimeType.startsWith('image/') ||
    (document.originalName && /\.(jpg|jpeg|png|webp|gif)$/i.test(document.originalName));

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={document.title}
        description={
          isStructured
            ? `Tài liệu soạn thảo có cấu trúc • rev ${structuredDoc?.revision || document.revision || 1}`
            : `Tệp gốc: ${document.originalName || 'file'} • ${formatBytes(document.sizeBytes)}`
        }
        maxWidth={isStructured ? '2xl' : 'xl'}
      >
        <div className="space-y-4">
          {/* Description if present */}
          {document.description && (
            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
              {document.description}
            </p>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin text-amber-700" />
              <p className="text-xs">
                {isStructured
                  ? 'Đang tải nội dung tài liệu...'
                  : 'Đang tạo liên kết xem tài liệu bảo mật...'}
              </p>
            </div>
          )}

          {/* Error state */}
          {errorMsg && !isLoading && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Không thể tải tài liệu</span>
              </div>
              <p>{errorMsg}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchDocumentData(document.id)}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Thử lại
              </Button>
            </div>
          )}

          {/* Structured Document Content View */}
          {!isLoading && isStructured && structuredDoc && (
            <div className="space-y-3">
              <div className="max-h-[68vh] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2 sm:p-4">
                <DocumentEditor
                  initialContent={structuredDoc.content}
                  editable={false}
                  className="bg-transparent min-h-0"
                />
              </div>

              {/* Action Bar for Structured Document */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span>Cập nhật lần cuối: {formatDateTime(structuredDoc.updatedAt)}</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsExportOpen(true)}
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                    className="bg-amber-700 hover:bg-amber-800 text-white"
                  >
                    Xuất file DOCX / PDF
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Static File Viewer */}
          {!isLoading && !isStructured && downloadData && (
            <div className="space-y-3">
              {isPdf ? (
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                  <iframe
                    src={`${downloadData.downloadUrl}#toolbar=1`}
                    title={document.title}
                    className="w-full h-[65vh] border-0"
                  />
                </div>
              ) : isImage ? (
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900/5 p-4 flex items-center justify-center">
                  <img
                    src={downloadData.downloadUrl}
                    alt={document.title}
                    className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-xs"
                  />
                </div>
              ) : (
                <div className="p-8 text-center rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">
                      {document.originalName || document.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Định dạng này ({document.mimeType}) không hỗ trợ xem trực tiếp trong trình duyệt. Bạn có thể tải file về máy tính để mở bằng ứng dụng phù hợp (Word, PowerPoint, Excel...).
                    </p>
                  </div>
                  <div className="pt-2">
                    <a
                      href={downloadData.downloadUrl}
                      download={document.originalName || 'file'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center font-medium rounded-lg text-sm px-4 py-2 bg-amber-700 text-white hover:bg-amber-800 gap-2 shadow-xs cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Tải tệp tin về máy</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Metadata Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span>Được tải lên: {formatDateTime(document.createdAt)}</span>
                <div className="flex items-center gap-2">
                  <a
                    href={downloadData.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Mở tab mới</span>
                  </a>
                  <a
                    href={downloadData.downloadUrl}
                    download={document.originalName || 'file'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-700 text-white hover:bg-amber-800 font-medium transition-colors shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải về</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Export Modal if user wants to export structured document */}
      {isStructured && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          documentId={document.id}
          documentTitle={document.title}
          currentRevision={structuredDoc?.revision || document.revision || 1}
        />
      )}
    </>
  );
}
