import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Share2,
  Search,
  CheckSquare,
  Square,
  AlertCircle,
  FileText,
  Calendar,
  Clock,
  Layers,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { teacherClassesService } from '@/features/classes/services/classes.service';
import { teacherDocumentsService } from '../services/documents.service';
import type {
  DocumentItem,
  AssignDocumentsToClassesResponse,
} from '../types/document.types';
import { getApiErrorMessage } from '@/lib/api-client';
import { formatBytes } from '@/utils/formatters';

export interface AssignDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentItem[];
  onSuccess: (result: AssignDocumentsToClassesResponse) => void;
}

export function AssignDocumentsModal({
  isOpen,
  onClose,
  documents,
  onSuccess,
}: AssignDocumentsModalProps) {
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [classSearch, setClassSearch] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [accessStartTime, setAccessStartTime] = useState('');
  const [accessEndTime, setAccessEndTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch teacher's classes from backend API
  const {
    data: classesData,
    isLoading: isLoadingClasses,
    isError: isClassesError,
    error: classesError,
  } = useQuery({
    queryKey: ['teacher-classes-for-assign'],
    queryFn: () => teacherClassesService.getMyClasses({ limit: 100 }),
    enabled: isOpen,
  });

  const classes = useMemo(() => classesData?.items || [], [classesData?.items]);

  // Filter classes by search keyword
  const filteredClasses = useMemo(() => {
    if (!classSearch.trim()) return classes;
    const query = classSearch.toLowerCase().trim();
    return classes.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        (c.classCode && c.classCode.toLowerCase().includes(query)) ||
        (c.description && c.description.toLowerCase().includes(query)),
    );
  }, [classes, classSearch]);

  // Reset form when modal opens with documents
  useEffect(() => {
    if (isOpen) {
      setSelectedClassIds([]);
      setClassSearch('');
      setIsPublished(true);
      setAccessStartTime('');
      setAccessEndTime('');
      setErrorMessage(null);
    }
  }, [isOpen]);

  const toggleSelectClass = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId],
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredClasses.map((c) => c.id);
    const allSelected = filteredIds.every((id) => selectedClassIds.includes(id));

    if (allSelected) {
      // Deselect all filtered
      setSelectedClassIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      // Select all filtered
      setSelectedClassIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const isAllFilteredSelected =
    filteredClasses.length > 0 &&
    filteredClasses.every((c) => selectedClassIds.includes(c.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validDocIds = documents.map((d) => d.id).filter(Boolean);
    const validClassIds = selectedClassIds.filter(Boolean);

    if (validDocIds.length === 0) {
      setErrorMessage('Chưa có tài liệu nào được chọn.');
      return;
    }

    if (validClassIds.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất một lớp học để cấp quyền.');
      return;
    }

    if (accessStartTime && accessEndTime) {
      const start = new Date(accessStartTime).getTime();
      const end = new Date(accessEndTime).getTime();
      if (start >= end) {
        setErrorMessage('Thời gian kết thúc truy cập phải diễn ra sau thời gian bắt đầu.');
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        documentIds: validDocIds,
        classIds: validClassIds,
        isPublished,
        accessStartTime: accessStartTime
          ? new Date(accessStartTime).toISOString()
          : undefined,
        accessEndTime: accessEndTime
          ? new Date(accessEndTime).toISOString()
          : undefined,
      };

      const result = await teacherDocumentsService.assignDocumentsToClasses(payload);
      onSuccess(result);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cấp quyền tài liệu cho lớp học"
      description={`Cấp quyền truy cập cho ${documents.length} tài liệu vào các lớp học được chọn`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* 1. Danh sách tài liệu được chọn */}
        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-700" />
              Tài liệu được chọn ({documents.length}):
            </span>
            <span className="text-[11px] text-amber-700 font-normal">
              Tổng dung lượng: {formatBytes(documents.reduce((acc, d) => acc + (d.sizeBytes || 0), 0))}
            </span>
          </div>

          <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between text-xs bg-white/90 px-2.5 py-1.5 rounded-lg border border-amber-200/60"
              >
                <span className="truncate font-medium text-slate-800 mr-2" title={doc.title}>
                  {doc.title}
                </span>
                <span className="text-[10px] text-slate-500 font-mono shrink-0">
                  {formatBytes(doc.sizeBytes)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Chọn lớp học */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-700" />
              Chọn các lớp nhận tài liệu ({selectedClassIds.length}/{classes.length})
            </label>
            {filteredClasses.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="text-xs text-amber-700 hover:text-amber-800 font-medium hover:underline cursor-pointer flex items-center gap-1"
              >
                {isAllFilteredSelected ? 'Bỏ chọn trang này' : 'Chọn tất cả'}
              </button>
            )}
          </div>

          {/* Search Classes */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={classSearch}
              onChange={(e) => setClassSearch(e.target.value)}
              placeholder="Tìm kiếm theo tên lớp, mã lớp..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Classes list box */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-52 overflow-y-auto">
            {isLoadingClasses ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Đang tải danh sách lớp học...
              </div>
            ) : isClassesError ? (
              <div className="p-4 text-center text-xs text-rose-600">
                Lỗi tải danh sách lớp: {getApiErrorMessage(classesError)}
              </div>
            ) : filteredClasses.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                {classSearch ? 'Không tìm thấy lớp học phù hợp' : 'Bạn chưa quản lý lớp học nào'}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredClasses.map((cls) => {
                  const isChecked = selectedClassIds.includes(cls.id);
                  return (
                    <div
                      key={cls.id}
                      onClick={() => toggleSelectClass(cls.id)}
                      className={`flex items-center justify-between p-2.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                        isChecked ? 'bg-amber-50/50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          type="button"
                          className="text-amber-700 shrink-0 cursor-pointer focus:outline-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectClass(cls.id);
                          }}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-amber-700" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800 truncate" title={cls.name}>
                            {cls.name}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            {cls.classCode && (
                              <span className="font-mono text-slate-500">
                                Mã: {cls.classCode}
                              </span>
                            )}
                            {cls.activeStudentCount !== undefined && (
                              <span>• {cls.activeStudentCount} học sinh</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 ml-2">
                        <Badge
                          variant={cls.status === 'ACTIVE' ? 'success' : 'default'}
                          size="sm"
                          className="text-[10px]"
                        >
                          {cls.status === 'ACTIVE' ? 'Đang hoạt động' : cls.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 3. Tùy chọn quyền truy cập */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-700">Trạng thái xuất bản</p>
              <p className="text-[11px] text-slate-500">
                Cho phép học sinh trong lớp nhìn thấy tài liệu ngay sau khi cấp quyền
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          {/* Optional time window */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                Thời gian bắt đầu (tùy chọn)
              </label>
              <input
                type="datetime-local"
                value={accessStartTime}
                onChange={(e) => setAccessStartTime(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                Thời gian kết thúc (tùy chọn)
              </label>
              <input
                type="datetime-local"
                value={accessEndTime}
                onChange={(e) => setAccessEndTime(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Modal actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            disabled={selectedClassIds.length === 0 || documents.length === 0 || isSubmitting}
            leftIcon={<Share2 className="w-3.5 h-3.5" />}
          >
            Cấp quyền cho {selectedClassIds.length} lớp
          </Button>
        </div>
      </form>
    </Modal>
  );
}
