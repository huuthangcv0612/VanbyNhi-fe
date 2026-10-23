import { useState, useCallback } from 'react';
import { assignmentsService } from '../services/assignments.service';
import { validateAttachmentFile } from '../utils/assignment.utils';
import type { UploadTargetType } from '../types/assignment.types';

export interface UploadedFileItem {
  storageKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface UseFileUploadOptions {
  targetType: UploadTargetType;
  targetId?: string;
  onSuccess?: (item: UploadedFileItem) => void;
  onError?: (error: Error) => void;
}

export function useFileUpload({ targetType, targetId, onSuccess, onError }: UseFileUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  const uploadFile = useCallback(
    async (file: File): Promise<UploadedFileItem | null> => {
      // 1. Validate file on client side first
      const validation = validateAttachmentFile(file);
      if (!validation.valid) {
        const errMessage = validation.error || 'Tệp không hợp lệ';
        setError(errMessage);
        onError?.(new Error(errMessage));
        return null;
      }

      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        // 2. Gọi backend để lấy presigned PUT URL
        const initRes = await assignmentsService.initUpload({
          targetType,
          originalName: file.name,
          mimeType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
          targetId,
        });

        // 3. Tải tệp lên Cloudflare R2
        await assignmentsService.uploadFileToR2(
          initRes.uploadUrl,
          file,
          initRes.requiredHeaders,
          (pct) => setProgress(pct),
        );

        const uploadedItem: UploadedFileItem = {
          storageKey: initRes.storageKey,
          originalName: file.name,
          mimeType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
        };

        setIsUploading(false);
        setProgress(100);
        onSuccess?.(uploadedItem);
        return uploadedItem;
      } catch (err: unknown) {
        setIsUploading(false);
        const message = err instanceof Error ? err.message : 'Tải tệp lên đám mây thất bại';
        setError(message);
        onError?.(err instanceof Error ? err : new Error(message));
        return null;
      }
    },
    [targetType, targetId, onSuccess, onError],
  );

  return {
    uploadFile,
    isUploading,
    progress,
    error,
    reset,
  };
}
