import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PWAInstallBanner } from './PWAInstallBanner';
import * as usePWAModule from '@/hooks/usePWA';

describe('PWAInstallBanner component', () => {
  const mockPromptInstall = vi.fn();
  const mockDismissBanner = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when app is already installed or in standalone mode', () => {
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
      dismissBanner: mockDismissBanner,
      resetDismiss: vi.fn(),
    });

    const { container } = render(<PWAInstallBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders banner when canInstall is true and user can install', async () => {
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
      dismissBanner: mockDismissBanner,
      resetDismiss: vi.fn(),
    });

    render(<PWAInstallBanner />);

    expect(screen.getByText('Cài đặt VanbyNhi')).toBeInTheDocument();
    const installBtn = screen.getByRole('button', { name: /cài đặt ngay/i });
    expect(installBtn).toBeInTheDocument();

    await userEvent.click(installBtn);
    expect(mockPromptInstall).toHaveBeenCalledTimes(1);
  });

  it('calls dismissBanner when user clicks Để sau or close button', async () => {
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
      dismissBanner: mockDismissBanner,
      resetDismiss: vi.fn(),
    });

    render(<PWAInstallBanner />);

    const dismissBtn = screen.getByRole('button', { name: /^để sau$/i });
    await userEvent.click(dismissBtn);
    expect(mockDismissBanner).toHaveBeenCalled();
  });
});
