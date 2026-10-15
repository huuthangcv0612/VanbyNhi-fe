import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type {
  DocumentCategoryTreeNode,
  DocumentItem,
  UpdateDocumentDto,
} from '../types/document.types';

export interface DocumentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  categoriesTree: DocumentCategoryTreeNode[];
  onSubmit: (id: string, dto: UpdateDocumentDto) => Promise<void>;
  isLoading?: boolean;
}

interface FlatCategoryOption {
  id: string;
  name: string;
  level: number;
}

export function DocumentEditModal({
  isOpen,
  onClose,
  document,
  categoriesTree,
  onSubmit,
  isLoading = false,
}: DocumentEditModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    if (document) {
      setTitle(document.title || '');
      setDescription(document.description || '');
      setCategoryId(document.categoryId || '');
      setErrorMsg(null);
    }
  }, [document, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document) return;
    if (!title.trim()) {
      setErrorMsg('Tiêu đề tài liệu không được để trống');
      return;
    }

    try {
      setErrorMsg(null);
      await onSubmit(document.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        categoryId: categoryId ? categoryId : null,
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Không thể cập nhật tài liệu. Vui lòng thử lại.');
      }
    }
  };

  if (!document) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chỉnh sửa thông tin tài liệu"
      description={`Cập nhật tiêu đề, mô tả hoặc di chuyển thư mục cho tệp "${document.originalName}".`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {errorMsg}
          </div>
        )}

        <Input
          label="Tiêu đề tài liệu *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={255}
        />

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Danh mục / Thư mục
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
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
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tóm tắt nội dung chính hoặc ghi chú..."
            className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isLoading}
          >
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </Modal>
  );
}
