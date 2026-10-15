import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FolderOpen,
  Plus,
  Search,
  Trash2,
  Edit2,
  Eye,
  Share2,
  Files,
  Inbox,
  AlertCircle,
  ChevronRight,
  FolderPlus,
  FileCheck,
  CheckSquare,
  Square,
  X,
  Layers,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useToast } from '@/hooks/useToast';
import { formatDate, formatBytes } from '@/utils/formatters';
import { getApiErrorMessage } from '@/lib/api-client';

import { teacherDocumentsService } from '../services/documents.service';
import type {
  DocumentCategoryTreeNode,
  DocumentItem,
  CreateCategoryDto,
  UpdateCategoryDto,
  UpdateDocumentDto,
} from '../types/document.types';

import { CategoryTree } from '../components/CategoryTree';
import { CategoryModal } from '../components/CategoryModal';
import { DocumentUploadModal } from '../components/DocumentUploadModal';
import { DocumentEditModal } from '../components/DocumentEditModal';
import { DocumentPreviewModal } from '../components/DocumentPreviewModal';
import { ShareDocumentModal } from '../components/ShareDocumentModal';
import { AssignDocumentsModal } from '../components/AssignDocumentsModal';
import { TeacherAssignedMaterialsView } from '../components/TeacherAssignedMaterialsView';

