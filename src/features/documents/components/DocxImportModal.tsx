import { useState, useRef, useEffect } from 'react';
import {
  FileText,
  UploadCloud,
  X,
  AlertCircle,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatBytes } from '@/utils/formatters';
import { teacherDocumentsService } from '../services/documents.service';
import type {
  DocumentCategoryTreeNode,
  DocumentEntity,
} from '../types/document.types';

export interface DocxImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoriesTree: DocumentCategoryTreeNode[];
  initialCategoryId?: string | null;
  onSuccess: (document: DocumentEntity, warnings?: string[]) => void;
}

interface FlatCategoryOption {
  id: string;
  name: string;
  level: number;
}

type ImportStage = 'idle' | 'init' | 'uploading' | 'importing' | 'done' | 'error';

export function DocxImportModal({
  isOpen,
  onClose,
  categoriesTree,
  initialCategoryId,
  onSuccess,
}: DocxImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);

  const [stage, setStage] = useState<ImportStage>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const flattenTree = (
    nodes: DocumentCategoryTreeNode[],
    level = 0,
  ): FlatCategoryOption[] => {
    let result: FlatCategoryOption[] = [];
    for (const node of nodes) {
      result.push({ id: node.id, name: node.name, level });
      if (node.children && node.children.length > 0) {
        result = result.concat(flattenTree(node.children, level + 1));
      }
    }
    return result;
  };

  const flatCategories = flattenTree(categoriesTree);

  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setTitle('');
      setCategoryId(
        initialCategoryId && initialCategoryId !== 'UNCLASSIFIED'
          ? initialCategoryId
          : '',
      );
      setStage('idle');
      setErrorMessage(null);
      setWarnings([]);
    }
  }, [isOpen, initialCategoryId]);

  const handleFileSelect = (file: File) => {
    // Validate file extension
    const isDocx = file.name.toLowerCase().endsWith('.docx');
    if (!isDocx) {
      setErrorMessage('Vui lòng chỉ chọn tệp văn bản Word định dạng .docx');
      return;
    }

    // Validate size (max 25MB according to API contract)
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('Kích thước tệp vượt quá giới hạn tối đa cho phép của hệ thống (25MB)');
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);

    if (!title.trim()) {
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      setTitle(baseName);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Vui lòng chọn tệp Word .docx cần nhập');
      return;
    }

    try {
      setErrorMessage(null);
      setWarnings([]);

      const result = await teacherDocumentsService.importDocxFlow(
        {
          file: selectedFile,
          title: title.trim() || undefined,
          categoryId: categoryId || undefined,
        },
        (currentStage) => {
          setStage(currentStage);
        },
      );

      setStage('done');
      if (result.warnings && result.warnings.length > 0) {
        setWarnings(result.warnings);
      }
      onSuccess(result.document, result.warnings);
      onClose();
    } catch (err: unknown) {
      setStage('error');
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Nhập tệp thất bại. Vui lòng kiểm tra lại kết nối mạng.');
      }
    }
  };

  const isBusy = stage === 'init' || stage === 'uploading' || stage === 'importing';

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isBusy) onClose();
      }}
      title="Nhập tài liệu từ Microsoft Word (.docx)"
      description="Chuyển đổi tệp .docx thành tài liệu cấu trúc với đầy đủ định dạng văn bản, danh sách, bảng và trích dẫn để tiếp tục soạn thảo trên web."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>Lưu ý khi chuyển đổi định dạng:</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5">
              {warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Drag & Drop File Area */}
        {!selectedFile ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-blue-500 bg-blue-50/60'
                : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={onFileInputChange}
              className="hidden"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            />
            <div className="flex flex-col items-center gap-2">
              <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-700">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Kéo thả file .docx vào đây hoặc{' '}
                  <span className="text-blue-700 underline">chọn từ máy tính</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Chỉ hỗ trợ Microsoft Word (.docx) • Dung lượng tối đa 25MB
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-blue-200 bg-blue-50/40">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-blue-100 text-blue-800 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate" title={selectedFile.name}>
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-500">
                  {formatBytes(selectedFile.size)} • Microsoft Word Document
                </p>
              </div>
            </div>
            {!isBusy && (
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg cursor-pointer"
                title="Chọn lại tệp khác"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Inputs */}
        <Input
          label="Tiêu đề tài liệu sau khi nhập *"
          placeholder="Nhập tiêu đề tài liệu..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isBusy}
          required
          maxLength={255}
        />

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Lưu vào danh mục
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={isBusy}
            className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer disabled:bg-slate-100"
          >
            <option value="">-- Chưa phân loại (Thư mục gốc) --</option>
            {flatCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {'\u00A0'.repeat(cat.level * 4)}
                {cat.level > 0 ? '└ ' : ''}
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Stage Progress Indicator */}
        {isBusy && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <Loader2 className="w-4 h-4 text-blue-700 animate-spin" />
              <span>
                {stage === 'init' && 'Bước 1/3: Khởi tạo phiên tải lên an toàn...'}
                {stage === 'uploading' && 'Bước 2/3: Đang tải tệp nhị phân lên Cloudflare R2...'}
                {stage === 'importing' && 'Bước 3/3: Đang phân tích DOCX, sanitize và cấu trúc hoá văn bản...'}
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                style={{
                  width:
                    stage === 'init' ? '25%' : stage === 'uploading' ? '65%' : '90%',
                }}
              />
            </div>
          </div>
        )}

        <div className="pt-2 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isBusy}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!selectedFile || !title.trim() || isBusy}
            leftIcon={isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            className="bg-blue-700 hover:bg-blue-800 text-white"
          >
            {isBusy ? 'Đang nhập tài liệu...' : 'Nhập và mở soạn thảo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
