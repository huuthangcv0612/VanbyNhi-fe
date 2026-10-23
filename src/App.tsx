import { AppProviders } from '@/app/providers';
import { AppRouter } from '@/app/router';
import { PWAInstallBanner } from '@/components/pwa/PWAInstallBanner';
import { InitialPageLoader } from '@/components/feedback/InitialPageLoader';

export function App() {
  return (
    <AppProviders>
      <InitialPageLoader>
        <AppRouter />
        <PWAInstallBanner />
      </InitialPageLoader>
    </AppProviders>
  );
}

export default App;
