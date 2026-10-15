export type DocumentCategory =
  | 'DE_CUONG'
  | 'GIAO_AN'
  | 'VAN_MAU'
  | 'DE_THI'
  | 'CHUYEN_DE';

export type DocumentFileType = 'pdf' | 'docx' | 'pptx' | 'link' | 'video';

export interface DocumentItem {
  id: string;
  title: string;
  description?: string;
  category: DocumentCategory;
  fileType: DocumentFileType;
  fileUrl: string;
  fileSize?: string;
  targetClassName: string;
  targetClassId?: string;
  authorName: string;
  createdAt: string;
  downloadsCount: number;
  viewsCount: number;
}

export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  DE_CUONG: 'Đề cương & Tóm tắt',
  GIAO_AN: 'Giáo án & Bài giảng',
  VAN_MAU: 'Văn mẫu chọn lọc',
  DE_THI: 'Đề thi & Hướng dẫn',
  CHUYEN_DE: 'Chuyên đề ôn tập',
};

export const CATEGORY_BADGE_VARIANTS: Record<
  DocumentCategory,
  'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
> = {
  DE_CUONG: 'primary',
  GIAO_AN: 'info',
  VAN_MAU: 'warning',
  DE_THI: 'danger',
  CHUYEN_DE: 'success',
};
