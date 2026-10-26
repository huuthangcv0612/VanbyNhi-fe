export interface DocumentCategory {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentCategoryTreeNode extends DocumentCategory {
  documentCount: number;
  subCategoryCount: number;
  children: DocumentCategoryTreeNode[];
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  parentId?: string;
  sortOrder?: number;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  parentId?: string | null;
  sortOrder?: number;
}

export type DocumentType = 'STATIC_FILE' | 'STRUCTURED_NOTE';
export type DocumentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type DocumentExportFormat = 'DOCX' | 'PDF';
export type DocumentExportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface DocumentItem {
  id: string;
  title: string;
  description: string | null;
  originalName?: string | null;
  storageKey?: string | null;
  mimeType: string;
  sizeBytes: number;
  ownerId: string;
  categoryId: string | null;
  type?: DocumentType;
  status?: DocumentStatus;
  revision?: number;
  content?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  category?: {
    id: string;
    name: string;
    parentId?: string | null;
  } | null;
  usedInCount?: number;
}

export type DocumentEntity = DocumentItem;

export interface CreateDocumentDto {
  title: string;
  description?: string;
  categoryId?: string | null;
  status?: DocumentStatus;
  content?: Record<string, any>;
}

export interface UpdateDocumentContentDto {
  expectedRevision: number;
  content: Record<string, any>;
  versionReason?: string;
}

export interface UpdateDocumentContentResponse {
  message: string;
  revision: number;
  updatedAt: string;
}

export interface RevisionConflictError {
  statusCode: 409;
  error: 'Conflict';
  errorCode: 'REVISION_CONFLICT';
  message: string;
  currentRevision: number | null;
  expectedRevision: number;
}

export interface DocumentVersionEntity {
  id: string;
  documentId: string;
  revision: number;
  title: string;
  reason: string | null;
  createdAt: string;
  actor: {
    id: string;
    fullName: string;
    role: string;
  };
}

export interface DocumentVersionsResponse {
  items: DocumentVersionEntity[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ImportDocumentDto {
  storageKey: string;
  title?: string;
  categoryId?: string | null;
}

export interface ImportDocumentResponse {
  message: string;
  document: DocumentEntity;
  warnings?: string[];
}

export interface ExportDocumentDto {
  format: DocumentExportFormat;
}

export interface ExportResponse {
  jobId: string;
  status: DocumentExportStatus;
  format: DocumentExportFormat;
  revision: number;
  downloadUrl?: string | null;
  expiresInSeconds?: number | null;
  errorMessage?: string | null;
  createdAt?: string;
}

export interface InitUploadDto {
  title: string;
  description?: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  categoryId?: string;
}

export interface InitUploadResponse {
  uploadUrl: string;
  storageKey: string;
  uploadSessionId: string;
  expiresInSeconds: number;
  requiredHeaders?: Record<string, string>;
}

export interface CompleteUploadDto {
  storageKey: string;
}

export interface QueryDocumentsParams {
  search?: string;
  categoryId?: string;
  unclassifiedOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface DocumentsListResponse {
  items: DocumentItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DocumentDownloadUrlResponse {
  downloadUrl: string;
  expiresInSeconds: number;
  title: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface UpdateDocumentDto {
  title?: string;
  description?: string;
  categoryId?: string | null;
}

export interface ShareMaterialDto {
  documentId: string;
  title?: string;
  description?: string;
  isPublished?: boolean;
  order?: number;
  accessStartTime?: string;
  accessEndTime?: string;
}

export interface AssignDocumentsToClassesDto {
  documentIds: string[];
  classIds: string[];
  isPublished?: boolean;
  accessStartTime?: string;
  accessEndTime?: string;
}

export interface AssignDocumentsToClassesResponse {
  message: string;
  assignedCount: number;
  materials: ClassMaterialItem[];
}

export interface QueryStudentClassMaterialsParams {
  page?: number;
  limit?: number;
  search?: string;
  isPublished?: boolean;
}

export interface ClassMaterialItem {
  id: string;
  classId: string;
  sessionId: string | null;
  documentId: string | null;
  uploadedById: string;
  title: string;
  description: string | null;
  type: string;
  originalName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  isPublished: boolean;
  publishedAt: string | null;
  order: number;
  accessStartTime: string | null;
  accessEndTime: string | null;
  createdAt: string;
  updatedAt: string;
  document?: {
    id: string;
    title: string;
    storageKey: string;
    sizeBytes: number;
  } | null;
  class?: {
    id: string;
    name: string;
  } | null;
  session?: {
    id: string;
    title: string;
  } | null;
}

export interface ClassMaterialsListResponse {
  items: ClassMaterialItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Student & legacy UI helpers
export type LegacyDocumentCategory =
  | 'DE_CUONG'
  | 'GIAO_AN'
  | 'VAN_MAU'
  | 'DE_THI'
  | 'CHUYEN_DE';

export type DocumentFileType = 'pdf' | 'docx' | 'pptx' | 'link' | 'video';

export const CATEGORY_LABELS: Record<LegacyDocumentCategory, string> = {
  DE_CUONG: 'Đề cương & Tóm tắt',
  GIAO_AN: 'Giáo án & Bài giảng',
  VAN_MAU: 'Văn mẫu chọn lọc',
  DE_THI: 'Đề thi & Hướng dẫn',
  CHUYEN_DE: 'Chuyên đề ôn tập',
};

export const CATEGORY_BADGE_VARIANTS: Record<
  LegacyDocumentCategory,
  'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
> = {
  DE_CUONG: 'primary',
  GIAO_AN: 'info',
  VAN_MAU: 'warning',
  DE_THI: 'danger',
  CHUYEN_DE: 'success',
};

