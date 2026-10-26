import { useState } from 'react';
import { AlertTriangle, RefreshCw, ArrowUpCircle, Copy, Check } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

export interface ConflictResolutionModalProps {
  isOpen: boolean;
  serverRevision: number | null;
  expectedRevision: number;
  onReloadServer: () => void;
  onKeepLocal: () => void;
  getLocalText: () => string;
}

export function ConflictResolutionModal({
  isOpen,
  serverRevision,
  expectedRevision,
  onReloadServer,
  onKeepLocal,
  getLocalText,
}: ConflictResolutionModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    try {
      const text = getLocalText();
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        // Prevent accidental closing without resolution
      }}
      title="Xung đột phiên bản tài liệu (Revision Conflict)"
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs sm:text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-900">
              Tài liệu đã được cập nhật bởi một phiên làm việc khác!
            </p>
            <p className="text-slate-700 text-xs leading-relaxed">
              Phiên bản trên máy của bạn đang ở <strong className="font-mono">rev {expectedRevision}</strong>, 
              trong khi máy chủ đã có phiên bản mới hơn{' '}
              <strong className="font-mono">{serverRevision ? `rev ${serverRevision}` : 'mới hơn'}</strong>.
              Hệ thống đã tự động bảo vệ dữ liệu để không làm mất các thay đổi của bạn.
            </p>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <p className="text-xs font-semibold text-slate-700">Khuyến nghị:</p>
          <p className="text-xs text-slate-600">
            Bạn có thể sao chép nội dung vừa soạn thảo vào khay nhớ tạm (clipboard) trước khi quyết định chọn phương án giải quyết:
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            leftIcon={copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            className="w-full text-xs"
          >
            {copied ? 'Đã sao chép văn bản vào clipboard!' : 'Sao chép văn bản đang soạn vào Clipboard'}
          </Button>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
          <Button
            variant="outline"
            onClick={onReloadServer}
            leftIcon={<RefreshCw className="w-4 h-4 text-slate-600" />}
            className="text-xs sm:text-sm"
          >
            Tải bản mới từ máy chủ
          </Button>
          <Button
            variant="primary"
            onClick={onKeepLocal}
            leftIcon={<ArrowUpCircle className="w-4 h-4" />}
            className="bg-amber-700 hover:bg-amber-800 text-white text-xs sm:text-sm"
          >
            Ghi đè bản của tôi lên máy chủ
          </Button>
        </div>
      </div>
    </Modal>
  );
}
