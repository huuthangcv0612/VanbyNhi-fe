import React, { useState } from 'react';
import {
  FolderOpen,
  Plus,
  Search,
  Download,
  Trash2,
  Users,
  Eye,
  Copy,
  ExternalLink,
  Check,
  HardDrive,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useToast } from '@/hooks/useToast';
import { formatDate } from '@/utils/formatters';
import { INITIAL_DOCUMENTS } from '../data/mock-documents';
import {
  type DocumentItem,
  type DocumentCategory,
  type DocumentFileType,
  CATEGORY_LABELS,
  CATEGORY_BADGE_VARIANTS,
} from '../types/document.types';

export function TeacherDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<DocumentCategory>('DE_CUONG');
  const [newFileType, setNewFileType] = useState<DocumentFileType>('pdf');
  const [newTargetClass, setNewTargetClass] = useState('Lớp Luyện thi THPTQG 12A1');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [newFileSize, setNewFileSize] = useState('2.5 MB');

  const { success, info } = useToast();

  // Statistics
  const totalDocs = documents.length;
  const totalDownloads = documents.reduce((sum, d) => sum + d.downloadsCount, 0);
  const uniqueClassesCount = new Set(documents.map((d) => d.targetClassName)).size;

  // Filtered documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      doc.targetClassName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || doc.category === selectedCategory;
    const matchesClass = selectedClass === 'ALL' || doc.targetClassName === selectedClass;

    return matchesSearch && matchesCategory && matchesClass;
  });

  const availableClasses = Array.from(new Set(documents.map((d) => d.targetClassName)));

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      return;
    }

    const created: DocumentItem = {
      id: `doc-${Date.now()}`,
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      category: newCategory,
      fileType: newFileType,
      fileUrl: newFileUrl.trim() || 'https://vanbynhi.edu.vn/materials/sample-document.pdf',
      fileSize: newFileSize || '1.5 MB',
      targetClassName: newTargetClass,
      authorName: 'Cô Trần Ánh Nhi',
      createdAt: new Date().toISOString(),
      downloadsCount: 0,
      viewsCount: 0,
    };

    setDocuments([created, ...documents]);
    setIsUploadModalOpen(false);
    success('Đã tải lên và chia sẻ tài liệu thành công!', 'Thành công');

    // Reset form
    setNewTitle('');
    setNewDescription('');
    setNewFileUrl('');
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    setDeleteDocId(null);
    info('Đã xóa tài liệu khỏi hệ thống.');
  };

  const handleCopyLink = (doc: DocumentItem) => {
    navigator.clipboard?.writeText(doc.fileUrl);
    setCopiedId(doc.id);
    success('Đã sao chép liên kết tài liệu vào bộ nhớ tạm.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getFileTypeIcon = (type: DocumentFileType) => {
    switch (type) {
      case 'pdf':
        return <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">PDF</span>;
      case 'docx':
        return <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">DOCX</span>;
      case 'pptx':
        return <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">PPTX</span>;
      default:
        return <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">FILE</span>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý tài liệu giảng dạy"
        description="Kho lưu trữ tài liệu, giáo án, đề cương và bài giảng ôn tập môn Ngữ Văn dành cho học sinh"
        action={
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsUploadModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Tải tài liệu mới
          </Button>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Tổng số tài liệu</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalDocs}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
              <FolderOpen className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Lượt tải & Xem</p>
              <h3 className="text-2xl font-bold text-emerald-700 mt-1">{totalDownloads}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <Download className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Lớp học tiếp cận</p>
              <h3 className="text-2xl font-bold text-blue-700 mt-1">{uniqueClassesCount} lớp</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Dung lượng ước tính</p>
              <h3 className="text-2xl font-bold text-purple-700 mt-1">25.6 MB</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên tài liệu, tác phẩm, lớp..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="ALL">Tất cả phân loại</option>
              {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
                <option key={cat} value={cat}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="ALL">Tất cả các lớp</option>
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Document Table */}
      <div className="space-y-4">
        {filteredDocuments.length === 0 ? (
          <EmptyState
            icon={<FolderOpen className="w-8 h-8 text-slate-400" />}
            title="Không tìm thấy tài liệu phù hợp"
            description="Hãy thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc phân loại."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tài liệu</TableHead>
                <TableHead>Phân loại</TableHead>
                <TableHead>Lớp áp dụng</TableHead>
                <TableHead>Dung lượng</TableHead>
                <TableHead>Ngày đăng</TableHead>
                <TableHead>Lượt tải</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => (
                <TableRow key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                  <TableCell>
                    <div className="flex items-start gap-2.5 max-w-sm sm:max-w-md">
                      <div className="mt-0.5 shrink-0">{getFileTypeIcon(doc.fileType)}</div>
                      <div>
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc)}
                          className="font-semibold text-slate-900 hover:text-amber-700 text-left line-clamp-2 transition-colors cursor-pointer"
                        >
                          {doc.title}
                        </button>
                        {doc.description && (
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                            {doc.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={CATEGORY_BADGE_VARIANTS[doc.category]} size="sm">
                      {CATEGORY_LABELS[doc.category]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {doc.targetClassName}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-500">{doc.fileSize || 'N/A'}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-500">{formatDate(doc.createdAt)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs text-slate-600 font-medium">
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                      <span>{doc.downloadsCount}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyLink(doc)}
                        className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Sao chép liên kết"
                      >
                        {copiedId === doc.id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteDocId(doc.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Xóa tài liệu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Modal: Tải lên tài liệu mới */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Tải lên tài liệu giảng dạy mới"
        description="Điền thông tin và liên kết tệp tài liệu để chia sẻ cho học sinh các lớp."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateDocument} className="space-y-4">
          <Input
            label="Tiêu đề tài liệu *"
            placeholder="VD: Đề cương ôn thi THPT Quốc Gia môn Ngữ Văn 2026"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Phân loại tài liệu
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as DocumentCategory)}
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
                  <option key={cat} value={cat}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Định dạng tệp
              </label>
              <select
                value={newFileType}
                onChange={(e) => setNewFileType(e.target.value as DocumentFileType)}
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="pdf">Tài liệu PDF (.pdf)</option>
                <option value="docx">Word (.docx)</option>
                <option value="pptx">PowerPoint (.pptx)</option>
                <option value="link">Đường dẫn Google Drive / Web</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Lớp áp dụng
              </label>
              <select
                value={newTargetClass}
                onChange={(e) => setNewTargetClass(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Tất cả các lớp">Tất cả các lớp</option>
                <option value="Lớp Luyện thi THPTQG 12A1">Lớp Luyện thi THPTQG 12A1</option>
                <option value="Lớp Chuyên đề Nghị luận xã hội">Lớp Chuyên đề Nghị luận xã hội</option>
                <option value="Lớp Văn Chuyên Sâu 12">Lớp Văn Chuyên Sâu 12</option>
              </select>
            </div>

            <Input
              label="Dung lượng file (ước tính)"
              placeholder="VD: 3.2 MB"
              value={newFileSize}
              onChange={(e) => setNewFileSize(e.target.value)}
            />
          </div>

          <Input
            label="Liên kết tệp hoặc Google Drive"
            placeholder="https://drive.google.com/... hoặc đường dẫn tài liệu"
            value={newFileUrl}
            onChange={(e) => setNewFileUrl(e.target.value)}
          />

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Mô tả ngắn & Hướng dẫn học sinh
            </label>
            <textarea
              rows={3}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Ghi chú nội dung trọng tâm, yêu cầu chuẩn bị trước khi lên lớp..."
              className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsUploadModalOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Lưu và Tải lên
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Xem trước tài liệu */}
      {previewDoc && (
        <Modal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc.title}
          description={`Phân loại: ${CATEGORY_LABELS[previewDoc.category]} • Lớp: ${previewDoc.targetClassName}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            {previewDoc.description && (
              <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-100 text-xs sm:text-sm text-slate-700 leading-relaxed">
                {previewDoc.description}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="font-semibold text-slate-700">Người đăng:</span>{' '}
                {previewDoc.authorName}
              </div>
              <div>
                <span className="font-semibold text-slate-700">Ngày đăng:</span>{' '}
                {formatDate(previewDoc.createdAt)}
              </div>
              <div>
                <span className="font-semibold text-slate-700">Dung lượng:</span>{' '}
                {previewDoc.fileSize || 'N/A'}
              </div>
              <div>
                <span className="font-semibold text-slate-700">Lượt tải:</span>{' '}
                {previewDoc.downloadsCount} lượt
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyLink(previewDoc)}
                leftIcon={<Copy className="w-3.5 h-3.5" />}
              >
                Sao chép liên kết
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  window.open(previewDoc.fileUrl, '_blank');
                  success('Đang mở tài liệu...');
                }}
                leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
              >
                Mở tài liệu
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal xác nhận xóa */}
      {deleteDocId && (
        <Modal
          isOpen={!!deleteDocId}
          onClose={() => setDeleteDocId(null)}
          title="Xác nhận xóa tài liệu"
          description="Bạn có chắc chắn muốn xóa tài liệu này? Học sinh trong lớp sẽ không còn nhìn thấy tài liệu này nữa."
          maxWidth="sm"
        >
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteDocId(null)}>
              Hủy bỏ
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDeleteDocument(deleteDocId)}
            >
              Xóa vĩnh viễn
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
