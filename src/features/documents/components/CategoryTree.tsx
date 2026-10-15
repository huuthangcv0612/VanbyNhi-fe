import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  FolderPlus,
  Files,
  Inbox,
} from 'lucide-react';
import type { DocumentCategoryTreeNode } from '../types/document.types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

export interface CategoryTreeProps {
  categories: DocumentCategoryTreeNode[];
  selectedCategoryId: string | null; // null: all, 'UNCLASSIFIED': unclassified, or categoryId
  onSelectCategory: (categoryId: string | null) => void;
  onAddCategory: (parentId?: string) => void;
  onEditCategory: (category: DocumentCategoryTreeNode) => void;
  onDeleteCategory: (category: DocumentCategoryTreeNode) => void;
  totalDocumentsCount?: number;
}

export function CategoryTree({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  totalDocumentsCount,
}: CategoryTreeProps) {
  // Set of expanded category IDs
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    // Default expand all root categories
    return new Set(categories.map((c) => c.id));
  });

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderNode = (node: DocumentCategoryTreeNode, depth = 0) => {
    const isExpanded = expandedIds.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedCategoryId === node.id;

    return (
      <li key={node.id} className="select-none">
        <div
          onClick={() => onSelectCategory(node.id)}
          className={cn(
            'group flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors',
            isSelected
              ? 'bg-amber-100/90 text-amber-900 font-semibold'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
          )}
          style={{ paddingLeft: `${Math.max(10, depth * 16 + 10)}px` }}
        >
          {/* Left: Chevron + Folder Icon + Name */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleExpand(node.id, e)}
                className="p-0.5 -ml-1 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
                aria-label={isExpanded ? 'Thu gọn' : 'Mở rộng'}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <span className="w-3.5 h-3.5 inline-block -ml-1 shrink-0" />
            )}

            {isExpanded && hasChildren ? (
              <FolderOpen className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-amber-600 shrink-0" />
            )}

            <span className="truncate" title={node.name}>
              {node.name}
            </span>
          </div>

          {/* Right: Document count & hover actions */}
          <div className="flex items-center gap-1 shrink-0">
            {node.documentCount > 0 && (
              <Badge
                size="sm"
                className={cn(
                  'text-[10px] px-1.5 py-0',
                  isSelected
                    ? 'bg-amber-200 text-amber-900 border-amber-300'
                    : 'bg-slate-100 text-slate-600 border-slate-200',
                )}
              >
                {node.documentCount}
              </Badge>
            )}

            {/* Actions visible on hover or when selected */}
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddCategory(node.id);
                }}
                className="p-1 text-slate-400 hover:text-amber-700 hover:bg-amber-100/60 rounded cursor-pointer"
                title="Thêm thư mục con"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditCategory(node);
                }}
                className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-100/60 rounded cursor-pointer"
                title="Sửa thư mục"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteCategory(node);
                }}
                className="p-1 text-slate-400 hover:text-rose-700 hover:bg-rose-100/60 rounded cursor-pointer"
                title="Xóa thư mục"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Recursive render children */}
        {hasChildren && isExpanded && (
          <ul className="mt-0.5 space-y-0.5">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="space-y-3">
      {/* Root actions header */}
      <div className="flex items-center justify-between px-1">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Thư mục tài liệu
        </h4>
        <button
          type="button"
          onClick={() => onAddCategory(undefined)}
          className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-800 font-medium hover:underline cursor-pointer"
          title="Tạo danh mục gốc mới"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>Thư mục mới</span>
        </button>
      </div>

      {/* Special items: Tất cả & Chưa phân loại */}
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => onSelectCategory(null)}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors',
            selectedCategoryId === null
              ? 'bg-amber-100/90 text-amber-900 font-semibold'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
          )}
        >
          <div className="flex items-center gap-2">
            <Files className="w-4 h-4 text-amber-700" />
            <span>Tất cả tài liệu</span>
          </div>
          {totalDocumentsCount !== undefined && (
            <Badge
              size="sm"
              className={cn(
                'text-[10px] px-1.5 py-0',
                selectedCategoryId === null
                  ? 'bg-amber-200 text-amber-900 border-amber-300'
                  : 'bg-slate-100 text-slate-600 border-slate-200',
              )}
            >
              {totalDocumentsCount}
            </Badge>
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelectCategory('UNCLASSIFIED')}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors',
            selectedCategoryId === 'UNCLASSIFIED'
              ? 'bg-amber-100/90 text-amber-900 font-semibold'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
          )}
        >
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-slate-500" />
            <span>Chưa phân loại</span>
          </div>
        </button>
      </div>

      <div className="border-t border-slate-200/80 my-2" />

      {/* Categories tree */}
      {categories.length === 0 ? (
        <div className="py-6 px-3 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-400 text-xs">
          <Folder className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
          <p>Chưa có danh mục nào</p>
          <button
            type="button"
            onClick={() => onAddCategory(undefined)}
            className="mt-2 text-xs text-amber-700 font-medium hover:underline cursor-pointer"
          >
            + Tạo danh mục đầu tiên
          </button>
        </div>
      ) : (
        <ul className="space-y-0.5">
          {categories.map((root) => renderNode(root, 0))}
        </ul>
      )}
    </div>
  );
}
