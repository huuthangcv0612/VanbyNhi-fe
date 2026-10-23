import { useState } from 'react';
import {
  FileText,
  FileCode,
  FileArchive,
  Image as ImageIcon,
  Download,
  AlertTriangle,
  Bookmark,
  Loader2,
} from 'lucide-react';
import type { AttachmentItem } from '../types/assignment.types';
import { formatBytes } from '../utils/assignment.utils';
import { assignmentsService } from '../services/assignments.service';
import { useToast } from '@/hooks/useToast';
import { getApiErrorMessage } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

interface AttachmentListProps {
  attachments?: AttachmentItem[];
  canToggleKeepForever?: boolean;
  onToggleKeepForever?: (attachmentId: string, isKeepForever: boolean) => Promise<void> | void;
  title?: string;
  className?: string;
}

export function AttachmentList({
  attachments,
  canToggleKeepForever = false,
  onToggleKeepForever,
  title = 'Tệp đính kèm',
  className,
}: AttachmentListProps) {
  const { showToast } = useToast();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [cleanedIds, setCleanedIds] = useState<Set<string>>(new Set());

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5 text-sky-500" />;
    }
    if (mimeType.includes('zip') || mimeType.includes('compressed')) {
      return <FileArchive className="w-5 h-5 text-amber-500" />;
    }
    if (mimeType.includes('pdf')) {
      return <FileText className="w-5 h-5 text-rose-500" />;
    }
    if (mimeType.includes('word') || mimeType.includes('officedocument')) {
      return <FileText className="w-5 h-5 text-blue-500" />;
    }
    return <FileCode className="w-5 h-5 text-slate-500" />;
  };

  const handleDownload = async (att: AttachmentItem) => {
    // Nếu tệp đã bị dọn dẹp hoặc từng báo lỗi dọn dẹp
    if (att.cleanupStatus === 'CLEANED' || cleanedIds.has(att.id)) {
      showToast({
        type: 'warning',
        message: 'Tệp đính kèm đã hết hạn lưu trữ và được dọn dẹp theo chính sách hệ thống',
      });
      return;
    }

    try {
      setDownloadingId(att.id);
      const res = await assignmentsService.getAttachmentDownloadUrl(att.id);

      // Mở liên kết tải về an toàn
      const link = document.createElement('a');
      link.href = res.downloadUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = res.originalName || att.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: unknown) {
      const errorMsg = getApiErrorMessage(err);
      if (
        errorMsg.includes('hết hạn lưu trữ') ||
        errorMsg.includes('dọn dẹp') ||
        errorMsg.includes('chính sách')
      ) {
        setCleanedIds((prev) => new Set(prev).add(att.id));
        showToast({
          type: 'warning',
          message: 'Tệp đính kèm đã hết hạn lưu trữ và được dọn dẹp theo chính sách hệ thống',
        });
      } else {
        showToast({
          type: 'error',
          message: errorMsg,
        });
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const handleToggleKeep = async (att: AttachmentItem) => {
    if (!onToggleKeepForever) return;
    try {
      setTogglingId(att.id);
      await onToggleKeepForever(att.id, !att.isKeepForever);
    } catch (err: unknown) {
      showToast({
        type: 'error',
        message: getApiErrorMessage(err),
      });
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className={cn('space-y-2.5', className)}>
      {title && <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{title}</h4>}
      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
        {attachments.map((att) => {
          const isCleaned = att.cleanupStatus === 'CLEANED' || cleanedIds.has(att.id);
          const isDownloading = downloadingId === att.id;
          const isToggling = togglingId === att.id;

          return (
            <div
              key={att.id}
              className="flex items-center justify-between p-3 hover:bg-slate-50/70 transition-colors gap-3"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 shrink-0">
                  {getFileIcon(att.mimeType)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900 truncate" title={att.originalName}>
                      {att.originalName}
                    </p>
                    {att.isKeepForever && (
                      <Badge size="sm" className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] py-0 px-1.5">
                        Lưu vĩnh viễn
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span>{formatBytes(att.sizeBytes)}</span>
                    {isCleaned && (
                      <span className="flex items-center gap-1 text-rose-600 font-medium text-[11px]">
                        <AlertTriangle className="w-3 h-3" />
                        Đã hết hạn lưu trữ
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {canToggleKeepForever && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isToggling || isCleaned}
                    onClick={() => handleToggleKeep(att)}
                    title={att.isKeepForever ? 'Bỏ lưu vĩnh viễn' : 'Giữ tệp lâu dài'}
                    className={cn(
                      'text-xs h-8 px-2',
                      att.isKeepForever ? 'text-amber-600 hover:text-amber-700' : 'text-slate-500',
                    )}
                  >
                    {isToggling ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Bookmark className={cn('w-3.5 h-3.5', att.isKeepForever && 'fill-current')} />
                    )}
                    <span className="hidden sm:inline ml-1">
                      {att.isKeepForever ? 'Đã giữ' : 'Giữ tệp'}
                    </span>
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isDownloading || isCleaned}
                  onClick={() => handleDownload(att)}
                  className="text-xs h-8 px-2.5 cursor-pointer"
                >
                  {isDownloading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline ml-1">Tải xuống</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
