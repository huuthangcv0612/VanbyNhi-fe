import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

describe('Button', () => {
  it('renders button text correctly', () => {
    render(<Button>Đăng nhập</Button>);
    expect(screen.getByRole('button', { name: /đăng nhập/i })).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Nhấn vào đây</Button>);

    await userEvent.click(screen.getByRole('button', { name: /nhấn vào đây/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state and disables button', () => {
    render(<Button isLoading>Đang lưu...</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('respects disabled prop', async () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Không thể bấm
      </Button>,
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });
});