export function TeacherDocumentsPage() {
  const queryClient = useQueryClient();
  const { success, error: toastError, info } = useToast();

  // Navigation / Selection State
  // selectedCategoryId: null (All), 'UNCLASSIFIED' (Unclassified), or string id
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [categoryModalState, setCategoryModalState] = useState<{
    isOpen: boolean;
    categoryToEdit?: DocumentCategoryTreeNode | null;
    initialParentId?: string;
  }>({ isOpen: false });

  const [docToEdit, setDocToEdit] = useState<DocumentItem | null>(null);
  const [docToPreview, setDocToPreview] = useState<DocumentItem | null>(null);
  const [docToShare, setDocToShare] = useState<DocumentItem | null>(null);
  const [docToDelete, setDocToDelete] = useState<DocumentItem | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<DocumentCategoryTreeNode | null>(null);

  // View mode: Library or Assigned to Classes
  const [activeTab, setActiveTab] = useState<'library' | 'assigned'>('library');

  // Multi-selection & Assignment state
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [docsToAssign, setDocsToAssign] = useState<DocumentItem[]>([]);

  // 1. Query Category Tree
  const {
    data: categoriesTree = [],
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ['teacher-document-categories'],
    queryFn: () => teacherDocumentsService.getCategories(true),
  });

  // 2. Query Documents List
  const isUnclassified = selectedCategoryId === 'UNCLASSIFIED';
  const activeCategoryId =
    selectedCategoryId && selectedCategoryId !== 'UNCLASSIFIED'
      ? selectedCategoryId
      : undefined;

  const {
    data: documentsData,
    isLoading: isDocumentsLoading,
    isError: isDocumentsError,
    error: documentsError,
    refetch: refetchDocuments,
  } = useQuery({
    queryKey: [
      'teacher-documents',
      {
        page,
        limit,
        search: searchQuery,
        categoryId: activeCategoryId,
        unclassifiedOnly: isUnclassified,
      },
    ],
    queryFn: () =>
      teacherDocumentsService.getDocuments({
        page,
        limit,
        search: searchQuery,
        categoryId: activeCategoryId,
        unclassifiedOnly: isUnclassified,
      }),
  });

  const documents = documentsData?.items || [];
  const pagination = documentsData?.pagination;

  // Compute category breadcrumb path from tree
  const categoryPath = useMemo(() => {
    if (!selectedCategoryId || selectedCategoryId === 'UNCLASSIFIED') return [];

    const path: Array<{ id: string; name: string }> = [];
    const findPath = (
      nodes: DocumentCategoryTreeNode[],
      targetId: string,
      currentPath: Array<{ id: string; name: string }>,
    ): boolean => {
      for (const node of nodes) {
        const next = [...currentPath, { id: node.id, name: node.name }];
        if (node.id === targetId) {
          path.push(...next);
          return true;
        }
        if (node.children && node.children.length > 0) {
          if (findPath(node.children, targetId, next)) return true;
        }
      }
      return false;
    };

    findPath(categoriesTree, selectedCategoryId, []);
    return path;
  }, [categoriesTree, selectedCategoryId]);

  // Total documents across all categories
  const totalAllDocs = useMemo(() => {
    const sumCount = (nodes: DocumentCategoryTreeNode[]): number => {
      let count = 0;
      for (const n of nodes) {
        count += n.documentCount || 0;
        if (n.children && n.children.length > 0) {
          count += sumCount(n.children);
        }
      }
      return count;
    };
    return sumCount(categoriesTree);
  }, [categoriesTree]);

  // Mutations for Category
  const createCategoryMutation = useMutation({
    mutationFn: (dto: CreateCategoryDto) => teacherDocumentsService.createCategory(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-document-categories'] });
      success(data.message || 'Tạo danh mục thành công');
      setCategoryModalState({ isOpen: false });
    },
    onError: (err: unknown) => {
      toastError(getApiErrorMessage(err), 'Lỗi tạo danh mục');
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCategoryDto }) =>
      teacherDocumentsService.updateCategory(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-document-categories'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-documents'] });
      success(data.message || 'Cập nhật danh mục thành công');
      setCategoryModalState({ isOpen: false });
    },
    onError: (err: unknown) => {
      toastError(getApiErrorMessage(err), 'Lỗi cập nhật danh mục');
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => teacherDocumentsService.deleteCategory(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-document-categories'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-documents'] });
      success(data.message || 'Xóa danh mục thành công');
      if (selectedCategoryId === categoryToDelete?.id) {
        setSelectedCategoryId(null);
      }
      setCategoryToDelete(null);
    },
    onError: (err: unknown) => {
      toastError(getApiErrorMessage(err), 'Lỗi xóa danh mục');
    },
  });

  // Mutations for Document
  const updateDocumentMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateDocumentDto }) =>
      teacherDocumentsService.updateDocument(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-documents'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-document-categories'] });
      success(data.message || 'Cập nhật tài liệu thành công');
      setDocToEdit(null);
    },
    onError: (err: unknown) => {
      toastError(getApiErrorMessage(err), 'Lỗi cập nhật tài liệu');
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (id: string) => teacherDocumentsService.deleteDocument(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-documents'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-document-categories'] });
      info(data.message || 'Đã xóa tài liệu khỏi thư viện');
      if (docToDelete) {
        setSelectedDocIds((prev) => prev.filter((id) => id !== docToDelete.id));
      }
      setDocToDelete(null);
    },
    onError: (err: unknown) => {
      toastError(getApiErrorMessage(err), 'Lỗi xóa tài liệu');
    },
  });

  // Check if all documents on the current page are selected
  const isAllPageDocsSelected = useMemo(() => {
    if (documents.length === 0) return false;
    return documents.every((d) => selectedDocIds.includes(d.id));
  }, [documents, selectedDocIds]);

  const toggleSelectDoc = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((docId) => docId !== id) : [...prev, id],
    );
  };

  const toggleSelectAllPageDocs = () => {
    const pageDocIds = documents.map((d) => d.id);
    if (isAllPageDocsSelected) {
      setSelectedDocIds((prev) => prev.filter((id) => !pageDocIds.includes(id)));
    } else {
      setSelectedDocIds((prev) => Array.from(new Set([...prev, ...pageDocIds])));
    }
  };

  const handleOpenAssignForSelected = () => {
    const selectedDocs = documents.filter((d) => selectedDocIds.includes(d.id));
    if (selectedDocs.length === 0) {
      toastError('Vui lòng chọn ít nhất một tài liệu để cấp quyền');
      return;
    }
    setDocsToAssign(selectedDocs);
    setIsAssignModalOpen(true);
  };

  const handleOpenAssignForSingleDoc = (doc: DocumentItem) => {
    setDocsToAssign([doc]);
    setIsAssignModalOpen(true);
  };

  const getFileTypeBadge = (mimeType: string, originalName: string) => {
    const ext = originalName.split('.').pop()?.toUpperCase() || '';
    if (mimeType.includes('pdf') || ext === 'PDF') {
      return (
        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 shrink-0">
          PDF
        </span>
      );
    }
    if (mimeType.includes('word') || ext === 'DOC' || ext === 'DOCX') {
      return (
        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shrink-0">
          WORD
        </span>
      );
    }
    if (mimeType.includes('presentation') || ext === 'PPT' || ext === 'PPTX') {
      return (
        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
          SLIDE
        </span>
      );
    }
    if (mimeType.includes('sheet') || ext === 'XLS' || ext === 'XLSX') {
      return (
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
          EXCEL
        </span>
      );
    }
    if (mimeType.startsWith('image/')) {
      return (
        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 shrink-0">
          ẢNH
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shrink-0">
        {ext || 'FILE'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý tài liệu giảng dạy"
        description="Thư viện tài liệu cá nhân của giáo viên: tổ chức cây danh mục nhiều cấp, lưu trữ đám mây Cloudflare R2 và chia sẻ tới các lớp học"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenAssignForSelected}
              leftIcon={<Share2 className="w-4 h-4 text-amber-700" />}
              disabled={selectedDocIds.length === 0}
              title={
                selectedDocIds.length > 0
                  ? `Cấp quyền ${selectedDocIds.length} tài liệu đã chọn cho các lớp`
                  : 'Chọn ít nhất 1 tài liệu trong danh sách để cấp quyền'
              }
            >
              Cấp quyền cho lớp {selectedDocIds.length > 0 ? `(${selectedDocIds.length})` : ''}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCategoryModalState({ isOpen: true })}
              leftIcon={<FolderPlus className="w-4 h-4" />}
            >
              Tạo thư mục
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsUploadModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Tải tài liệu mới
            </Button>
          </div>
        }
      />

      {/* View Switcher: Thư viện tài liệu vs Tài liệu đã cấp theo lớp */}
      <div className="flex items-center gap-4 border-b border-slate-200 text-xs sm:text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('library')}
          className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-all cursor-pointer ${
            activeTab === 'library'
              ? 'border-amber-700 text-amber-800'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Files className="w-4 h-4" />
          <span>Thư viện tài liệu</span>
          <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-normal">
            {totalAllDocs}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assigned')}
          className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-all cursor-pointer ${
            activeTab === 'assigned'
              ? 'border-amber-700 text-amber-800'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Đã cấp quyền theo lớp</span>
        </button>
      </div>

      {activeTab === 'assigned' ? (
        <TeacherAssignedMaterialsView />
      ) : (
        /* Main Grid: Left Category Tree Sidebar & Right Document Library */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Left: Category Tree */}
          <Card className="p-4 lg:col-span-1 border-slate-200 shadow-xs">
            {isCategoriesError ? (
              <div className="p-3 text-center text-xs text-rose-600 bg-rose-50 rounded-lg">
                <AlertCircle className="w-5 h-5 mx-auto mb-1 text-rose-500" />
                <p>Không thể tải cây danh mục</p>
                <button
                  type="button"
                  onClick={() => refetchCategories()}
                  className="mt-2 font-medium underline cursor-pointer"
                >
                  Thử lại
                </button>
              </div>
            ) : isCategoriesLoading ? (
              <div className="space-y-2 py-2">
                <Skeleton className="h-5 w-24 mb-3" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <CategoryTree
                categories={categoriesTree}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={(id) => {
                  setSelectedCategoryId(id);
                  setPage(1);
                }}
                onAddCategory={(parentId) =>
                  setCategoryModalState({ isOpen: true, initialParentId: parentId })
                }
                onEditCategory={(cat) =>
                  setCategoryModalState({ isOpen: true, categoryToEdit: cat })
                }
                onDeleteCategory={(cat) => setCategoryToDelete(cat)}
                totalDocumentsCount={totalAllDocs}
              />
            )}
          </Card>

          {/* Right: Document List & Controls */}
          <div className="lg:col-span-3 space-y-4">
            {/* Multi-selection sticky notification bar */}
            {selectedDocIds.length > 0 && (
              <div className="sticky top-2 z-10 flex items-center justify-between gap-3 p-3 bg-amber-50 border border-amber-300 rounded-xl shadow-xs text-xs">
                <div className="flex items-center gap-2 text-amber-900 font-semibold">
                  <CheckSquare className="w-4 h-4 text-amber-700" />
                  <span>Đã chọn {selectedDocIds.length} tài liệu</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDocIds([])}
                    leftIcon={<X className="w-3.5 h-3.5" />}
                  >
                    Bỏ chọn
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleOpenAssignForSelected}
                    leftIcon={<Share2 className="w-3.5 h-3.5" />}
                  >
                    Cấp quyền cho lớp ({selectedDocIds.length})
                  </Button>
                </div>
              </div>
            )}

            {/* Breadcrumbs for Active Category & Stats & Select All Checkbox */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white rounded-xl border border-slate-200 text-xs">
              {/* Category Breadcrumbs */}
              <div className="flex items-center gap-1.5 flex-wrap font-medium text-slate-600">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId(null);
                    setPage(1);
                  }}
                  className={`hover:text-amber-800 transition-colors cursor-pointer flex items-center gap-1 ${
                    selectedCategoryId === null ? 'text-amber-800 font-bold' : ''
                  }`}
                >
                  <Files className="w-3.5 h-3.5" />
                  <span>Tất cả tài liệu</span>
                </button>

                {isUnclassified && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-amber-800 font-bold flex items-center gap-1">
                      <Inbox className="w-3.5 h-3.5" />
                      <span>Chưa phân loại</span>
                    </span>
                  </>
                )}

                {categoryPath.map((item, idx) => {
                  const isLast = idx === categoryPath.length - 1;
                  return (
                    <span key={item.id} className="flex items-center gap-1.5">
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      {isLast ? (
                        <span className="text-amber-800 font-bold">{item.name}</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategoryId(item.id);
                            setPage(1);
                          }}
                          className="hover:text-amber-800 transition-colors cursor-pointer"
                        >
                          {item.name}
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>

              {/* Document Count Badge & Select all page checkbox */}
              <div className="flex items-center gap-3">
                {documents.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleSelectAllPageDocs}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-amber-800 font-medium cursor-pointer"
                    title={isAllPageDocsSelected ? 'Bỏ chọn cả trang này' : 'Chọn tất cả tài liệu trang này'}
                  >
                    {isAllPageDocsSelected ? (
                      <CheckSquare className="w-3.5 h-3.5 text-amber-700" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>{isAllPageDocsSelected ? 'Bỏ chọn trang' : 'Chọn cả trang'}</span>
                  </button>
                )}
                <div className="text-slate-500 font-medium">
                  Hiển thị: <span className="font-bold text-slate-800">{pagination?.total ?? 0}</span> tài liệu
                </div>
              </div>
            </div>

            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Tìm kiếm theo tiêu đề tài liệu, tên file gốc hoặc mô tả..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Documents Content */}
            {isDocumentsError ? (
              <ErrorState
                title="Không thể tải danh sách tài liệu"
                message={getApiErrorMessage(documentsError)}
                onRetry={() => refetchDocuments()}
              />
            ) : isDocumentsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                ))}
              </div>
            ) : documents.length === 0 ? (
              <EmptyState
                icon={<FolderOpen className="w-8 h-8 text-slate-400" />}
                title="Không có tài liệu nào"
                description={
                  searchQuery
                    ? 'Không tìm thấy tài liệu phù hợp với từ khóa tìm kiếm.'
                    : isUnclassified
                    ? 'Tuyệt vời! Không có tài liệu nào chưa được phân loại thư mục.'
                    : 'Thư mục này hiện chưa có tài liệu. Bấm nút Tải tài liệu mới để thêm tệp tin vào đây.'
                }
                actionLabel="Tải tài liệu lên"
                onAction={() => setIsUploadModalOpen(true)}
              />
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => {
                  const isSelected = selectedDocIds.includes(doc.id);
                  return (
                    <div
                      key={doc.id}
                      className={`p-4 rounded-xl border transition-all duration-150 space-y-3 ${
                        isSelected
                          ? 'border-amber-400 bg-amber-50/30 shadow-xs ring-1 ring-amber-300'
                          : 'border-slate-200 bg-white hover:border-amber-300 hover:shadow-xs'
                      }`}
                    >
                      {/* Top row: Checkbox, Badge, Title, Actions */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          {/* Multi-select Checkbox */}
                          <button
                            type="button"
                            onClick={(e) => toggleSelectDoc(doc.id, e)}
                            className="mt-1 p-0.5 text-slate-400 hover:text-amber-700 transition-colors cursor-pointer shrink-0 focus:outline-none"
                            title={isSelected ? 'Bỏ chọn tài liệu' : 'Chọn tài liệu'}
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-amber-700" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                            )}
                          </button>

                          <div className="mt-0.5">
                            {getFileTypeBadge(doc.mimeType, doc.originalName)}
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <h4
                              onClick={() => setDocToPreview(doc)}
                              className="font-bold text-slate-900 hover:text-amber-800 text-sm sm:text-base cursor-pointer transition-colors truncate"
                              title={doc.title}
                            >
                              {doc.title}
                            </h4>

                            {doc.description && (
                              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                {doc.description}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
                              <span className="font-mono text-slate-600 truncate max-w-xs" title={doc.originalName}>
                                {doc.originalName}
                              </span>
                              <span>•</span>
                              <span className="font-medium text-slate-700">
                                {formatBytes(doc.sizeBytes)}
                              </span>
                              <span>•</span>
                              <span>{formatDate(doc.createdAt)}</span>

                              {doc.category ? (
                                <Badge variant="primary" size="sm" className="text-[10px] px-2 py-0">
                                  {doc.category.name}
                                </Badge>
                              ) : (
                                <Badge variant="default" size="sm" className="text-[10px] px-2 py-0">
                                  Chưa phân loại
                                </Badge>
                              )}

                              {doc.usedInCount !== undefined && doc.usedInCount > 0 && (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                                  <FileCheck className="w-3 h-3" />
                                  <span>Đang chia sẻ ở {doc.usedInCount} lớp/buổi học</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDocToPreview(doc)}
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                            title="Xem tài liệu"
                          >
                            Xem
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenAssignForSingleDoc(doc)}
                            leftIcon={<Share2 className="w-3.5 h-3.5 text-amber-700" />}
                            title="Cấp quyền cho lớp học"
                          >
                            Cấp quyền
                          </Button>
                          <button
                            type="button"
                            onClick={() => setDocToEdit(doc)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDocToDelete(doc)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa tài liệu"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="pt-2 flex justify-center">
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.totalPages}
                      onPageChange={(newPage) => setPage(newPage)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Cấp quyền tài liệu cho các lớp (Assign Documents to Classes) */}
      <AssignDocumentsModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setDocsToAssign([]);
        }}
        documents={docsToAssign}
        onSuccess={(res) => {
          queryClient.invalidateQueries({ queryKey: ['teacher-documents'] });
          queryClient.invalidateQueries({ queryKey: ['teacher-class-materials-view'] });
          success(
            res.message ||
              `Cấp quyền thành công cho ${docsToAssign.length} tài liệu vào các lớp học!`,
          );
          setSelectedDocIds([]);
        }}
      />


      {/* MODAL: Upload tài liệu mới */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        categoriesTree={categoriesTree}
        initialCategoryId={selectedCategoryId}
        onSuccess={(newDoc) => {
          queryClient.invalidateQueries({ queryKey: ['teacher-documents'] });
          queryClient.invalidateQueries({ queryKey: ['teacher-document-categories'] });
          success(`Tải lên tài liệu "${newDoc.title}" thành công!`);
        }}
      />

      {/* MODAL: Tạo hoặc Chỉnh sửa danh mục */}
      <CategoryModal
        isOpen={categoryModalState.isOpen}
        onClose={() => setCategoryModalState({ isOpen: false })}
        categoriesTree={categoriesTree}
        categoryToEdit={categoryModalState.categoryToEdit}
        initialParentId={categoryModalState.initialParentId}
        isLoading={createCategoryMutation.isPending || updateCategoryMutation.isPending}
        onSubmit={async (dto) => {
          if (categoryModalState.categoryToEdit) {
            await updateCategoryMutation.mutateAsync({
              id: categoryModalState.categoryToEdit.id,
              dto: dto as UpdateCategoryDto,
            });
          } else {
            await createCategoryMutation.mutateAsync(dto as CreateCategoryDto);
          }
        }}
      />

      {/* MODAL: Chỉnh sửa tài liệu */}
      {docToEdit && (
        <DocumentEditModal
          isOpen={!!docToEdit}
          onClose={() => setDocToEdit(null)}
          document={docToEdit}
          categoriesTree={categoriesTree}
          isLoading={updateDocumentMutation.isPending}
          onSubmit={async (id, dto) => {
            await updateDocumentMutation.mutateAsync({ id, dto });
          }}
        />
      )}

      {/* MODAL: Xem trước / Tải file */}
      {docToPreview && (
        <DocumentPreviewModal
          isOpen={!!docToPreview}
          onClose={() => setDocToPreview(null)}
          document={docToPreview}
        />
      )}

      {/* MODAL: Chia sẻ tài liệu vào lớp / buổi học */}
      {docToShare && (
        <ShareDocumentModal
          isOpen={!!docToShare}
          onClose={() => setDocToShare(null)}
          document={docToShare}
          onSuccess={(msg) => {
            queryClient.invalidateQueries({ queryKey: ['teacher-documents'] });
            success(msg);
          }}
        />
      )}

      {/* MODAL: Xác nhận xóa tài liệu */}
      {docToDelete && (
        <Modal
          isOpen={!!docToDelete}
          onClose={() => setDocToDelete(null)}
          title="Xác nhận xóa tài liệu"
          description={`Bạn có chắc chắn muốn xóa tài liệu "${docToDelete.title}"?`}
          maxWidth="sm"
        >
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <p className="font-semibold mb-1">Chính sách bảo vệ dữ liệu:</p>
              <p>
                Nếu tài liệu đang được liên kết trong lớp hoặc buổi học, tài liệu sẽ chỉ bị ẩn khỏi thư viện của bạn mà không làm ảnh hưởng đến học sinh đang sử dụng.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDocToDelete(null)}
                disabled={deleteDocumentMutation.isPending}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={deleteDocumentMutation.isPending}
                onClick={() => deleteDocumentMutation.mutate(docToDelete.id)}
              >
                Xóa tài liệu
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Xác nhận xóa danh mục */}
      {categoryToDelete && (
        <Modal
          isOpen={!!categoryToDelete}
          onClose={() => setCategoryToDelete(null)}
          title="Xác nhận xóa danh mục"
          description={`Bạn có chắc chắn muốn xóa danh mục "${categoryToDelete.name}"?`}
          maxWidth="sm"
        >
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed">
              <p className="font-semibold mb-1">Chính sách an toàn hệ thống:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Các tài liệu trong danh mục này sẽ được chuyển an toàn về mục "Chưa phân loại".</li>
                <li>Các thư mục con sẽ được đưa lên cấp cha của thư mục này.</li>
                <li>Tệp tin gốc lưu trên Cloudflare R2 được giữ nguyên vẹn.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCategoryToDelete(null)}
                disabled={deleteCategoryMutation.isPending}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={deleteCategoryMutation.isPending}
                onClick={() => deleteCategoryMutation.mutate(categoryToDelete.id)}
              >
                Xác nhận xóa
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
