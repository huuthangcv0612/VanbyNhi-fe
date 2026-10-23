import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingScreen, LoadingSpinner } from './LoadingScreen';

describe('LoadingScreen', () => {
  it('renders brand name and default loading message', () => {
    render(<LoadingScreen />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^vanbynhi$/i })).toBeInTheDocument();
    expect(screen.getByText(/đang tải dữ liệu.../i)).toBeInTheDocument();
  });

  it('renders custom message and respects showBrand prop', () => {
    render(<LoadingScreen message="Đang khởi tạo ứng dụng..." showBrand={false} />);

    expect(screen.getByText(/đang khởi tạo ứng dụng.../i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /^vanbynhi$/i })).not.toBeInTheDocument();
  });

  it('renders LoadingSpinner correctly with default and custom sizes', () => {
    const { container, rerender } = render(<LoadingSpinner />);
    expect(container.querySelector('[role="status"]')).toBeInTheDocument();

    rerender(<LoadingSpinner size="lg" />);
    expect(container.querySelector('.w-8.h-8')).toBeInTheDocument();
  });
});
