import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { StudentDocumentsPage } from './StudentDocumentsPage';

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
}));

describe('StudentDocumentsPage', () => {
  it('renders student documents page with title and document cards', () => {
    render(
      <MemoryRouter>
        <StudentDocumentsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Tài liệu học tập')).toBeInTheDocument();
    expect(
      screen.getByText(/Nắm chắc trọng tâm, vững vàng chinh phục điểm 8\+ môn Văn/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Đề cương tổng hợp kiến thức Ngữ Văn 12 - Ôn thi THPT Quốc Gia'),
    ).toBeInTheDocument();
  });

  it('filters by category when clicking category pill', async () => {
    render(
      <MemoryRouter>
        <StudentDocumentsPage />
      </MemoryRouter>,
    );

    const vanMauPill = screen.getByRole('button', { name: /Văn mẫu chọn lọc/i });
    await userEvent.click(vanMauPill);

    expect(
      screen.getByText('Tuyển tập 25 bài văn mẫu phân tích truyện ngắn Vợ chồng A Phủ'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Giáo án điện tử: Tùy bút Người lái đò Sông Đà (Nguyễn Tuân)'),
    ).not.toBeInTheDocument();
  });

  it('opens preview modal when clicking "Đọc"', async () => {
    render(
      <MemoryRouter>
        <StudentDocumentsPage />
      </MemoryRouter>,
    );

    const readButtons = screen.getAllByRole('button', { name: /Đọc/i });
    await userEvent.click(readButtons[0]);

    expect(screen.getByText(/Nội dung trọng tâm & Gợi ý học/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mở tài liệu toàn màn hình/i })).toBeInTheDocument();
  });
});
