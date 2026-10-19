import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PWAInstallButton } from './PWAInstallButton';
import * as usePWAModule from '@/hooks/usePWA';

describe('PWAInstallButton component', () => {
  const mockPromptInstall = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing if not installable and not iOS', () => {
    vi.spyOn(usePWAModule, 'usePWA').mockReturnValue({
      isInstalled: false,
      isStandalone: false,
      canInstall: false,
      isIOS: false,
      isSupported: true,
      isInstalling: false,
      installError: null,
      isDismissed: false,
      promptInstall: mockPromptInstall,
      dismissBanner: vi.fn(),
      resetDismiss: vi.fn(),
    });

    const { container } = render(<PWAInstallButton />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders install button and triggers prompt when clicked', async () => {
    vi.spyOn(usePWAModule, 'usePWA').mockReturnValue({
      isInstalled: false,
      isStandalone: false,
      canInstall: true,
      isIOS: false,
      isSupported: true,
      isInstalling: false,
      installError: null,
      isDismissed: false,
      promptInstall: mockPromptInstall,
      dismissBanner: vi.fn(),
      resetDismiss: vi.fn(),
    });

    render(<PWAInstallButton />);

    const btn = screen.getByRole('button', { name: /cài đặt ứng dụng/i });
    expect(btn).toBeInTheDocument();

    await userEvent.click(btn);
    expect(mockPromptInstall).toHaveBeenCalledTimes(1);
  });

  it('displays installed badge when showWhenInstalled is true and app is installed', () => {
    vi.spyOn(usePWAModule, 'usePWA').mockReturnValue({
      isInstalled: true,
      isStandalone: false,
      canInstall: false,
      isIOS: false,
      isSupported: true,
      isInstalling: false,
      installError: null,
      isDismissed: false,
      promptInstall: mockPromptInstall,
      dismissBanner: vi.fn(),
      resetDismiss: vi.fn(),
    });

    render(<PWAInstallButton showWhenInstalled={true} />);
    expect(screen.getByText(/đã cài ứng dụng/i)).toBeInTheDocument();
  });
});
