import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Download,
  Eye,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  ExternalLink,
  User,
  GraduationCap,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useToast } from '@/hooks/useToast';
import { formatDate } from '@/utils/formatters';
import { INITIAL_DOCUMENTS } from '../data/mock-documents';
import {
  type DocumentItem,
  type DocumentFileType,
  CATEGORY_LABELS,
  CATEGORY_BADGE_VARIANTS,
} from '../types/document.types';

export function StudentDocumentsPage() {
  const [documents] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [savedDocIds, setSavedDocIds] = useState<string[]>(['doc-1', 'doc-6']);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  const { success, info } = useToast();

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (savedDocIds.includes(id)) {
      setSavedDocIds(savedDocIds.filter((item) => item !== id));
      info('Đã bỏ lưu tài liệu');
    } else {
      setSavedDocIds([...savedDocIds, id]);
      success('Đã lưu vào danh sách tài liệu ôn tập của bạn!');
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      doc.authorName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || doc.category === selectedCategory;
    const matchesClass = selectedClass === 'ALL' || doc.targetClassName === selectedClass;

    return matchesSearch && matchesCategory && matchesClass;
  });

  const availableClasses = Array.from(new Set(documents.map((d) => d.targetClassName)));

  const getFileTypeBadge = (type: DocumentFileType) => {
    switch (type) {
      case 'pdf':
        return (
          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
            PDF
          </span>
        );
      case 'docx':
        return (
          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            DOCX
          </span>
        );
      case 'pptx':
        return (
          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            SLIDE
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            LINK
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tài liệu học tập"
        description="Kho tài liệu ôn tập môn Ngữ Văn, chuyên đề nghị luận, văn mẫu đạt điểm cao và đề thi thử chọn lọc"
      />

      {/* Hero Banner / Highlight */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-amber-700 via-amber-800 to-amber-900 text-white p-5 sm:p-7 shadow-sm">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-600/60 border border-amber-400/40 text-amber-100 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Kỳ thi THPT Quốc Gia 2026</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif tracking-tight">
            Nắm chắc trọng tâm, vững vàng chinh phục điểm 8+ môn Văn
          </h2>
          <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed">
            Học sinh được toàn quyền truy cập, đọc trực tuyến và tải về mọi tài liệu được giáo viên phụ trách phân bổ theo từng lớp học.
          </p>
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="space-y-3">
        {/* Search & Class Filter */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm tài liệu, tên tác phẩm, tác giả..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 shrink-0 hidden sm:inline">Lớp học:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-xs"
            >
              <option value="ALL">Tất cả lớp học</option>
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Categories Tab Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Tất cả ({documents.length})
          </button>
          {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
            const count = documents.filter((d) => d.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-800 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-amber-700 text-amber-100' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Document Grid */}
      {filteredDocuments.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-8 h-8 text-slate-400" />}
          title="Không tìm thấy tài liệu phù hợp"
          description="Hiện chưa có tài liệu nào trong phân loại hoặc từ khóa bạn vừa tìm."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
            const isSaved = savedDocIds.includes(doc.id);

            return (
              <Card
                key={doc.id}
                className="flex flex-col justify-between border-slate-200 hover:border-amber-300 hover:shadow-md transition-all duration-200 overflow-hidden group"
              >
                <div className="p-5 space-y-3">
                  {/* Card Header: Type Badge, Category, Bookmark */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {getFileTypeBadge(doc.fileType)}
                      <Badge variant={CATEGORY_BADGE_VARIANTS[doc.category]} size="sm">
                        {CATEGORY_LABELS[doc.category]}
                      </Badge>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => toggleBookmark(doc.id, e)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isSaved
                          ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                      }`}
                      title={isSaved ? 'Bỏ lưu' : 'Lưu tài liệu ôn tập'}
                    >
                      {isSaved ? (
                        <BookmarkCheck className="w-4 h-4 fill-amber-600" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3
                      onClick={() => setPreviewDoc(doc)}
                      className="font-bold text-slate-900 group-hover:text-amber-800 line-clamp-2 text-sm sm:text-base cursor-pointer transition-colors"
                    >
                      {doc.title}
                    </h3>
                    {doc.description && (
                      <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {doc.description}
                      </p>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="font-medium text-slate-700 truncate">{doc.targetClassName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {doc.authorName}
                      </span>
                      <span>{doc.fileSize || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Action Buttons */}
                <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    {formatDate(doc.createdAt)}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewDoc(doc)}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                    >
                      Đọc
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        window.open(doc.fileUrl, '_blank');
                        success(`Bắt đầu tải: ${doc.title}`);
                      }}
                      leftIcon={<Download className="w-3.5 h-3.5" />}
                    >
                      Tải về
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Xem trước tài liệu học tập */}
      {previewDoc && (
        <Modal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc.title}
          description={`Phân loại: ${CATEGORY_LABELS[previewDoc.category]} • Lớp: ${previewDoc.targetClassName}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Nội dung trọng tâm & Gợi ý học
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {previewDoc.description ||
                  'Tài liệu bao gồm dàn ý chi tiết, hệ thống luận điểm phân tích và các đoạn trích dẫn chứng tiêu biểu phục vụ làm văn.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="font-semibold text-slate-700">Giáo viên phụ trách:</span>{' '}
                {previewDoc.authorName}
              </div>
              <div>
                <span className="font-semibold text-slate-700">Ngày đăng:</span>{' '}
                {formatDate(previewDoc.createdAt)}
              </div>
              <div>
                <span className="font-semibold text-slate-700">Định dạng & Dung lượng:</span>{' '}
                {previewDoc.fileType.toUpperCase()} ({previewDoc.fileSize || 'N/A'})
              </div>
              <div>
                <span className="font-semibold text-slate-700">Lượt đọc & Tải:</span>{' '}
                {previewDoc.viewsCount} lượt
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setPreviewDoc(null)}>
                Đóng
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  window.open(previewDoc.fileUrl, '_blank');
                  success('Đang mở tài liệu toàn màn hình...');
                }}
                leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
              >
                Mở tài liệu toàn màn hình
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
