import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  File,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatBytes } from '@/utils/formatters';
import { teacherDocumentsService } from '../services/documents.service';
import type {
  DocumentCategoryTreeNode,
  DocumentItem,
} from '../types/document.types';

export interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoriesTree: DocumentCategoryTreeNode[];
  initialCategoryId?: string | null;
  onSuccess: (document: DocumentItem) => void;
}

interface FlatCategoryOption {
  id: string;
  name: string;
  level: number;
}

type UploadStage = 'idle' | 'init' | 'uploading' | 'completing' | 'done' | 'error';

export function DocumentUploadModal({
  isOpen,
  onClose,
  categoriesTree,
  initialCategoryId,
  onSuccess,
}: DocumentUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);

  const [uploadStage, setUploadStage] = useState<UploadStage>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Flatten categories for dropdown
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
      setDescription('');
      setCategoryId(
        initialCategoryId && initialCategoryId !== 'UNCLASSIFIED'
          ? initialCategoryId
          : '',
      );
      setUploadStage('idle');
      setErrorMessage(null);
    }
  }, [isOpen, initialCategoryId]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setErrorMessage(null);

    // If title has not been edited by user yet, prefill with file base name
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
      setErrorMessage('Vui lòng chọn tệp tin cần tải lên');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('Vui lòng nhập tiêu đề tài liệu');
      return;
    }

    try {
      setErrorMessage(null);

      const result = await teacherDocumentsService.uploadDocumentFlow(
        {
          file: selectedFile,
          title: title.trim(),
          description: description.trim() || undefined,
          categoryId: categoryId || undefined,
        },
        (stage) => {
          setUploadStage(stage);
        },
      );

      setUploadStage('done');
      onSuccess(result.document);
      onClose();
    } catch (err: unknown) {
      setUploadStage('error');
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Tải lên thất bại. Vui lòng kiểm tra lại kết nối mạng.');
      }
    }
  };

  const isUploading =
    uploadStage === 'init' ||
    uploadStage === 'uploading' ||
    uploadStage === 'completing';

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isUploading) onClose();
      }}
      title="Tải tài liệu mới lên thư viện"
      description="Tải lên tệp tin và lưu trữ bảo mật trực tiếp trên Cloudflare R2."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
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
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-amber-500 bg-amber-50/60'
                : 'border-slate-300 hover:border-amber-400 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={onFileInputChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.webp,.zip"
            />
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-amber-50 text-amber-700">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Kéo thả file vào đây hoặc <span className="text-amber-700 underline">chọn từ thiết bị</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Hỗ trợ PDF, Word (.docx), PowerPoint (.pptx), Excel, Ảnh, Zip (Tối đa 100MB)
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0">
                <File className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate" title={selectedFile.name}>
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-500">
                  {formatBytes(selectedFile.size)} • {selectedFile.type || 'Định dạng tệp'}
                </p>
              </div>
            </div>
            {!isUploading && (
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
          label="Tiêu đề tài liệu *"
          placeholder="Nhập tiêu đề tài liệu rõ ràng, dễ tra cứu..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isUploading}
          required
          maxLength={255}
        />

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Danh mục lưu trữ
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={isUploading}
            className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer disabled:bg-slate-100"
          >
            <option value="">-- Chưa phân loại (Thư mục gốc) --</option>
            {flatCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {'\u00A0'.repeat(cat.level * 3)}
                {cat.level > 0 ? '└─ ' : ''}
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Mô tả chi tiết (tùy chọn)
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isUploading}
            placeholder="Tóm tắt nội dung chính, hướng dẫn sử dụng cho học sinh..."
            className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100"
          />
        </div>

        {/* Upload progress indicator */}
        {isUploading && (
          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-amber-900">
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                {uploadStage === 'init' && 'Bước 1/3: Khởi tạo phiên upload bảo mật...'}
                {uploadStage === 'uploading' && 'Bước 2/3: Đang tải trực tiếp lên Cloudflare R2...'}
                {uploadStage === 'completing' && 'Bước 3/3: Xác thực và lưu trữ tài liệu...'}
              </span>
            </div>
            <div className="w-full h-1.5 bg-amber-200/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-700 transition-all duration-300 rounded-full"
                style={{
                  width:
                    uploadStage === 'init'
                      ? '33%'
                      : uploadStage === 'uploading'
                      ? '75%'
                      : '95%',
                }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isUploading}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!selectedFile || isUploading}
            isLoading={isUploading}
            leftIcon={uploadStage === 'done' ? <CheckCircle2 className="w-4 h-4" /> : <UploadCloud className="w-4 h-4" />}
          >
            {isUploading ? 'Đang tải lên...' : 'Tải tài liệu lên'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
