import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { teacherDocumentsService } from '../services/documents.service';
import { storage } from '@/lib/storage';
import { getApiErrorMessage } from '@/lib/api-client';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'conflict' | 'offline';

export interface UseDocumentAutosaveOptions {
  documentId: string;
  initialRevision: number;
  initialContent?: Record<string, any>;
  debounceMs?: number;
  onRevisionUpdate?: (newRevision: number) => void;
  onSaveSuccess?: (revision: number, updatedAt: string) => void;
}

interface LocalDraft {
  content: Record<string, any>;
  revision: number;
  timestamp: string;
}

export function useDocumentAutosave({
  documentId,
  initialRevision,
  initialContent,
  debounceMs = 1000,
  onRevisionUpdate,
  onSaveSuccess,
}: UseDocumentAutosaveOptions) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [currentRevision, setCurrentRevision] = useState<number>(initialRevision);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [conflictData, setConflictData] = useState<{
    serverRevision: number | null;
    expectedRevision: number;
  } | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [hasLocalDraft, setHasLocalDraft] = useState(false);

  // References to handle serialization and pending updates
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  const pendingContentRef = useRef<{ content: Record<string, any>; reason?: string } | null>(null);
  const latestContentRef = useRef<Record<string, any> | null>(initialContent || null);
  const revisionRef = useRef<number>(initialRevision);
  revisionRef.current = currentRevision;

  // Synchronize revision and initial content when props change and not dirty
  const prevInitialRevisionRef = useRef(initialRevision);
  useEffect(() => {
    if (initialRevision !== undefined && initialRevision !== prevInitialRevisionRef.current) {
      prevInitialRevisionRef.current = initialRevision;
      if (!isDirty) {
        setCurrentRevision(initialRevision);
        revisionRef.current = initialRevision;
      }
    }
    if (initialContent && !latestContentRef.current && !isDirty) {
      latestContentRef.current = initialContent;
    }
  }, [initialRevision, initialContent, isDirty]);

  // Storage key for user/document offline backup
  const userId = storage.getUser()?.id || 'anonymous';
  const draftKey = `vanbynhi_doc_draft_${userId}_${documentId}`;

  // Check for existing local draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw) as LocalDraft;
        if (parsed && parsed.content) {
          setHasLocalDraft(true);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [draftKey]);

  // Network online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      if (saveStatus === 'offline') {
        setSaveStatus(isDirty ? 'idle' : 'saved');
        if (latestContentRef.current && isDirty) {
          triggerSave(latestContentRef.current);
        }
      }
    };

    const handleOffline = () => {
      setSaveStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [saveStatus, isDirty]);

  // Safe window unload handler
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty || isSavingRef.current || pendingContentRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  // Execute OCC Content Save sequentially
  const executeSave = useCallback(
    async (content: Record<string, any>, versionReason?: string) => {
      if (!navigator.onLine) {
        setSaveStatus('offline');
        return;
      }

      isSavingRef.current = true;
      setSaveStatus('saving');
      setErrorMessage(null);

      const expectedRevision = revisionRef.current;

      try {
        const res = await teacherDocumentsService.updateContent(documentId, {
          expectedRevision,
          content,
          versionReason,
        });

        // Save succeeded
        const newRevision = res.revision;
        setCurrentRevision(newRevision);
        revisionRef.current = newRevision;
        onRevisionUpdate?.(newRevision);
        onSaveSuccess?.(newRevision, res.updatedAt);

        setLastSavedAt(new Date(res.updatedAt));
        setSaveStatus('saved');
        setIsDirty(false);
        setConflictData(null);

        // Clear local draft backup on successful save
        try {
          localStorage.removeItem(draftKey);
          setHasLocalDraft(false);
        } catch {
          // Ignore
        }
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && (err.response?.status === 409 || err.response?.data?.errorCode === 'REVISION_CONFLICT')) {
          // REVISION_CONFLICT: Do NOT overwrite user work
          const errData = err.response?.data as {
            currentRevision?: number;
            expectedRevision?: number;
            message?: string;
          };
          setSaveStatus('conflict');
          setConflictData({
            serverRevision: errData?.currentRevision ?? null,
            expectedRevision,
          });
          setErrorMessage(
            errData?.message || 'Xung đột phiên bản: Tài liệu đã được cập nhật bởi một phiên làm việc khác.',
          );
        } else {
          setSaveStatus('error');
          setErrorMessage(getApiErrorMessage(err));
        }
      } finally {
        isSavingRef.current = false;

        // Process any queued pending content sequentially
        if (pendingContentRef.current) {
          const next = pendingContentRef.current;
          pendingContentRef.current = null;
          // Only proceed if not in conflict state
          if (saveStatus !== 'conflict') {
            void executeSave(next.content, next.reason);
          }
        }
      }
    },
    [documentId, draftKey, onRevisionUpdate, onSaveSuccess, saveStatus],
  );

  // Debounced trigger
  const triggerSave = useCallback(
    (content: Record<string, any>, reason?: string) => {
      latestContentRef.current = content;
      setIsDirty(true);

      // Save offline draft to localStorage immediately as safety net
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            content,
            revision: revisionRef.current,
            timestamp: new Date().toISOString(),
          }),
        );
      } catch {
        // Ignore quota errors
      }

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        if (isSavingRef.current) {
          // A save is currently in-flight; queue this update
          pendingContentRef.current = { content, reason };
        } else {
          void executeSave(content, reason);
        }
      }, debounceMs);
    },
    [debounceMs, draftKey, executeSave],
  );

  // Immediate save without waiting for debounce
  const saveImmediate = useCallback(
    async (reason?: string, fallbackContent?: Record<string, any>) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const targetContent = latestContentRef.current || fallbackContent;
      if (!targetContent) return;
      latestContentRef.current = targetContent;

      if (isSavingRef.current) {
        pendingContentRef.current = { content: targetContent, reason };
      } else {
        await executeSave(targetContent, reason);
      }
    },
    [executeSave],
  );

  // Conflict resolution helpers
  const resolveConflictWithServer = useCallback(
    (newRevision: number) => {
      setCurrentRevision(newRevision);
      revisionRef.current = newRevision;
      setConflictData(null);
      setSaveStatus('saved');
      setIsDirty(false);
      try {
        localStorage.removeItem(draftKey);
        setHasLocalDraft(false);
      } catch {
        // Ignore
      }
    },
    [draftKey],
  );

  const resolveConflictWithLocal = useCallback(
    (newServerRevision: number) => {
      // Accept server revision as new base and immediately push local content
      setCurrentRevision(newServerRevision);
      revisionRef.current = newServerRevision;
      setConflictData(null);
      if (latestContentRef.current) {
        void executeSave(latestContentRef.current, 'Ghi đè sau giải quyết xung đột');
      }
    },
    [executeSave],
  );

  // Local draft helpers
  const getLocalDraft = useCallback((): LocalDraft | null => {
    try {
      const raw = localStorage.getItem(draftKey);
      return raw ? (JSON.parse(raw) as LocalDraft) : null;
    } catch {
      return null;
    }
  }, [draftKey]);

  const dismissLocalDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftKey);
      setHasLocalDraft(false);
    } catch {
      // Ignore
    }
  }, [draftKey]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    saveStatus,
    currentRevision,
    lastSavedAt,
    errorMessage,
    conflictData,
    isDirty,
    hasLocalDraft,
    triggerSave,
    saveImmediate,
    resolveConflictWithServer,
    resolveConflictWithLocal,
    getLocalDraft,
    dismissLocalDraft,
  };
}
