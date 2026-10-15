import type { LegacyDocumentCategory, DocumentFileType } from '../types/document.types';

export interface StudentMockDocumentItem {
  id: string;
  title: string;
  description?: string;
  category: LegacyDocumentCategory;
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

export const INITIAL_DOCUMENTS: StudentMockDocumentItem[] = [
  {
    id: 'doc-1',
    title: 'Đề cương tổng hợp kiến thức Ngữ Văn 12 - Ôn thi THPT Quốc Gia',
    description: 'Hệ thống hóa toàn bộ kiến thức tác phẩm văn học lớp 12, sơ đồ tư duy phân tích hình tượng nhân vật và hệ thống luận điểm chính.',
    category: 'DE_CUONG',
    fileType: 'pdf',
    fileUrl: 'https://example.com/tai-lieu-van-12.pdf',
    fileSize: '3.4 MB',
    targetClassName: 'Lớp Luyện thi THPTQG 12A1',
    targetClassId: 'cls-1',
    authorName: 'Cô Trần Ánh Nhi',
    createdAt: '2026-03-10T08:30:00Z',
    downloadsCount: 142,
    viewsCount: 389,
  },
  {
    id: 'doc-2',
    title: 'Chuyên đề: Kỹ năng viết đoạn văn Nghị luận xã hội 200 chữ điểm 9+',
    description: 'Bí quyết lập luận chặt chẽ, dẫn chứng xác thực, công thức viết mở - thân - kết thu hút người chấm thi.',
    category: 'CHUYEN_DE',
    fileType: 'pdf',
    fileUrl: 'https://example.com/nghi-luan-xa-hoi.pdf',
    fileSize: '2.1 MB',
    targetClassName: 'Lớp Chuyên đề Nghị luận xã hội',
    targetClassId: 'cls-2',
    authorName: 'Cô Trần Ánh Nhi',
    createdAt: '2026-03-12T14:15:00Z',
    downloadsCount: 98,
    viewsCount: 275,
  },
  {
    id: 'doc-3',
    title: 'Tuyển tập 25 bài văn mẫu phân tích truyện ngắn Vợ chồng A Phủ',
    description: 'Các bài viết phân tích chi tiết sức sống tiềm tàng của nhân vật Mị, nghệ thuật miêu tả tâm lý và bối cảnh Hồng Ngài.',
    category: 'VAN_MAU',
    fileType: 'docx',
    fileUrl: 'https://example.com/van-mau-vo-chong-a-phu.docx',
    fileSize: '1.8 MB',
    targetClassName: 'Lớp Luyện thi THPTQG 12A1',
    targetClassId: 'cls-1',
    authorName: 'Thầy Hoàng Văn Nam',
    createdAt: '2026-03-15T09:00:00Z',
    downloadsCount: 215,
    viewsCount: 512,
  },
  {
    id: 'doc-4',
    title: 'Giáo án điện tử: Tùy bút Người lái đò Sông Đà (Nguyễn Tuân)',
    description: 'Bài giảng trực quan sinh động với hình ảnh tư liệu, video minh họa sông Đà hung bạo và trữ tình, phân tích vẻ đẹp ông lái đò.',
    category: 'GIAO_AN',
    fileType: 'pptx',
    fileUrl: 'https://example.com/nguoi-lai-do-song-da.pptx',
    fileSize: '12.6 MB',
    targetClassName: 'Lớp Văn Chuyên Sâu 12',
    targetClassId: 'cls-3',
    authorName: 'Cô Trần Ánh Nhi',
    createdAt: '2026-03-20T11:45:00Z',
    downloadsCount: 76,
    viewsCount: 198,
  },
  {
    id: 'doc-5',
    title: 'Bộ đề thi thử Ngữ Văn THPT Quốc Gia chuẩn cấu trúc Bộ GD&ĐT 2026',
    description: '10 đề thi kèm hướng dẫn chấm chi tiết, barem điểm từng câu Đọc hiểu và Làm văn.',
    category: 'DE_THI',
    fileType: 'pdf',
    fileUrl: 'https://example.com/bo-de-thi-thu-2026.pdf',
    fileSize: '4.5 MB',
    targetClassName: 'Tất cả các lớp',
    authorName: 'Tổ Chuyên Môn Văn',
    createdAt: '2026-03-22T16:00:00Z',
    downloadsCount: 310,
    viewsCount: 840,
  },
  {
    id: 'doc-6',
    title: 'Sổ tay dẫn chứng thời sự & Danh ngôn đắt giá cho bài văn Nghị luận',
    description: 'Tổng hợp hơn 100 dẫn chứng người thật việc thật, các câu chuyện truyền cảm hứng và danh ngôn đa chủ đề.',
    category: 'DE_CUONG',
    fileType: 'docx',
    fileUrl: 'https://example.com/so-tay-dan-chung.docx',
    fileSize: '1.2 MB',
    targetClassName: 'Tất cả các lớp',
    authorName: 'Cô Trần Ánh Nhi',
    createdAt: '2026-03-25T10:20:00Z',
    downloadsCount: 185,
    viewsCount: 460,
  },
];
