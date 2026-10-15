import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type {
  DocumentCategoryTreeNode,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../types/document.types';

export interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoriesTree: DocumentCategoryTreeNode[];
  categoryToEdit?: DocumentCategoryTreeNode | null;
  initialParentId?: string;
  onSubmit: (dto: CreateCategoryDto | UpdateCategoryDto) => Promise<void>;
  isLoading?: boolean;
}

interface FlatCategoryOption {
  id: string;
  name: string;
  level: number;
}

export function CategoryModal({
  isOpen,
  onClose,
  categoriesTree,
  categoryToEdit,
  initialParentId,
  onSubmit,
  isLoading = false,
}: CategoryModalProps) {
  const isEditing = Boolean(categoryToEdit);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Flatten category tree into indented options list
  const flattenTree = (
    nodes: DocumentCategoryTreeNode[],
    level = 0,
    ignoreId?: string,
  ): FlatCategoryOption[] => {
    let result: FlatCategoryOption[] = [];
    for (const node of nodes) {
      if (ignoreId && node.id === ignoreId) {
        continue; // Cannot select self as parent
      }
      result.push({ id: node.id, name: node.name, level });
      if (node.children && node.children.length > 0) {
        result = result.concat(flattenTree(node.children, level + 1, ignoreId));
      }
    }
    return result;
  };

  const flatCategories = flattenTree(
    categoriesTree,
    0,
    categoryToEdit?.id,
  );

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name || '');
      setDescription(categoryToEdit.description || '');
      setParentId(categoryToEdit.parentId || '');
      setSortOrder(categoryToEdit.sortOrder ?? 0);
    } else {
      setName('');
      setDescription('');
      setParentId(initialParentId || '');
      setSortOrder(0);
    }
    setErrorMsg(null);
  }, [categoryToEdit, initialParentId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập tên danh mục');
      return;
    }

    try {
      setErrorMsg(null);
      if (isEditing) {
        await onSubmit({
          name: name.trim(),
          description: description.trim() || undefined,
          parentId: parentId ? parentId : null,
          sortOrder: Number(sortOrder) || 0,
        });
      } else {
        await onSubmit({
          name: name.trim(),
          description: description.trim() || undefined,
          parentId: parentId ? parentId : undefined,
          sortOrder: Number(sortOrder) || 0,
        });
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Đã có lỗi xảy ra. Vui lòng thử lại.');
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Chỉnh sửa danh mục' : 'Tạo danh mục mới'}
      description="Quản lý cấu trúc thư mục tài liệu giảng dạy của bạn."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {errorMsg}
          </div>
        )}

        <Input
          label="Tên danh mục *"
          placeholder="VD: Giáo án, Đề cương học kỳ 1, Khối 12..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
          maxLength={100}
        />

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Danh mục cha (Cấp trên)
          </label>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <option value="">-- Danh mục gốc (Cấp cao nhất) --</option>
            {flatCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {'\u00A0'.repeat(cat.level * 3)}
                {cat.level > 0 ? '└─ ' : ''}
                {cat.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-slate-500">
            Chọn danh mục cha để xếp thư mục này vào cấp dưới.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Mô tả danh mục (tùy chọn)
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ghi chú nội dung hoặc đối tượng sử dụng danh mục này..."
            className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Thứ tự hiển thị
          </label>
          <input
            type="number"
            min={0}
            max={999}
            value={sortOrder}
            onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
            className="w-28 text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Số nhỏ hơn sẽ hiển thị trước.
          </p>
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
            {isEditing ? 'Lưu thay đổi' : 'Tạo danh mục'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
