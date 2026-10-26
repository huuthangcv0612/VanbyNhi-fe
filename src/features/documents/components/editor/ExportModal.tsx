import { useState, useEffect, useRef } from 'react';
import { Download, FileText, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { teacherDocumentsService } from '../../services/documents.service';
import type { DocumentExportFormat, DocumentExportStatus } from '../../types/document.types';
import { getApiErrorMessage } from '@/lib/api-client';

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  currentRevision: number;
  pollIntervalMs?: number;
}

export function ExportModal({
  isOpen,
  onClose,
  documentId,
  documentTitle,
  currentRevision,
  pollIntervalMs = 1500,
}: ExportModalProps) {
  const [format, setFormat] = useState<DocumentExportFormat>('PDF');
  const [status, setStatus] = useState<DocumentExportStatus | 'idle'>('idle');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState<string>('');

  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setDownloadUrl(null);
      setErrorMessage(null);
      setProgressMsg('');
      attemptsRef.current = 0;
    } else {
      if (pollingTimerRef.current) {
        clearTimeout(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    }
  }, [isOpen]);

  const pollJobStatus = async (jobId: string) => {
    attemptsRef.current += 1;
    if (attemptsRef.current > 20) {
      setStatus('FAILED');
      setErrorMessage('Quá trình xuất tệp quá thời gian chờ (timeout). Vui lòng thử lại sau.');
      return;
    }

    try {
      const res = await teacherDocumentsService.getExportStatus(documentId, jobId);
      if (res.status === 'COMPLETED' && res.downloadUrl) {
        setStatus('COMPLETED');
        setDownloadUrl(res.downloadUrl);
        setProgressMsg('Xuất tài liệu hoàn tất!');
        // Trigger direct download
        window.open(res.downloadUrl, '_blank', 'noopener,noreferrer');
      } else if (res.status === 'FAILED') {
        setStatus('FAILED');
        setErrorMessage(res.errorMessage || 'Quá trình kết xuất tài liệu thất bại.');
      } else {
        // Still PENDING or PROCESSING
        setStatus(res.status);
        setProgressMsg(
          res.status === 'PROCESSING'
            ? `Đang biên dịch tệp ${format}... (Lần thử ${attemptsRef.current})`
            : 'Đang xếp hàng kết xuất...',
        );
        pollingTimerRef.current = setTimeout(() => {
          void pollJobStatus(jobId);
        }, pollIntervalMs);
      }
    } catch (err: unknown) {
      setStatus('FAILED');
      setErrorMessage(getApiErrorMessage(err));
    }
  };

  const handleStartExport = async () => {
    setStatus('PENDING');
    setErrorMessage(null);
    setProgressMsg(`Đang khởi tạo yêu cầu xuất tệp ${format}...`);
    attemptsRef.current = 0;

    try {
      const res = await teacherDocumentsService.exportDocument(documentId, { format });
      if (res.status === 'COMPLETED' && res.downloadUrl) {
        setStatus('COMPLETED');
        setDownloadUrl(res.downloadUrl);
        setProgressMsg('Đã sẵn sàng tải xuống!');
        window.open(res.downloadUrl, '_blank', 'noopener,noreferrer');
      } else if (res.status === 'FAILED') {
        setStatus('FAILED');
        setErrorMessage(res.errorMessage || 'Xuất tài liệu thất bại.');
      } else {
        // Asynchronous processing
        setStatus(res.status);
        pollingTimerRef.current = setTimeout(() => {
          void pollJobStatus(res.jobId);
        }, pollIntervalMs);
      }
    } catch (err: unknown) {
      setStatus('FAILED');
      setErrorMessage(getApiErrorMessage(err));
    }
  };

  const isBusy = status === 'PENDING' || status === 'PROCESSING';

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isBusy) onClose();
      }}
      title="Xuất bản tài liệu (Export Document)"
      description={`Tài liệu: ${documentTitle} (revision ${currentRevision})`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {errorMessage && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Format Selection */}
        {status === 'idle' && (
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-700">
              Chọn định dạng tệp muốn xuất:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('PDF')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  format === 'PDF'
                    ? 'border-rose-500 bg-rose-50/50 shadow-xs ring-2 ring-rose-300'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                    PDF
                  </span>
                  <FileText className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Adobe PDF (.pdf)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Định dạng chuẩn in ấn, khóa bố cục bài giảng và đề thi
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('DOCX')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  format === 'DOCX'
                    ? 'border-blue-500 bg-blue-50/50 shadow-xs ring-2 ring-blue-300'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    WORD
                  </span>
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Microsoft Word (.docx)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Cho phép mở và tiếp tục chỉnh sửa bằng Word trên máy tính
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Progress & Processing State */}
        {isBusy && (
          <div className="p-8 text-center rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <Loader2 className="w-8 h-8 text-amber-700 animate-spin mx-auto" />
            <div>
              <p className="text-sm font-semibold text-slate-800">{progressMsg}</p>
              <p className="text-xs text-slate-500 mt-1">
                Máy chủ đang kết xuất văn bản từ revision {currentRevision} và lưu trữ bảo mật lên Cloudflare R2...
              </p>
            </div>
          </div>
        )}

        {/* Completed State */}
        {status === 'COMPLETED' && downloadUrl && (
          <div className="p-6 text-center rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <div>
              <p className="text-sm font-bold text-emerald-900">
                Xuất tệp {format} thành công!
              </p>
              <p className="text-xs text-emerald-700 mt-1">
                Liên kết tải về an toàn có hiệu lực trong 5 phút. Nếu trình duyệt không tự động tải, hãy bấm nút bên dưới.
              </p>
            </div>
            <div className="pt-2">
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Tải tệp {format} về máy</span>
              </a>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-2">
          {status === 'idle' ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={handleStartExport}
                leftIcon={<Download className="w-4 h-4" />}
                className="bg-amber-700 hover:bg-amber-800 text-white"
              >
                Bắt đầu xuất tệp
              </Button>
            </>
          ) : status === 'FAILED' ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Đóng
              </Button>
              <Button
                variant="primary"
                onClick={handleStartExport}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Thử lại
              </Button>
            </>
          ) : status === 'COMPLETED' ? (
            <Button variant="outline" onClick={onClose}>
              Hoàn tất
            </Button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
