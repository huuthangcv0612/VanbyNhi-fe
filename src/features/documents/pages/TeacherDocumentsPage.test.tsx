import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { TeacherDocumentsPage } from './TeacherDocumentsPage';

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
}));

describe('TeacherDocumentsPage', () => {
  it('renders teacher documents page with header and documents table', () => {
    render(
      <MemoryRouter>
        <TeacherDocumentsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Quản lý tài liệu giảng dạy')).toBeInTheDocument();
    expect(screen.getByText('Tải tài liệu mới')).toBeInTheDocument();
    expect(screen.getByText(/Tổng số tài liệu/i)).toBeInTheDocument();
    expect(screen.getByText('Đề cương tổng hợp kiến thức Ngữ Văn 12 - Ôn thi THPT Quốc Gia')).toBeInTheDocument();
  });

  it('filters documents when search text is typed', async () => {
    render(
      <MemoryRouter>
        <TeacherDocumentsPage />
      </MemoryRouter>,
    );

    const searchInput = screen.getByPlaceholderText(/Tìm kiếm theo tên tài liệu/i);
    await userEvent.type(searchInput, 'Người lái đò Sông Đà');

    expect(screen.getByText(/Người lái đò Sông Đà/i)).toBeInTheDocument();
    expect(
      screen.queryByText('Tuyển tập 25 bài văn mẫu phân tích truyện ngắn Vợ chồng A Phủ'),
    ).not.toBeInTheDocument();
  });

  it('opens upload modal when clicking "Tải tài liệu mới"', async () => {
    render(
      <MemoryRouter>
        <TeacherDocumentsPage />
      </MemoryRouter>,
    );

    const uploadBtn = screen.getByRole('button', { name: /Tải tài liệu mới/i });
    await userEvent.click(uploadBtn);

    expect(screen.getByText('Tải lên tài liệu giảng dạy mới')).toBeInTheDocument();
    expect(screen.getByLabelText(/Tiêu đề tài liệu/i)).toBeInTheDocument();
  });
});
