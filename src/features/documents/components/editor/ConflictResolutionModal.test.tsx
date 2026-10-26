import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConflictResolutionModal } from './ConflictResolutionModal';

describe('ConflictResolutionModal', () => {
  const mockOnReloadServer = vi.fn();
  const mockOnKeepLocal = vi.fn();
  const mockGetLocalText = vi.fn().mockReturnValue('Nội dung bản địa');

  const mockWriteText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockWriteText,
      },
      configurable: true,
      writable: true,
    });
  });

  it('renders conflict details with revisions', () => {
    render(
      <ConflictResolutionModal
        isOpen={true}
        serverRevision={4}
        expectedRevision={2}
        onReloadServer={mockOnReloadServer}
        onKeepLocal={mockOnKeepLocal}
        getLocalText={mockGetLocalText}
      />,
    );

    expect(screen.getByText('Xung đột phiên bản tài liệu (Revision Conflict)')).toBeInTheDocument();
    expect(screen.getByText(/rev 2/i)).toBeInTheDocument();
    expect(screen.getByText(/rev 4/i)).toBeInTheDocument();
  });

  it('copies local text to clipboard when copy button is clicked', () => {
    render(
      <ConflictResolutionModal
        isOpen={true}
        serverRevision={4}
        expectedRevision={2}
        onReloadServer={mockOnReloadServer}
        onKeepLocal={mockOnKeepLocal}
        getLocalText={mockGetLocalText}
      />,
    );

    const copyBtn = screen.getByRole('button', {
      name: /Sao chép văn bản đang soạn vào Clipboard/i,
    });
    fireEvent.click(copyBtn);

    expect(mockGetLocalText).toHaveBeenCalled();
    expect(mockWriteText).toHaveBeenCalledWith('Nội dung bản địa');
    expect(
      screen.getByText('Đã sao chép văn bản vào clipboard!'),
    ).toBeInTheDocument();
  });

  it('calls onReloadServer when reload button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ConflictResolutionModal
        isOpen={true}
        serverRevision={4}
        expectedRevision={2}
        onReloadServer={mockOnReloadServer}
        onKeepLocal={mockOnKeepLocal}
        getLocalText={mockGetLocalText}
      />,
    );

    const reloadBtn = screen.getByRole('button', { name: /Tải bản mới từ máy chủ/i });
    await user.click(reloadBtn);

    expect(mockOnReloadServer).toHaveBeenCalled();
  });

  it('calls onKeepLocal when keep local button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ConflictResolutionModal
        isOpen={true}
        serverRevision={4}
        expectedRevision={2}
        onReloadServer={mockOnReloadServer}
        onKeepLocal={mockOnKeepLocal}
        getLocalText={mockGetLocalText}
      />,
    );

    const keepBtn = screen.getByRole('button', { name: /Ghi đè bản của tôi lên máy chủ/i });
    await user.click(keepBtn);

    expect(mockOnKeepLocal).toHaveBeenCalled();
  });
});
